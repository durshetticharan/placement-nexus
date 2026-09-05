/**
 * Targeted deletion of confirmed XSS/SQL injection test pollution from Career Path catalog.
 * 
 * CONTEXT:
 * - Created 2026-08-24 (Phase 7/8 security tests) and 2026-09-04 (Phase 9 audit test run)
 * - These are automated security-test payloads injected during XSS/SQLi validation testing
 * - They are NOT legitimate data — no student career goals reference them
 * - React renders them as escaped text (no actual XSS execution risk)
 * - But they must be removed as test pollution before production/GitHub push
 *
 * Records to delete (confirmed by db-audit-xss.js):
 *   cmt6wpm5n002lqfrconxdpod1  — <script>alert('xss_1787556037734')</script>
 *   cmt6woh73001fqfrcg3i586hc  — <script>alert('xss')</script>
 *   cmt6wuoxi000lqfr87sci3z7a  — <script>alert('xss_86a8b58b')</script>
 *   cmtn0kj4r0016qfqc8iexobsy  — <script>alert('xss_7a361ed1')</script>
 *
 * Also removing SQLi test payloads in career path names (same origin):
 *   "SQLi_Test_1787556037727' OR '1'='1"
 *   "Software' OR '1'='1"
 *   "SQLi_Test_912ef7ad' OR '1'='1"
 *   "SQLi_Test_0c17961d' OR '1'='1"
 *
 * And timestamp-named test fixtures from automated test runs:
 *   "Test Path 1787549952800", "X", "QA Engineer Track 1787556036535/1787555983252/1787556011456"
 *   "Cloud Architect 178..." (timestamped auto-generated), "P8 Test Path p8_..." etc.
 *   "Full Stack Engineer 1788..." (timestamped auto-generated)
 *
 * PRESERVING all real career paths:
 *   Backend Developer, Software Engineer, Data Analyst, DevOps Engineer, Frontend Developer,
 *   Full Stack Engineer (without timestamp), QA Engineer Track (without timestamp),
 *   Cloud Architect (without timestamp)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== TARGETED CAREER PATH CLEANUP ===\n');

  // Step 1: Check if any students have goals referencing the polluted records
  const XSS_IDS = [
    'cmt6wpm5n002lqfrconxdpod1',
    'cmt6woh73001fqfrcg3i586hc',
    'cmt6wuoxi000lqfr87sci3z7a',
    'cmtn0kj4r0016qfqc8iexobsy',
  ];

  const referencedGoals = await prisma.studentCareerGoal.findMany({
    where: { careerPathId: { in: XSS_IDS } },
    select: { id: true, studentId: true, careerPathId: true }
  });

  if (referencedGoals.length > 0) {
    console.log('⚠️  WARNING: XSS career paths are referenced by student goals:');
    referencedGoals.forEach(g => console.log(`  Goal ${g.id} → Student ${g.studentId} → Path ${g.careerPathId}`));
    console.log('These goal references must be cleared before deletion.\n');
    await prisma.studentCareerGoal.deleteMany({ where: { careerPathId: { in: XSS_IDS } } });
    console.log(`Cleared ${referencedGoals.length} dangling goal references.\n`);
  } else {
    console.log('✅ No student career goals reference XSS paths — safe to delete directly.\n');
  }

  // Step 2: Delete XSS payloads
  const xssResult = await prisma.careerPath.deleteMany({
    where: { id: { in: XSS_IDS } }
  });
  console.log(`Deleted ${xssResult.count} XSS career paths.`);

  // Step 3: Delete SQL injection test payloads
  const sqliResult = await prisma.careerPath.deleteMany({
    where: {
      OR: [
        { name: { contains: "' OR '1'='1" } },
        { name: { startsWith: 'SQLi_Test_' } },
      ]
    }
  });
  console.log(`Deleted ${sqliResult.count} SQL injection test career paths.`);

  // Step 4: Delete timestamp-named automated test fixtures (keep real ones)
  // Pattern: name contains a long timestamp (digits 13+) or starts with known test prefixes
  const timestampResult = await prisma.careerPath.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'P8 Test Path p8_' } },
        { name: { startsWith: 'Test Path 1' } },
        // timestamp-suffixed paths (the real ones don't have timestamps)
        { name: { contains: ' 1787' } },
        { name: { contains: ' 1788' } },
        { name: { equals: 'X' } },
        // QA Engineer Track with hex/timestamp suffix
        { name: { startsWith: 'QA Engineer Track 1' } },
        { name: { startsWith: 'QA Engineer Track 3' } },
        { name: { startsWith: 'QA Engineer Track a' } },
      ]
    }
  });
  console.log(`Deleted ${timestampResult.count} timestamp-named test fixture career paths.`);

  // Step 5: Verify remaining
  const remaining = await prisma.careerPath.findMany({ select: { id: true, name: true, isActive: true } });
  console.log(`\n✅ Remaining Career Paths (${remaining.length}):`);
  remaining.forEach(cp => console.log(`  [${cp.isActive ? 'ACTIVE' : 'INACTIVE'}] ${cp.name}`));

  console.log('\n=== CLEANUP COMPLETE ===');
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
