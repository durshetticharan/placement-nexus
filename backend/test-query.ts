import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const students = await prisma.student.findMany({
    where: { user: { status: 'ACTIVE' }, profileCompletionPct: 100 },
    select: { userId: true }
  });
  console.log(students);
}

test().catch(console.error).finally(() => prisma.$disconnect());
