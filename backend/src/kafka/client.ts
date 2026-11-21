import { Kafka, logLevel, Producer, Consumer, KafkaConfig } from 'kafkajs';
import fs from 'fs';
import { env } from '../config/env.js';

export const KAFKA_TOPICS = {
  ORDER_PLACED: 'order-placed',
  INVENTORY_UPDATED: 'inventory-updated',
  PAYMENT_UPDATED: 'payment-updated',
  ORDER_STATUS_UPDATED: 'order-status-updated',
  NOTIFICATION_REQUESTED: 'notification-requested',
} as const;

let kafkaInstance: Kafka | null = null;
let producerInstance: Producer | null = null;
let isKafkaConnected = false;

export function getKafkaClient(): Kafka {
  if (!kafkaInstance) {
    const config: KafkaConfig = {
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS,
      logLevel: logLevel.WARN,
      connectionTimeout: 5000,
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    };

    // Aiven Kafka uses SASL_SSL or SSL with Client Certificates
    if (env.KAFKA_USERNAME && env.KAFKA_PASSWORD) {
      config.sasl = {
        mechanism: 'scram-sha-256',
        username: env.KAFKA_USERNAME,
        password: env.KAFKA_PASSWORD,
      };
      
      if (env.KAFKA_CA_CERT) {
        let caContent = env.KAFKA_CA_CERT;
        if (fs.existsSync(env.KAFKA_CA_CERT)) {
          caContent = fs.readFileSync(env.KAFKA_CA_CERT, 'utf-8');
        }
        config.ssl = {
          rejectUnauthorized: true,
          ca: [caContent],
        };
      } else {
        config.ssl = true;
      }
    }

    kafkaInstance = new Kafka(config);
  }
  return kafkaInstance;
}

export async function getKafkaProducer(): Promise<Producer> {
  if (!producerInstance) {
    const kafka = getKafkaClient();
    producerInstance = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    try {
      await producerInstance.connect();
      isKafkaConnected = true;
      console.log('[Kafka] Producer connected to Aiven Kafka successfully.');
    } catch (err: any) {
      isKafkaConnected = false;
      console.warn(`[Kafka] Producer notice: ${err.message}. Ensure KAFKA_BROKERS and credentials are valid in .env.`);
    }
  }
  return producerInstance;
}

export function isKafkaLive(): boolean {
  return isKafkaConnected;
}
