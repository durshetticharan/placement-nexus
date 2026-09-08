const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check for unique index (it's a unique INDEX, not a constraint, in Postgres via Prisma @@unique)
  const r = await prisma.$queryRawUnsafe(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename='drive_preparation_plans' AND indexname LIKE '%studentId%'"
  );
  console.log('Unique index check:', JSON.stringify(r, null, 2));
  
  // Also check pg_indexes for the uniqueness
  const r2 = await prisma.$queryRawUnsafe(
    "SELECT indexname FROM pg_indexes WHERE tablename='drive_preparation_plans'"
  );
  console.log('All indexes:', JSON.stringify(r2, null, 2));
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); });
