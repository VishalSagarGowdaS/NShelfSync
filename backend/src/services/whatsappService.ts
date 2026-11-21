import crypto from 'crypto';
import { env } from '../config/env.js';
import { query } from '../database/db.js';
import { parseCustomerMessageWithGemini } from './geminiService.js';
import { searchProducts } from '../opensearch/searchService.js';

export interface SendWhatsAppParams {
  phone: string;
  message: string;
  type: string;
  orderId?: string;
  userId?: string;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    env.WHATSAPP_ACCESS_TOKEN &&
    env.WHATSAPP_PHONE_NUMBER_ID &&
    !env.WHATSAPP_ACCESS_TOKEN.includes('placeholder')
  );
}

export async function sendWhatsAppNotification(params: SendWhatsAppParams): Promise<{ success: boolean; status: string; id?: string }> {
  const { phone, message, type, orderId, userId } = params;

  // Clean phone number format (ensure leading +91 for Indian numbers)
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = `+${cleanPhone}`;
  }

  if (isWhatsAppConfigured()) {
    try {
      const url = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone.replace('+', ''),
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await res.json();
      const messageId = data?.messages?.[0]?.id;

      await query(`
        INSERT INTO notification_logs (user_id, phone, order_id, notification_type, channel, recipient, status, provider_message_id, payload)
        VALUES ($1, $2, $3, $4, 'WHATSAPP', $5, 'SENT', $6, $7);
      `, [userId || null, cleanPhone, orderId || null, type, cleanPhone, messageId || null, JSON.stringify({ message })]);

      console.log(`[WhatsApp API] Message dispatched to ${cleanPhone} (ID: ${messageId})`);
      return { success: true, status: 'SENT', id: messageId };
    } catch (err: any) {
      console.warn(`[WhatsApp API] Failed sending to Meta Cloud API: ${err.message}. Logging failure.`);
      await query(`
        INSERT INTO notification_logs (user_id, phone, order_id, notification_type, channel, recipient, status, error_message, payload)
        VALUES ($1, $2, $3, $4, 'WHATSAPP', $5, 'FAILED', $6, $7);
      `, [userId || null, cleanPhone, orderId || null, type, cleanPhone, err.message, JSON.stringify({ message })]);
      return { success: false, status: 'FAILED' };
    }
  }

  // Development / Test Mode: Record accurately as SIMULATED so CSE students can audit delivery logs
  const simulatedId = `wa_sim_${crypto.randomBytes(6).toString('hex')}`;
  await query(`
    INSERT INTO notification_logs (user_id, phone, order_id, notification_type, channel, recipient, status, provider_message_id, payload)
    VALUES ($1, $2, $3, $4, 'WHATSAPP', $5, 'SIMULATED', $6, $7);
  `, [userId || null, cleanPhone, orderId || null, type, cleanPhone, simulatedId, JSON.stringify({ message })]);

  console.log(`[WhatsApp Test Mode] Logged simulated notification to ${cleanPhone} (Type: ${type})`);
  return { success: true, status: 'SIMULATED', id: simulatedId };
}

/**
 * Handle incoming customer WhatsApp chat message
 */
export async function handleIncomingWhatsAppMessage(fromPhone: string, text: string): Promise<string> {
  console.log(`[WhatsApp AI Assistant] Message from ${fromPhone}: "${text}"`);

  // 1. Natural Language Parse via Gemini
  const parsed = await parseCustomerMessageWithGemini(text);

  if (parsed.intent === 'greeting') {
    return `Namaste! 🙏 Welcome to *ShelfSync AI Assistant*.\n\nI can help you find products, compare options, and check prices.\n\nTry asking me:\n• "Suggest wireless earphones under ₹1,500"\n• "Find gifts for my father under ₹2,000"\n• "Which laptop is best for college students?"\n• "Show running shoes for men"`;
  }

  if (parsed.intent === 'clarification_needed' && parsed.followUpQuestion) {
    return `Namaste! ${parsed.followUpQuestion}`;
  }

  // 2. Query Aiven OpenSearch + PostgreSQL
  const searchResults = await searchProducts({
    q: parsed.keywords,
    category: parsed.category,
    brand: parsed.brand,
    maxPrice: parsed.maxBudget,
    limit: 4,
  });

  if (!searchResults.products || searchResults.products.length === 0) {
    return `I searched ShelfSync for "${parsed.keywords}", but couldn't find an exact match within your criteria.\n\nTry searching for broader keywords like "headphones", "laptops", "kurta", or browse our full catalogue at:\n${env.FRONTEND_URL}/search`;
  }

  // 3. Format 3–4 Recommendations with pricing in ₹, ratings, and website links
  const lines: string[] = [
    `✨ *ShelfSync AI Recommendations* ✨`,
    `Here are the best matches for you:\n`,
  ];

  for (let i = 0; i < searchResults.products.length; i++) {
    const p = searchResults.products[i];
    const stockStr = p.in_stock ? '✅ In Stock' : '⚠️ Limited / Out of Stock';
    const ratingStr = p.rating ? `⭐ ${p.rating}/5` : '';
    lines.push(
      `${i + 1}. *${p.name}*`,
      `   💰 *₹${Number(p.final_price).toLocaleString('en-IN')}* ${p.discount_percent > 0 ? `(${p.discount_percent}% OFF)` : ''}`,
      `   ${ratingStr} | ${stockStr}`,
      `   🔗 View & Order: ${env.FRONTEND_URL}/products/${p.slug}`,
      ''
    );
  }

  lines.push(
    `ℹ️ *Note*: To add to cart and pay securely, please click the links above to open the ShelfSync website.`
  );

  return lines.join('\n');
}

/**
 * Dispatch Order Status milestone notification
 */
export async function sendOrderStatusUpdateWhatsApp(orderNumber: string, status: string, phone: string, userId?: string) {
  const statusTitles: Record<string, string> = {
    CONFIRMED: 'Order Confirmed',
    PACKED: 'Order Packed & Ready',
    SHIPPED: 'Order Shipped via ShelfSync Express',
    OUT_FOR_DELIVERY: 'Out for Delivery Today',
    DELIVERED: 'Delivered Successfully',
    CANCELLED: 'Order Cancelled',
  };

  const title = statusTitles[status] || status;
  const message = `📦 *ShelfSync Order Update*\n\nOrder #${orderNumber}: *${title}*\n\nTrack real-time shipment progress:\n${env.FRONTEND_URL}/orders/${orderNumber}\n\nThank you for shopping with ShelfSync!`;

  return sendWhatsAppNotification({
    phone,
    message,
    type: `ORDER_${status}`,
    userId,
  });
}
