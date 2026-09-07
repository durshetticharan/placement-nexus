import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { PrismaClient } from '@prisma/client';

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

const server = app.listen(PORT, () => {
  console.log(`[server] Placement Nexus backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[server] Received ${signal}. Graceful shutdown initiated...`);

  server.close(async (err) => {
    if (err) {
      console.error('[server] Error closing HTTP server:', err.message);
    } else {
      console.log('[server] HTTP server closed. No more new connections accepted.');
    }

    try {
      await prisma.$disconnect();
      console.log('[server] Database connection closed.');
    } catch (dbErr: any) {
      console.error('[server] Error disconnecting from database:', dbErr.message);
    }

    console.log('[server] Shutdown complete.');
    process.exit(err ? 1 : 0);
  });

  // Force exit after 15 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('[server] Forced shutdown after 15s timeout.');
    process.exit(1);
  }, 15_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled Rejection:', reason);
  // Do not exit — log and continue; critical for stability
});
