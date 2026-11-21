
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

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

// --------------------------------------------------
// Security Headers
// --------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// --------------------------------------------------
// CORS Configuration
// --------------------------------------------------

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

// --------------------------------------------------
// JSON Body Parser
// Preserve raw body for Razorpay webhook verification
// --------------------------------------------------

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
    limit: '5mb',
  })
);

app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// API Rate Limiter
// --------------------------------------------------

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

// --------------------------------------------------
// ShelfSync API Routes
// --------------------------------------------------

app.use('/api', apiRouter);

// --------------------------------------------------
// React Frontend Configuration
// --------------------------------------------------

const currentDir = dirname(fileURLToPath(import.meta.url));

const frontendDistPath = resolve(
  currentDir,
  '../../frontend/dist'
);

if (existsSync(frontendDistPath)) {
  console.log('[Frontend] Build directory found.');

  // Serve frontend static files
  app.use(express.static(frontendDistPath));

  // React SPA fallback
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(
      resolve(frontendDistPath, 'index.html'),
      (err) => {
        if (err) {
          next(err);
        }
      }
    );
  });
} else {
  console.warn(
    '[Frontend] Build directory not found:',
    frontendDistPath
  );
}

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error('[Unhandled Server Error]:', err);

    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  }
);

// --------------------------------------------------
// Server Initialization
// --------------------------------------------------

export async function startServer() {
  const port = env.PORT;

  const server = app.listen(port, async () => {
    console.log('=======================================================');
    console.log('       ShelfSync E-Commerce Server Running!');
    console.log(`       Port: ${port}`);
    console.log(`       Environment: ${env.NODE_ENV}`);
    console.log('       Frontend: /');
    console.log('       API Health: /api/health');
    console.log('=======================================================');

    try {
      // PostgreSQL
      const dbConn = await testDbConnection();

      if (dbConn.connected) {
        console.log('[PostgreSQL] Connected successfully.');
      } else {
        console.warn('[PostgreSQL] Connection unavailable.');
      }

      // OpenSearch
      await createProductIndex();
      await syncAllProductsFromDbToOpenSearch();

      console.log('[OpenSearch] Initialization completed.');

      // Background workers
      startOutboxWorker(5000);

      // Kafka
      startKafkaConsumers().catch((error) => {
        console.warn(
          '[Kafka] Consumer startup error:',
          error.message
        );
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

// --------------------------------------------------
// Start Server (Windows + Linux Compatible)
// --------------------------------------------------

if (
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(resolve(process.argv[1])).href
) {
  startServer().catch((error) => {
    console.error('[Fatal Startup Error]:', error);
    process.exit(1);
  });
}
