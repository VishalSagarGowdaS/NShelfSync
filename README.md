# 🛒 ShelfSync — Full-Stack E-Commerce Platform

ShelfSync is an Indian e-commerce web platform engineered with an event-driven architecture, resilient concurrency controls, and multi-cloud integrations.

Built specifically for high velocity and scale, ShelfSync features **Aiven PostgreSQL** as the authoritative source of truth, **Aiven Apache Kafka** for asynchronous event streaming, **Aiven OpenSearch** for intelligent typo-tolerant product discovery, real **Razorpay** payment gateway processing in Indian Rupees (₹), and a **WhatsApp AI Assistant** powered by Meta Cloud API and Google Gemini.

---

## 🚀 Key Highlights & Architecture

- **Authoritative ACID Source of Truth**: 21 normalized relational tables in **Aiven PostgreSQL** with constraints, indexes, foreign keys, and transactional outbox.
- **Race Condition & Overselling Protection**: Atomic conditional updates (`UPDATE inventory SET quantity = quantity - $qty WHERE quantity >= $qty`) prevent double-booking even under concurrent checkouts for a single remaining unit.
- **Event-Driven Microservices**: 5 core **Aiven Kafka** topics (`order-placed`, `inventory-updated`, `payment-updated`, `order-status-updated`, `notification-requested`) with transactional outbox publisher and idempotent consumer groups.
- **Intelligent Typo-Tolerant Search**: **Aiven OpenSearch** index (`shelfsync_products`) configured with `edge_ngram` autocomplete analyzers and fuzzy matching (e.g., searching `"bluetoth hedphones under 1500"` accurately discovers boAt Bluetooth headphones under ₹1,500).
- **Payment Processing**: Full **Razorpay** checkout integration supporting UPI, RuPay, Debit/Credit Cards, NetBanking, and Cash on Delivery (COD) with HMAC SHA-256 signature verification.
- **ShelfSync AI WhatsApp Assistant**: Dual-purpose WhatsApp integration:
  1. Product discovery, comparisons, and budget queries via Gemini 2.5 Flash + OpenSearch.
  2. Transactional payment receipts and real-time step-by-step delivery notifications (Confirmed ➔ Packed ➔ Shipped ➔ Out for Delivery ➔ Delivered).
  *(Strict Rule: WhatsApp never collects payments or carts; purchases happen securely on the ShelfSync web application).*
- **Administrative Control Panel**: Secure dashboard with revenue metrics, real-time warehouse inventory adjustments, order milestone updates, and WhatsApp delivery audit logs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, TanStack Query |
| **Backend** | Node.js, Express, TypeScript, Zod Schema Validation, Helmet, CORS, Rate Limiting |
| **Primary Database** | **Aiven PostgreSQL** (via `pg` connection pool with SSL/TLS) |
| **Event Streaming** | **Aiven Apache Kafka** (via `kafkajs` with SASL SCRAM-SHA-256 SSL) |
| **Search Engine** | **Aiven OpenSearch** (via `@opensearch-project/opensearch`) |
| **Payments** | **Razorpay Payment Gateway SDK** (INR ₹) |
| **Artificial Intelligence** | **Google Gemini 2.5 Flash API** |
| **Messaging** | **Meta WhatsApp Business Cloud API** |
| **Automated Testing** | Vitest, Supertest |

---

## 📂 Project Directory Structure

```text
shelfsync/
├── backend/
│   ├── src/
│   │   ├── config/            # Environment configurations (env.ts)
│   │   ├── controllers/       # Auth, Products, Cart, Orders, Admin, Webhooks, Health
│   │   ├── database/          # PostgreSQL pool connection, migration, and seeders
│   │   ├── kafka/             # Kafka client, producers, and outbox helpers
│   │   ├── middlewares/       # JWT auth and Admin role protection guards
│   │   ├── opensearch/        # OpenSearch client, index mappings, fuzzy search logic
│   │   ├── routes/            # REST API endpoints (/api)
│   │   ├── services/          # Razorpay payments, Gemini AI, WhatsApp Cloud API
│   │   ├── workers/           # Transactional Outbox worker & Kafka consumer groups
│   │   ├── __tests__/         # Automated test suites (API, Concurrency, Signatures)
│   │   └── index.ts           # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Footer, ProductCard, WhatsAppFloatingButton
│   │   ├── context/           # AuthContext (JWT) and CartContext (Backend Sync)
│   │   ├── pages/             # 14 complete customer and admin view pages
│   │   ├── services/          # Frontend API client with auth token interceptor
│   │   ├── types/             # Shared TypeScript data models
│   │   ├── App.tsx            # Main router configuration
│   │   └── main.tsx           # React DOM root with TanStack Query provider
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql  # 21 tables, constraints, indexes & outbox schema
├── docs/                      # Full architecture, DB schema, API, and setup guides
├── .env.example               # Template environment configuration
├── .gitignore
├── package.json               # Root monorepo execution scripts
└── README.md
```

---

## ⚡ Quick Start Guide (Run & Verify Locally)

### 1. Prerequisites
- **Node.js** v18+ (tested on v26 LTS)
- **npm** v10+

### 2. Environment Setup
Copy `.env.example` to `.env` in the root (or `backend/.env`):
```bash
cp .env.example backend/.env
```
Provide your **Aiven PostgreSQL**, **Aiven Kafka**, and **Aiven OpenSearch** connection strings in `.env`.
*(Note: If cloud credentials are not yet populated, ShelfSync starts in development resilience mode with local fallbacks and simulated notification logs so the entire application and tests can be demonstrated immediately).*

### 3. Database Migration & Realistic Catalogue Seeding
```bash
# From root directory
npm run db:migrate
npm run db:seed
```
This initializes all 21 relational tables and seeds 24 realistic Indian e-commerce products with Unsplash imagery across Electronics, Fashion, Home & Kitchen, Grocery, Beauty, and Sports, along with customer and admin accounts.

### 4. Running the Application
Open two terminal windows:

**Terminal 1 — Backend API Server (Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend Storefront & Admin (Port 5173):**
```bash
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Demo User Credentials

The application comes pre-loaded with two verified accounts (also accessible via 1-click fill buttons on the Login page):

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin@shelfsync.com` | `Admin@123` | Full access to inventory, orders, analytics, product creation |
| **Customer** | `customer@shelfsync.com` | `Customer@123` | Shopping, cart, checkout, profile, saved addresses, order tracking |

---

## 🧪 Automated Testing & Concurrency Verification

Execute the complete test suite:
```bash
cd backend
npm test
```

### The Stock = 1 Concurrency Race Test
PART 16 of the specification requires proof that when a product has **Stock = 1**, two concurrent orders attempting to purchase it simultaneously will result in **exactly one order succeeding** while the other safely aborts with `OUT_OF_STOCK`:

```ts
// Excerpt from src/__tests__/concurrency.test.ts
const [result1, result2] = await Promise.all([
  attemptAtomicOrder('Customer_Aarav', 1),
  attemptAtomicOrder('Customer_Priya', 1)
]);

expect(successfulOrders.length).toBe(1);
expect(failedOrders.length).toBe(1);
expect(currentStock).toBe(0);
```

---

## 📱 WhatsApp AI Assistant Interaction

Click the floating **AI Assistant** button on the bottom right of the store:
- **Product Discovery**: Ask *"Suggest wireless earphones under ₹1,500"*.
- The system parses the message with Gemini, executes a search against Aiven OpenSearch, and returns 3–4 items with prices in ₹, ratings, stock, and direct product links.
- **Strict Guardrail**: WhatsApp never accepts payment or checkout requests; customers are routed to the ShelfSync website to complete their orders.

---

## 📄 Documentation Sitemap

- [System Architecture & Outbox Pattern](docs/architecture.md)
- [Complete 21-Table Database Schema](docs/database_schema.md)
- [REST API Reference](docs/api_documentation.md)
- [Aiven PostgreSQL, Kafka & OpenSearch Setup Guide](docs/aiven_setup_guide.md)
- [Razorpay, WhatsApp Cloud & Gemini API Guide](docs/razorpay_whatsapp_setup_guide.md)

---

## 📜 License
Developed for educational CSE evaluation under the MIT License.
