# ShelfSync REST API Reference

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Profile
- `POST /api/auth/register`
  - Body: `{ email, password, fullName, phone }`
  - Returns: `{ success: true, token, user }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ success: true, token, user }`
- `GET /api/auth/me` *(Bearer Token Required)*
  - Returns: Current user profile and saved delivery addresses.
- `PUT /api/auth/profile` *(Bearer Token Required)*
  - Body: `{ fullName?, phone? }`
- `POST /api/auth/forgot-password`
  - Body: `{ email }`

---

## 2. Customer Addresses
- `GET /api/addresses` *(Bearer Token Required)*
- `POST /api/addresses` *(Bearer Token Required)*
  - Body: `{ recipientName, phone, addressLine1, addressLine2, city, state, postalCode, isDefault }`
- `DELETE /api/addresses/:id` *(Bearer Token Required)*

---

## 3. Products & Intelligent OpenSearch
- `GET /api/products`
  - Query parameters: `category`, `brand`, `minPrice`, `maxPrice`, `minRating`, `inStockOnly`, `city`, `sortBy`, `page`, `limit`
- `GET /api/products/:slug`
  - Returns detailed product information, high-res images, and reviews.
- `GET /api/categories`
  - Returns the 6 core catalogue departments.
- `GET /api/search`
  - Powered by Aiven OpenSearch. Handles typo tolerance, natural queries (e.g. `bluetoth hedphones under 1500`), and autocomplete.

---

## 4. Shopping Cart & Wishlist
- `GET /api/cart`
  - Returns live items, subtotal, discount, delivery fee, and payable total.
- `POST /api/cart/add`
  - Body: `{ productId, quantity }`
  - Validates stock against warehouse inventory before adding.
- `PUT /api/cart/item/:id`
  - Body: `{ quantity }`
- `DELETE /api/cart/item/:id`
- `GET /api/wishlist` *(Bearer Token Required)*
- `POST /api/wishlist/add` *(Bearer Token Required)*
- `DELETE /api/wishlist/:productId` *(Bearer Token Required)*

---

## 5. Orders & Razorpay Payment Integration
- `POST /api/orders/create` *(Bearer Token Required)*
  - Body: `{ shippingAddress, paymentMethod: 'RAZORPAY' | 'COD' }`
  - Performs atomic conditional inventory reservation (`WHERE quantity >= $qty`).
  - Creates Razorpay order and returns signature parameters.
- `POST /api/orders/verify-payment` *(Bearer Token Required)*
  - Body: `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`
  - Cryptographically verifies signature via HMAC SHA-256.
  - Confirms order, emits Kafka `payment-updated` and `notification-requested` events.
- `GET /api/orders/my-orders` *(Bearer Token Required)*
- `GET /api/orders/:orderNumber`
  - Returns step-by-step shipment tracking timeline.

---

## 6. Admin Management *(Admin Bearer Token Required)*
- `GET /api/admin/overview`
  - Revenue, order counts, customer counts, low-stock warnings, best sellers.
- `GET /api/admin/products`
- `POST /api/admin/products`
  - Body: `{ name, categoryId, brand, basePrice, discountPercent, sku, initialStock, imageUrl, description }`
  - Automatically indexes new document into Aiven OpenSearch.
- `PUT /api/admin/products/:id/stock`
  - Body: `{ stock }`
  - Emits Kafka `inventory-updated` event and updates OpenSearch stock.
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id/status`
  - Body: `{ status, notes?, location? }`
  - Triggers WhatsApp milestone notification to customer.
- `GET /api/admin/notifications`
  - Returns audit logs of all WhatsApp messages sent.

---

## 7. Webhooks & Diagnostics
- `GET /api/webhooks/whatsapp`
  - Meta Hub Challenge verification endpoint.
- `POST /api/webhooks/whatsapp`
  - Meta Inbound message processor. Invokes Gemini 2.5 Flash and queries OpenSearch.
- `POST /api/webhooks/razorpay`
  - Webhook receiver verifying `x-razorpay-signature`.
- `GET /api/health`
  - Real-time diagnostic ping checking Aiven PostgreSQL, Kafka, and OpenSearch.
