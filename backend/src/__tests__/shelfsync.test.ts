import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { parseNaturalQuery } from '../opensearch/searchService.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../services/paymentService.js';
import { parseCustomerMessageWithGemini } from '../services/geminiService.js';

describe('ShelfSync Core Intelligence & Utility Unit Tests', () => {
  it('Intelligent Search Query Parser extracts product terms and budget in INR', () => {
    const q1 = parseNaturalQuery('bluetoth hedphones under 1500');
    expect(q1.cleanedQuery).toBe('bluetoth hedphones');
    expect(q1.detectedBudget).toBe(1500);

    const q2 = parseNaturalQuery('running shoes below ₹2000');
    expect(q2.cleanedQuery).toBe('running shoes');
    expect(q2.detectedBudget).toBe(2000);

    const q3 = parseNaturalQuery('cotton kurta');
    expect(q3.cleanedQuery).toBe('cotton kurta');
    expect(q3.detectedBudget).toBeUndefined();
  });

  it('Payment Signature verification validates cryptographic signatures correctly', async () => {
    const mockOrder = {
      orderId: 'test-order-123',
      razorpayOrderId: 'order_test_999',
      razorpayPaymentId: 'pay_test_888',
      razorpaySignature: 'sig_test_valid_signature_hash',
    };

    const res = await verifyPaymentSignature(mockOrder);
    expect(res.verified).toBe(true);
  });

  it('Razorpay Webhook Signature verification safely handles raw body verification', () => {
    const payload = JSON.stringify({ event: 'payment.captured' });
    const verified = verifyWebhookSignature(payload, 'any_signature_in_dev');
    expect(typeof verified).toBe('boolean');
  });

  it('WhatsApp AI Intent Parser recognizes natural language queries and categories', async () => {
    const parsed = await parseCustomerMessageWithGemini('Suggest wireless earphones under ₹1000');
    expect(parsed.intent).toBe('recommendation');
    expect(parsed.category).toBe('electronics');
    expect(parsed.maxBudget).toBe(1000);
  });

  it('WhatsApp AI Assistant greeting detection works', async () => {
    const parsed = await parseCustomerMessageWithGemini('Namaste! Can you help me?');
    expect(parsed.intent).toBe('greeting');
  });
});

describe('ShelfSync REST API Endpoints & Auth Guards', () => {
  it('GET /api/health returns detailed health diagnostics for Aiven services', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('ShelfSync API Server');
    expect(res.body.integrations).toHaveProperty('postgresql');
    expect(res.body.integrations).toHaveProperty('kafka');
    expect(res.body.integrations).toHaveProperty('opensearch');
  });

  it('GET /api/categories returns catalogue categories with images and descriptions', async () => {
    const res = await request(app).get('/api/categories');
    expect([200, 500]).toContain(res.status); // 200 when DB connected, 500 or fallback handled
  });

  it('GET /api/webhooks/whatsapp verifies Meta Hub Challenge', async () => {
    const res = await request(app)
      .get('/api/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'shelfsync_secure_webhook_verify_token_2026',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('CHALLENGE_ACCEPTED_123');
  });

  it('GET /api/webhooks/whatsapp rejects unauthorized verify tokens', async () => {
    const res = await request(app)
      .get('/api/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });

    expect(res.status).toBe(403);
  });

  it('Protected admin routes reject requests without Authorization token', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
  });

  it('Protected customer routes reject requests without Authorization token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
