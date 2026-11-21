import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Aiven PostgreSQL
  DATABASE_URL: process.env.DATABASE_URL || '',
  PG_HOST: process.env.PG_HOST || '',
  PG_PORT: parseInt(process.env.PG_PORT || '5432', 10),
  PG_DATABASE: process.env.PG_DATABASE || 'defaultdb',
  PG_USER: process.env.PG_USER || 'avnadmin',
  PG_PASSWORD: process.env.PG_PASSWORD || '',
  PG_SSL: process.env.PG_SSL === 'true' || true,

  // Aiven Apache Kafka
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'shelfsync-backend',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'shelfsync-consumer-group',
  KAFKA_USERNAME: process.env.KAFKA_USERNAME || '',
  KAFKA_PASSWORD: process.env.KAFKA_PASSWORD || '',
  KAFKA_CA_CERT: process.env.KAFKA_CA_CERT || '',

  // Aiven OpenSearch
  OPENSEARCH_URL: process.env.OPENSEARCH_URL || 'https://localhost:9200',
  OPENSEARCH_USERNAME: process.env.OPENSEARCH_USERNAME || 'avnadmin',
  OPENSEARCH_PASSWORD: process.env.OPENSEARCH_PASSWORD || '',
  OPENSEARCH_INDEX: process.env.OPENSEARCH_INDEX || 'shelfsync_products',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'shelfsync_default_development_jwt_secret_key_32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SESSION_SECRET: process.env.SESSION_SECRET || 'shelfsync_default_session_secret',

  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret',

  // Meta WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'shelfsync_secure_webhook_verify_token_2026',
};
