# Razorpay, WhatsApp Business & Gemini API Setup Guide

---

## 1. Razorpay Payment Gateway (Test Mode)

1. Sign up on [Razorpay](https://dashboard.razorpay.com/).
2. Switch toggle to **Test Mode**.
3. Go to **Settings > API Keys** and generate:
   - `Key ID` (e.g., `rzp_test_XXXXXXXXXXXXXX`)
   - `Key Secret`
4. In **Settings > Webhooks**, add an endpoint:
   - **Webhook URL**: `https://your-domain.com/api/webhooks/razorpay`
   - **Secret**: Enter a secret string of your choice
   - **Active Events**: Check `payment.captured` and `payment.failed`
5. Configure in `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_secret_key
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

---

## 2. Google Gemini API (Natural Language Intent Parser)

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Set in `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
   *Note*: When the key is set, the ShelfSync WhatsApp engine uses Gemini 2.5 Flash to parse complex natural language customer queries ("Find a gift for my father under ₹2000"). If unconfigured, a robust rule-based fallback parser operates automatically.

---

## 3. Meta WhatsApp Business Cloud API

1. Visit [Meta for Developers](https://developers.facebook.com/) and register a developer account.
2. Create an App of type **Business** and add the **WhatsApp** product.
3. In the WhatsApp API Setup panel:
   - Copy the **Temporary Access Token** (or create a permanent System User Token).
   - Copy the **Phone Number ID**.
   - Copy the **WhatsApp Business Account ID**.
4. Configure in `.env`:
   ```env
   WHATSAPP_ACCESS_TOKEN=EAAB...
   WHATSAPP_PHONE_NUMBER_ID=109XXXXXXXXX
   WHATSAPP_BUSINESS_ACCOUNT_ID=102XXXXXXXXX
   WHATSAPP_VERIFY_TOKEN=shelfsync_secure_webhook_verify_token_2026
   ```
5. In **Configuration > Webhook**:
   - **Callback URL**: `https://your-domain.com/api/webhooks/whatsapp`
   - **Verify Token**: `shelfsync_secure_webhook_verify_token_2026`
   - Subscribe to the `messages` field.

*Note on Testing*:
When external WhatsApp credentials are not provided, ShelfSync operates in a transparent **SIMULATED** mode: outbound notifications are saved to the `notification_logs` table in PostgreSQL with timestamp, status, and message body so you can verify the complete notification pipeline without a live Meta developer account.
