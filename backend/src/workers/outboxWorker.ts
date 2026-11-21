import { query } from '../database/db.js';
import { publishKafkaEvent } from '../kafka/producer.js';

let isRunning = false;

export async function processOutboxEvents(): Promise<number> {
  if (isRunning) return 0;
  isRunning = true;

  try {
    const pending = await query(`
      SELECT id, aggregate_type, aggregate_id, event_type, topic, payload, retry_count
      FROM outbox_events
      WHERE status = 'PENDING' AND retry_count < 5
      ORDER BY created_at ASC
      LIMIT 50;
    `);

    let processedCount = 0;
    for (const row of pending.rows) {
      const event = {
        eventId: row.id,
        eventType: row.event_type,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        timestamp: new Date().toISOString(),
        data: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      };

      const published = await publishKafkaEvent(row.topic, event);
      if (published) {
        await query(`
          UPDATE outbox_events
          SET status = 'SENT', sent_at = CURRENT_TIMESTAMP
          WHERE id = $1;
        `, [row.id]);
        processedCount++;
      } else {
        await query(`
          UPDATE outbox_events
          SET retry_count = retry_count + 1
          WHERE id = $1;
        `, [row.id]);
      }
    }
    return processedCount;
  } catch (err: any) {
    // Only log if not basic connection refusal
    if (!err.message?.includes('ECONNREFUSED')) {
      console.warn('[Outbox Worker] Scan error:', err.message);
    }
    return 0;
  } finally {
    isRunning = false;
  }
}

export function startOutboxWorker(intervalMs: number = 5000): NodeJS.Timeout {
  console.log(`[Outbox Worker] Started transactional outbox publisher (interval: ${intervalMs}ms)`);
  return setInterval(async () => {
    await processOutboxEvents();
  }, intervalMs);
}
