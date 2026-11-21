import { Request, Response } from 'express';
import { testDbConnection } from '../database/db.js';
import { testOpenSearchConnection } from '../opensearch/client.js';
import { isKafkaLive } from '../kafka/client.js';

export async function getHealthStatus(req: Request, res: Response): Promise<void> {
  const [pgResult, osResult] = await Promise.all([
    testDbConnection(),
    testOpenSearchConnection(),
  ]);

  const status = {
    service: 'ShelfSync API Server',
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    integrations: {
      postgresql: {
        provider: 'Aiven PostgreSQL',
        connected: pgResult.connected,
        version: pgResult.version || null,
        error: pgResult.error || null,
      },
      kafka: {
        provider: 'Aiven Apache Kafka',
        connected: isKafkaLive(),
      },
      opensearch: {
        provider: 'Aiven OpenSearch',
        connected: osResult.connected,
        version: osResult.version || null,
        error: osResult.error || null,
      },
    },
  };

  res.json(status);
}
