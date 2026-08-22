import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

export default router;
