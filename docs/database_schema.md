# ShelfSync Database Schema Documentation

authoritative Source of Truth: **Aiven PostgreSQL**

---

## 1. Relational Entities (21 Tables)

| # | Table Name | Purpose | Primary Key | Foreign Keys / Constraints |
|---|------------|---------|-------------|----------------------------|
| 1 | `roles` | Access control roles (`CUSTOMER`, `ADMIN`) | `id SERIAL` | Unique `name` |
| 2 | `users` | Customer & Admin profile credentials | `id UUID` | FK `role_id -> roles.id`, Unique `email` |
| 3 | `addresses` | Customer saved shipping destinations | `id UUID` | FK `user_id -> users.id` (CASCADE) |
| 4 | `categories` | Product classification departments | `id SERIAL` | Unique `name`, Unique `slug` |
| 5 | `products` | Authoritative item catalogue | `id UUID` | FK `category_id -> categories.id`, Unique `sku`, Unique `slug` |
| 6 | `product_images` | Gallery and thumbnail URLs | `id UUID` | FK `product_id -> products.id` (CASCADE) |
| 7 | `warehouses` | Regional fulfillment hubs | `id SERIAL` | Unique `code` (e.g., Mumbai, Delhi NCR, BLR, Hyderabad) |
| 8 | `inventory` | Stock and reserved quantity | `id UUID` | FK `product_id -> products.id`, FK `warehouse_id -> warehouses.id`, Unique `(product_id, warehouse_id)` |
| 9 | `carts` | Customer & session shopping cart | `id UUID` | FK `user_id -> users.id` (CASCADE) |
| 10 | `cart_items` | Products in cart with quantities | `id UUID` | FK `cart_id -> carts.id`, FK `product_id -> products.id`, Unique `(cart_id, product_id)` |
| 11 | `wishlists` | Customer saved wishlist header | `id UUID` | FK `user_id -> users.id` (CASCADE) |
| 12 | `wishlist_items` | Individual items in wishlist | `id UUID` | FK `wishlist_id -> wishlists.id`, FK `product_id -> products.id` |
| 13 | `orders` | Completed & pending purchase orders | `id UUID` | FK `user_id -> users.id`, Status Check constraint |
| 14 | `order_items` | Line items snapshot for invoice | `id UUID` | FK `order_id -> orders.id`, FK `product_id -> products.id` |
| 15 | `payments` | Razorpay transactions and signatures | `id UUID` | FK `order_id -> orders.id` (CASCADE), Status Check constraint |
| 16 | `reviews` | Customer ratings (1-5 stars) & comments | `id UUID` | FK `product_id -> products.id`, FK `user_id -> users.id`, Unique `(product_id, user_id)` |
| 17 | `shipments` | Logistics carrier tracking records | `id UUID` | FK `order_id -> orders.id` (CASCADE), Unique `tracking_number` |
| 18 | `tracking_events` | Step-by-step milestones (Shipped, Out for Delivery) | `id UUID` | FK `shipment_id -> shipments.id` (CASCADE) |
| 19 | `processed_events`| Kafka consumer idempotency tracking | `id UUID` | Unique `event_id` |
| 20 | `outbox_events` | Transactional outbox pattern queue | `id UUID` | Status Check constraint (`PENDING`, `SENT`, `FAILED`) |
| 21 | `notification_logs`| WhatsApp Cloud API message logs | `id UUID` | FK `order_id -> orders.id`, FK `user_id -> users.id`, Status Check |

---

## 2. Key Database Constraints & Indexes

1. **Transactional Outbox Index**: `idx_outbox_status_created` on `outbox_events(status, created_at)` enables sub-millisecond polling for pending Kafka messages.
2. **Order Lookup Indexes**: `idx_orders_user_id`, `idx_orders_order_number`, `idx_orders_status`.
3. **Inventory Concurrency Protection**: `quantity >= 0` check constraint guarantees that physical inventory never drops below zero under any concurrency condition.
