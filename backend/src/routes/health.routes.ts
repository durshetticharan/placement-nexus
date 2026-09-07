import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/health
 * Liveness probe — confirms the process is running.
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/v1/health/db
 * Readiness probe — confirms the database connection is available.
 * Never exposes connection strings or internal paths.
 */
router.get('/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Do NOT expose the error message — it may contain the DB connection string
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is not available.',
      },
    });
  }
});

/**
 * GET /api/v1/health/ready
 * Combined readiness check (process + DB).
 * Used by Docker/orchestrators to gate traffic.
 */
router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is not ready.',
      },
    });
  }
});

export default router;
