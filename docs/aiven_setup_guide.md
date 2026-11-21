# Aiven Cloud Services Setup Guide

ShelfSync requires three compulsory Aiven managed cloud services:
1. **Aiven PostgreSQL**
2. **Aiven Apache Kafka**
3. **Aiven OpenSearch**

---

## 1. Aiven PostgreSQL Setup

1. Sign in to your [Aiven Console](https://console.aiven.io/).
2. Create a new service:
   - **Service Type**: PostgreSQL
   - **Cloud Provider**: AWS / Google Cloud (Region: `ap-south-1` Mumbai or similar)
   - **Plan**: Free Tier / Startup
3. Once the service is running, navigate to the **Overview** tab:
   - Copy the **Service URI**:
     `postgres://avnadmin:your_password@pg-shelfsync-your-project.aivencloud.com:15682/defaultdb?sslmode=require`
4. Paste this into your `.env` file as:
   ```env
   DATABASE_URL=postgres://avnadmin:your_password@pg-shelfsync-your-project.aivencloud.com:15682/defaultdb?sslmode=require
   ```
5. Execute the automated migration & seeding scripts:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

---

## 2. Aiven Apache Kafka Setup

1. In the Aiven Console, create a new service:
   - **Service Type**: Apache Kafka
   - **Plan**: Startup or Developer
2. Once running, open **Topics** and create the 5 required ShelfSync topics:
   - `order-placed`
   - `inventory-updated`
   - `payment-updated`
   - `order-status-updated`
   - `notification-requested`
3. In the **Overview** tab, copy the **Service URI** (Host and Port):
   ```env
   KAFKA_BROKERS=kafka-shelfsync-your-project.aivencloud.com:15684
   KAFKA_USERNAME=avnadmin
   KAFKA_PASSWORD=your_kafka_password
   ```
4. If using client certificates or CA cert, download the `ca.pem` from the Aiven Console and provide its path in:
   ```env
   KAFKA_CA_CERT=./certs/ca.pem
   ```

---

## 3. Aiven OpenSearch Setup

1. In the Aiven Console, create a new service:
   - **Service Type**: OpenSearch
   - **Plan**: Startup
2. Copy the **Service URI**:
   `https://avnadmin:your_opensearch_password@os-shelfsync-your-project.aivencloud.com:15686`
3. Configure `.env`:
   ```env
   OPENSEARCH_URL=https://os-shelfsync-your-project.aivencloud.com:15686
   OPENSEARCH_USERNAME=avnadmin
   OPENSEARCH_PASSWORD=your_opensearch_password
   OPENSEARCH_INDEX=shelfsync_products
   ```
4. Run the automated index initialization and database sync:
   ```bash
   npm run search:init
   ```
   This creates the index with `edge_ngram` autocomplete analyzers and synchronizes all catalogue products.
