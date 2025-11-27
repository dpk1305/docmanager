import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './utils/logger';
import { testConnection } from './config/database';
import { initSchema } from './config/schema';
import authRouter from './routes/auth';
import documentsRouter from './routes/documents';
import foldersRouter from './routes/folders';
import tagsRouter from './routes/tags';
import searchRouter from './routes/search';
import adminRouter from './routes/admin';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.cors.origin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

app.use(
  rateLimit({
    windowMs: env.security.rateLimitWindowMs,
    max: env.security.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes will be added here
app.get(`${env.apiPrefix}`, (_req, res) => {
  res.json({
    message: 'Document Manager API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: env.apiPrefix,
    },
  });
});

app.use(`${env.apiPrefix}/auth`, authRouter);
app.use(`${env.apiPrefix}/documents`, documentsRouter);
app.use(`${env.apiPrefix}/folders`, foldersRouter);
app.use(`${env.apiPrefix}/tags`, tagsRouter);
app.use(`${env.apiPrefix}/search`, searchRouter);
app.use(`${env.apiPrefix}/admin`, adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      logger.info('Starting server without database connection (limited functionality)');
    }

    try {
      if (dbConnected) {
        await initSchema();
      }
    } catch (e) {
      logger.error('Schema initialization failed', e as any);
    }

    // Start listening
    app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port}`);
      logger.info(`📁 Environment: ${env.nodeEnv}`);
      logger.info(`🔗 API available at http://localhost:${env.port}${env.apiPrefix}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  // Close database connections, etc.
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export default app;
