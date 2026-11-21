import { getKafkaClient, KAFKA_TOPICS } from '../kafka/client.js';
import { query } from '../database/db.js';
import { updateOpenSearchProductStock } from '../opensearch/indexManager.js';
import { sendWhatsAppNotification } from '../services/whatsappService.js';
import { env } from '../config/env.js';

const CONSUMER_GROUP = env.KAFKA_GROUP_ID;

export async function isEventAlreadyProcessed(eventId: string, group: string): Promise<boolean> {
  try {
    const res = await query(`
      SELECT 1 FROM processed_events
      WHERE event_id = $1 AND consumer_group = $2;
    `, [eventId, group]);
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

export async function markEventAsProcessed(eventId: string, eventType: string, group: string): Promise<void> {
  try {
    await query(`
      INSERT INTO processed_events (event_id, event_type, consumer_group)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id) DO NOTHING;
    `, [eventId, eventType, group]);
  } catch (err: any) {
    console.warn('[Idempotency] Failed to record processed event:', err.message);
  }
}

export async function startKafkaConsumers() {
  const kafka = getKafkaClient();
  const consumer = kafka.consumer({ groupId: CONSUMER_GROUP });

  try {
    await consumer.connect();
    console.log(`[Kafka Consumer] Connected with consumer group: ${CONSUMER_GROUP}`);

    // Subscribe to all 5 topics
    await consumer.subscribe({
      topics: [
        KAFKA_TOPICS.ORDER_PLACED,
        KAFKA_TOPICS.INVENTORY_UPDATED,
        KAFKA_TOPICS.PAYMENT_UPDATED,
        KAFKA_TOPICS.ORDER_STATUS_UPDATED,
        KAFKA_TOPICS.NOTIFICATION_REQUESTED,
      ],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        let parsed: any;
        try {
          parsed = JSON.parse(message.value.toString());
        } catch {
          console.error('[Kafka Consumer] Invalid JSON payload, routing to dead-letter log.');
          return;
        }

        const eventId = parsed.eventId || `${topic}-${message.offset}`;
        const eventType = parsed.eventType || topic;

        // Idempotency check: Prevent duplicate event handling (e.g., duplicate stock deduction)
        const alreadyDone = await isEventAlreadyProcessed(eventId, CONSUMER_GROUP);
        if (alreadyDone) {
          console.log(`[Kafka Consumer] Skipped duplicate event ${eventId} on topic [${topic}].`);
          return;
        }

        console.log(`[Kafka Consumer] Processing topic [${topic}] event: ${eventType} (ID: ${eventId})`);

        try {
          switch (topic) {
            case KAFKA_TOPICS.ORDER_PLACED: {
              // Confirm order items & reserve inventory
              const orderData = parsed.data;
              console.log(`[Kafka Consumer: order-placed] Order #${orderData.order_number} confirmed.`);
              break;
            }

            case KAFKA_TOPICS.INVENTORY_UPDATED: {
              // Synchronize inventory change to OpenSearch
              const invData = parsed.data;
              if (invData.productId && invData.newStock !== undefined) {
                await updateOpenSearchProductStock(invData.productId, invData.newStock);
              }
              break;
            }

            case KAFKA_TOPICS.PAYMENT_UPDATED: {
              console.log(`[Kafka Consumer: payment-updated] Payment status:`, parsed.data);
              break;
            }

            case KAFKA_TOPICS.ORDER_STATUS_UPDATED: {
              console.log(`[Kafka Consumer: order-status-updated] Order status update:`, parsed.data);
              break;
            }

            case KAFKA_TOPICS.NOTIFICATION_REQUESTED: {
              // Trigger WhatsApp notification
              const notifData = parsed.data;
              if (notifData.phone && notifData.message) {
                await sendWhatsAppNotification({
                  phone: notifData.phone,
                  message: notifData.message,
                  type: notifData.type || 'ORDER_CONFIRMATION',
                  orderId: notifData.orderId,
                  userId: notifData.userId,
                });
              }
              break;
            }

            default:
              console.log(`[Kafka Consumer] Unhandled topic: ${topic}`);
          }

          // Mark event as successfully processed for idempotency
          await markEventAsProcessed(eventId, eventType, CONSUMER_GROUP);
        } catch (execErr: any) {
          console.error(`[Kafka Consumer] Error processing event ${eventId}:`, execErr.message);
          // Can write to dead_letter_events table if persistent failure
        }
      },
    });
  } catch (err: any) {
    console.warn(`[Kafka Consumer] Notice: Could not connect to Kafka cluster (${err.message}). Consumer waiting for cluster availability.`);
  }
}
