
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

import { env } from './config/env.js';
import apiRouter from './routes/api.js';
import { testDbConnection } from './database/db.js';
import {
  createProductIndex,
  syncAllProductsFromDbToOpenSearch,
} from './opensearch/indexManager.js';
import { startOutboxWorker } from './workers/outboxWorker.js';
import { startKafkaConsumers } from './workers/kafkaConsumers.js';

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })
);

// Parse JSON and preserve raw body for Razorpay webhook verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
    limit: '5mb',
  })
);

app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

app.use('/api', apiLimiter);

// Mount ShelfSync API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Server Error]:', err);

    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  }
);

// Server Initialization
export async function startServer() {
  const port = env.PORT;

  const server = app.listen(port, async () => {
    console.log('=======================================================');
    console.log('  ShelfSync E-Commerce API Server Running!');
    console.log(`  Port: ${port} | Environment: ${env.NODE_ENV}`);
    console.log(`  Health Check: /api/health`);
    console.log('=======================================================');

    try {
      // Verify Aiven PostgreSQL
      const dbConn = await testDbConnection();

      if (dbConn.connected) {
        console.log('[Aiven PostgreSQL] Database connected and ready.');
      } else {
        console.warn('[Aiven PostgreSQL] Database connection unavailable.');
      }

      // Initialize OpenSearch index
      await createProductIndex();
      await syncAllProductsFromDbToOpenSearch();

      // Start background event workers
      startOutboxWorker(5000);

      startKafkaConsumers().catch((kErr) => {
        console.warn('[Aiven Kafka] Consumer startup note:', kErr.message);
      });
    } catch (error) {
      console.error('[Startup Initialization Error]:', error);
    }
  });

  server.on('error', (error) => {
    console.error('[HTTP Server Error]:', error);
    process.exit(1);
  });

  return server;
}

// Start if executed directly (Windows + Linux compatible)
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  startServer().catch((err) => {
    console.error('[Fatal Startup Error]:', err);
    process.exit(1);
  });
}
