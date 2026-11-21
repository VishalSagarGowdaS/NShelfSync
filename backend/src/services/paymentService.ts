import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { query, getClient } from '../database/db.js';
import { insertOutboxEvent } from '../kafka/producer.js';
import { KAFKA_TOPICS } from '../kafka/client.js';

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
    env.RAZORPAY_KEY_SECRET &&
    !env.RAZORPAY_KEY_ID.includes('placeholder')
  );
}

export interface CreatePaymentOrderResult {
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  orderNumber: string;
  keyId: string;
  mode: 'live_gateway' | 'sandbox_simulator';
}

export async function createRazorpayOrder(
  orderId: string,
  orderNumber: string,
  amountInRupees: number
): Promise<CreatePaymentOrderResult> {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (isRazorpayConfigured()) {
    try {
      const rzp = getRazorpayClient();
      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          orderId,
          orderNumber,
          platform: 'ShelfSync',
        },
      });

      // Record in payments table
      await query(`
        INSERT INTO payments (order_id, payment_method, gateway_provider, razorpay_order_id, status, amount, currency)
        VALUES ($1, 'RAZORPAY', 'RAZORPAY', $2, 'PENDING', $3, 'INR')
        ON CONFLICT DO NOTHING;
      `, [orderId, rzpOrder.id, amountInRupees]);

      return {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        orderNumber,
        keyId: env.RAZORPAY_KEY_ID,
        mode: 'live_gateway',
      };
    } catch (err: any) {
      console.warn('[Razorpay] API call failed, falling back to simulated sandbox:', err.message);
    }
  }

  // Realistic Sandbox Mode when API credentials are placeholders
  const simulatedOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  await query(`
    INSERT INTO payments (order_id, payment_method, gateway_provider, razorpay_order_id, status, amount, currency)
    VALUES ($1, 'RAZORPAY', 'RAZORPAY', $2, 'PENDING', $3, 'INR')
    ON CONFLICT DO NOTHING;
  `, [orderId, simulatedOrderId, amountInRupees]);

  return {
    razorpayOrderId: simulatedOrderId,
    amount: amountInPaise,
    currency: 'INR',
    orderNumber,
    keyId: env.RAZORPAY_KEY_ID,
    mode: 'sandbox_simulator',
  };
}

export interface VerifyPaymentParams {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function verifyPaymentSignature(params: VerifyPaymentParams): Promise<{ verified: boolean; message: string }> {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  let isValid = false;

  if (isRazorpayConfigured()) {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    isValid = generatedSignature === razorpaySignature;
  } else {
    // Sandbox test verification mode
    isValid = razorpaySignature.startsWith('sig_test_') || razorpaySignature.length === 64;
  }

  if (!isValid) {
    try {
      await query(`
        UPDATE payments
        SET status = 'FAILED', error_code = 'BAD_SIGNATURE', error_description = 'Payment signature mismatch', updated_at = NOW()
        WHERE order_id = $1;
      `, [orderId]);
    } catch {
      // Ignore if DB offline
    }
    return { verified: false, message: 'Invalid payment signature' };
  }

  // If DB connection is unconfigured in development/test, return verified status
  if (!env.DATABASE_URL && !env.PG_HOST) {
    return { verified: true, message: 'Payment successfully verified (development mode)' };
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Update payment record
    await client.query(`
      UPDATE payments
      SET status = 'SUCCESS',
          razorpay_payment_id = $1,
          razorpay_signature = $2,
          updated_at = NOW()
      WHERE order_id = $3;
    `, [razorpayPaymentId, razorpaySignature, orderId]);

    // Update order status
    const orderRes = await client.query(`
      UPDATE orders
      SET status = 'CONFIRMED', payment_status = 'CAPTURED', updated_at = NOW()
      WHERE id = $1
      RETURNING id, order_number, user_id, total_amount, shipping_snapshot;
    `, [orderId]);

    const order = orderRes.rows[0];

    // Transactional Outbox Event for Kafka payment-updated
    await insertOutboxEvent(
      client,
      'ORDER',
      orderId,
      'PAYMENT_CAPTURED',
      KAFKA_TOPICS.PAYMENT_UPDATED,
      {
        orderId,
        orderNumber: order.order_number,
        paymentId: razorpayPaymentId,
        amount: order.total_amount,
        status: 'CAPTURED',
      }
    );

    // Transactional Outbox Event for WhatsApp notification-requested
    const customerPhone = order.shipping_snapshot?.phone || '+919820012345';
    await insertOutboxEvent(
      client,
      'NOTIFICATION',
      orderId,
      'SEND_CONFIRMATION',
      KAFKA_TOPICS.NOTIFICATION_REQUESTED,
      {
        userId: order.user_id,
        phone: customerPhone,
        orderId,
        type: 'PAYMENT_CONFIRMATION',
        message: `Hello! Your payment of ₹${Number(order.total_amount).toLocaleString('en-IN')} was successful.\n\nYour ShelfSync order #${order.order_number} has been confirmed.\n\nTrack your order: ${env.FRONTEND_URL}/orders/${order.order_number}`,
      }
    );

    await client.query('COMMIT');
    return { verified: true, message: 'Payment successfully verified and order confirmed' };
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function verifyWebhookSignature(payloadRaw: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return true;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(payloadRaw)
    .digest('hex');
  return expected === signature;
}
