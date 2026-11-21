import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { verifyWebhookSignature } from '../services/paymentService.js';
import { handleIncomingWhatsAppMessage, sendWhatsAppNotification } from '../services/whatsappService.js';
import { query } from '../database/db.js';

/**
 * Meta WhatsApp Webhook Challenge Verification (GET)
 */
export function verifyWhatsAppWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful.');
    res.status(200).send(challenge);
  } else {
    console.warn('[WhatsApp Webhook] Token verification mismatch.');
    res.sendStatus(403);
  }
}

/**
 * Meta WhatsApp Inbound Message Handler (POST)
 */
export async function handleWhatsAppWebhook(req: Request, res: Response): Promise<void> {
  res.sendStatus(200); // Always respond 200 immediately to Meta

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageObj = value?.messages?.[0];

    if (messageObj && messageObj.type === 'text') {
      const fromPhone = messageObj.from;
      const text = messageObj.text?.body;

      if (text) {
        // Generate AI response
        const aiReply = await handleIncomingWhatsAppMessage(fromPhone, text);

        // Send back to WhatsApp user
        await sendWhatsAppNotification({
          phone: fromPhone,
          message: aiReply,
          type: 'AI_ASSISTANT_REPLY',
        });
      }
    }
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err.message);
  }
}

/**
 * Razorpay Signed Webhook Handler (POST)
 */
export async function handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Razorpay Webhook] Rejected: Invalid webhook signature.');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  const event = req.body.event;
  console.log(`[Razorpay Webhook] Received event: ${event}`);

  if (event === 'payment.captured') {
    const payment = req.body.payload.payment.entity;
    const rzpOrderId = payment.order_id;
    const rzpPaymentId = payment.id;

    await query(`
      UPDATE payments
      SET status = 'SUCCESS', razorpay_payment_id = $1, raw_response = $2, updated_at = NOW()
      WHERE razorpay_order_id = $3;
    `, [rzpPaymentId, JSON.stringify(payment), rzpOrderId]);
  } else if (event === 'payment.failed') {
    const payment = req.body.payload.payment.entity;
    await query(`
      UPDATE payments
      SET status = 'FAILED', error_code = $1, error_description = $2, updated_at = NOW()
      WHERE razorpay_order_id = $3;
    `, [payment.error_code, payment.error_description, payment.order_id]);
  }

  res.json({ status: 'ok' });
}
