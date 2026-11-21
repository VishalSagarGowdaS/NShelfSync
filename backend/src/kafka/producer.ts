import { getKafkaProducer, KAFKA_TOPICS, isKafkaLive } from './client.js';
import { query } from '../database/db.js';

export interface BaseKafkaEvent<T = any> {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  timestamp: string;
  data: T;
}

export async function publishKafkaEvent(topic: string, event: BaseKafkaEvent): Promise<boolean> {
  try {
    const producer = await getKafkaProducer();
    if (!isKafkaLive()) {
      console.warn(`[Kafka Producer] Cluster offline. Event ${event.eventId} kept in outbox queue for retry.`);
      return false;
    }

    await producer.send({
      topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
          headers: {
            eventId: event.eventId,
            eventType: event.eventType,
            timestamp: event.timestamp,
          },
        },
      ],
    });

    console.log(`[Kafka Producer] Published event ${event.eventType} to topic [${topic}] (key: ${event.aggregateId})`);
    return true;
  } catch (err: any) {
    console.error(`[Kafka Producer] Failed to publish event to [${topic}]:`, err.message);
    return false;
  }
}

/**
 * Transactional Outbox helper to record event inside a DB transaction
 */
export async function insertOutboxEvent(
  client: any,
  aggregateType: string,
  aggregateId: string,
  eventType: string,
  topic: string,
  payload: any
): Promise<string> {
  const res = await client.query(`
    INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, topic, payload, status)
    VALUES ($1, $2, $3, $4, $5, 'PENDING')
    RETURNING id;
  `, [aggregateType, aggregateId, eventType, topic, JSON.stringify(payload)]);
  return res.rows[0].id;
}
