# ShelfSync Platform Architecture & Event Pipeline

ShelfSync is an enterprise-grade, event-driven Indian e-commerce application designed to withstand high concurrency and scale gracefully.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Frontend Tier"]
        Store["Customer Storefront\n(React 18 + Vite + Tailwind)"]
        Admin["Admin Management Dashboard\n(React + Lucide Icons)"]
    end

    subgraph API["Backend Tier (Express + TypeScript)"]
        AuthMiddle["JWT Auth & Role Guard Middleware"]
        CatalogAPI["Catalog & Intelligent Search Controller"]
        CartAPI["Shopping Cart & Wishlist Controller"]
        CheckoutAPI["Order & Atomic Stock Reservation Controller"]
        AdminAPI["Admin Inventory & Status Controller"]
        WebhookAPI["WhatsApp & Razorpay Webhook Receivers"]
        OutboxPub["Transactional Outbox Publisher Worker"]
        KafkaCons["Kafka Consumer Group Workers"]
        AIAsst["ShelfSync AI WhatsApp Discovery Engine"]
    end

    subgraph ThirdParty["External Services"]
        RZP["Razorpay Payment Gateway API"]
        WA["Meta WhatsApp Cloud API"]
        GEM["Google Gemini 2.5 Flash API"]
    end

    subgraph AivenCloud["Aiven Managed Cloud Tier"]
        AivenPG[("Aiven PostgreSQL\n- 21 Normalized Tables\n- ACID Transactions\n- Outbox Events\n- Inventory Locks")]
        AivenKF["Aiven Apache Kafka\n- order-placed\n- inventory-updated\n- payment-updated\n- order-status-updated\n- notification-requested"]
        AivenOS["Aiven OpenSearch\n- Index: shelfsync_products\n- Edge-Ngram Autocomplete\n- Typo Tolerance & Fuzzy Search"]
    end

    Store -->|REST / JSON| API
    Admin -->|REST / JSON (Admin Guard)| API

    API -->|TLS Pool Connection| AivenPG
    OutboxPub -->|Poll & Send| AivenKF
    KafkaCons -->|Consume Events| AivenKF
    KafkaCons -->|Update Index| AivenOS
    CatalogAPI -->|Fuzzy Queries| AivenOS

    CheckoutAPI <-->|Create Order & Signature Check| RZP
    AIAsst <-->|Webhook & Outbound Chat| WA
    AIAsst -->|Intent Parsing| GEM
```

---

## 2. Event-Driven Workflow & Safe Inventory Reservation

### The Problem: Concurrent Overselling
When two customers attempt to purchase the last remaining unit (Stock = 1) at the exact same millisecond, traditional `SELECT -> IF -> UPDATE` logic produces race conditions where both orders succeed, leading to disastrous overselling.

### The ShelfSync Solution:
We enforce atomic conditional updates directly at the database engine level inside an explicit ACID transaction:

```sql
UPDATE inventory 
SET quantity = quantity - $requested_qty, 
    reserved_quantity = reserved_quantity + $requested_qty,
    updated_at = NOW()
WHERE product_id = $product_id AND quantity >= $requested_qty
RETURNING quantity;
```

If `rowCount === 0`, PostgreSQL guarantees that the stock condition failed, immediately triggering a rollback and returning an `OUT_OF_STOCK` error to the second customer.

---

## 3. Transactional Outbox Pattern for Kafka

To eliminate distributed dual-write inconsistencies between PostgreSQL and Kafka:
1. When an order is placed, both the order record and an event record are inserted into the `outbox_events` table inside the **same database transaction**.
2. If the transaction rolls back, no Kafka event is ever recorded.
3. The background **Outbox Publisher Worker** (`src/workers/outboxWorker.ts`) polls pending events and reliably transmits them to Aiven Kafka.
4. On the consumer side, the `processed_events` table enforces **strict consumer idempotency**, preventing duplicate message deliveries from deducting inventory twice.
