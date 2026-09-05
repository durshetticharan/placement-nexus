/**
 * DB inspection script: find XSS/suspicious payloads and audit career path data
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const XSS_PATTERNS = ['<script', 'alert(', 'onerror=', 'onload=', 'javascript:', 'eval('];

function isSuspicious(str) {
  if (!str) return false;
  const lower = str.toLowerCase();
  return XSS_PATTERNS.some(p => lower.includes(p.toLowerCase()));
}

async function main() {
  console.log('=== DATABASE AUDIT — XSS / SUSPICIOUS PAYLOAD SCAN ===\n');

  // 1. Career Paths
  const careerPaths = await prisma.careerPath.findMany({
    select: { id: true, name: true, description: true, createdAt: true, isActive: true }
  });
  console.log(`Career Paths: ${careerPaths.length} records`);
  const suspiciousPaths = careerPaths.filter(cp =>
    isSuspicious(cp.name) || isSuspicious(cp.description)
  );
  if (suspiciousPaths.length > 0) {
    console.log(`\n⚠️  SUSPICIOUS Career Paths (${suspiciousPaths.length}):`);
    suspiciousPaths.forEach(cp => {
      console.log(`  ID: ${cp.id}`);
      console.log(`  Name: ${JSON.stringify(cp.name)}`);
      console.log(`  Description: ${JSON.stringify(cp.description)}`);
      console.log(`  Created: ${cp.createdAt}`);
      console.log(`  Active: ${cp.isActive}`);
      console.log('');
    });
  } else {
    console.log('  ✅ No suspicious payloads found in career paths');
  }

  console.log('\n--- All Career Paths (for reference) ---');
  careerPaths.forEach(cp => {
    console.log(`  [${cp.isActive ? 'ACTIVE' : 'INACTIVE'}] ${cp.name} (created: ${cp.createdAt.toISOString()})`);
  });

  // 2. Skills
  const skills = await prisma.skill.findMany({ select: { id: true, name: true, category: true, createdAt: true } });
  const suspiciousSkills = skills.filter(s => isSuspicious(s.name) || isSuspicious(s.category));
  console.log(`\nSkills: ${skills.length} records`);
  if (suspiciousSkills.length > 0) {
    console.log(`⚠️  SUSPICIOUS Skills (${suspiciousSkills.length}):`);
    suspiciousSkills.forEach(s => console.log(`  ID: ${s.id}, Name: ${JSON.stringify(s.name)}, Created: ${s.createdAt}`));
  } else {
    console.log('  ✅ No suspicious payloads in skills');
  }

  // 3. Learning Resources
  const resources = await prisma.learningResource.findMany({ select: { id: true, title: true, url: true, createdAt: true } });
  const suspiciousResources = resources.filter(r => isSuspicious(r.title) || isSuspicious(r.url));
  console.log(`\nLearning Resources: ${resources.length} records`);
  if (suspiciousResources.length > 0) {
    console.log(`⚠️  SUSPICIOUS Learning Resources (${suspiciousResources.length}):`);
    suspiciousResources.forEach(r => console.log(`  ID: ${r.id}, Title: ${JSON.stringify(r.title)}, URL: ${JSON.stringify(r.url)}, Created: ${r.createdAt}`));
  } else {
    console.log('  ✅ No suspicious payloads in learning resources');
  }

  // 4. Companies
  const companies = await prisma.company.findMany({ select: { id: true, name: true, description: true, createdAt: true } });
  const suspiciousCompanies = companies.filter(c => isSuspicious(c.name) || isSuspicious(c.description));
  console.log(`\nCompanies: ${companies.length} records`);
  if (suspiciousCompanies.length > 0) {
    console.log(`⚠️  SUSPICIOUS Companies (${suspiciousCompanies.length}):`);
    suspiciousCompanies.forEach(c => console.log(`  ID: ${c.id}, Name: ${JSON.stringify(c.name)}, Created: ${c.createdAt}`));
  } else {
    console.log('  ✅ No suspicious payloads in companies');
  }

  // 5. Assessments
  const assessments = await prisma.assessment.findMany({ select: { id: true, title: true, description: true, createdAt: true } });
  const suspiciousAssessments = assessments.filter(a => isSuspicious(a.title) || isSuspicious(a.description));
  console.log(`\nAssessments: ${assessments.length} records`);
  if (suspiciousAssessments.length > 0) {
    console.log(`⚠️  SUSPICIOUS Assessments (${suspiciousAssessments.length}):`);
    suspiciousAssessments.forEach(a => console.log(`  ID: ${a.id}, Title: ${JSON.stringify(a.title)}, Created: ${a.createdAt}`));
  } else {
    console.log('  ✅ No suspicious payloads in assessments');
  }

  // 6. Student projects/achievements (check for XSS in user-submitted data)
  const projects = await prisma.studentProject.findMany({ select: { id: true, title: true, description: true, studentId: true, createdAt: true } });
  const suspiciousProjects = projects.filter(p => isSuspicious(p.title) || isSuspicious(p.description));
  console.log(`\nStudent Projects: ${projects.length} records`);
  if (suspiciousProjects.length > 0) {
    console.log(`⚠️  SUSPICIOUS Projects (${suspiciousProjects.length}):`);
    suspiciousProjects.forEach(p => console.log(`  ID: ${p.id}, Title: ${JSON.stringify(p.title)}`));
  } else {
    console.log('  ✅ No suspicious payloads in student projects');
  }

  console.log('\n=== SUMMARY ===');
  const totalSuspicious = suspiciousPaths.length + suspiciousSkills.length +
    suspiciousResources.length + suspiciousCompanies.length +
    suspiciousAssessments.length + suspiciousProjects.length;
  if (totalSuspicious === 0) {
    console.log('✅ No XSS/malicious payloads found in any table.');
  } else {
    console.log(`⚠️  Total suspicious records: ${totalSuspicious}`);

    // Print IDs of suspicious career paths for targeted deletion decision
    if (suspiciousPaths.length > 0) {
      console.log('\nSuspicious Career Path IDs (for review):');
      suspiciousPaths.forEach(cp => console.log(`  ${cp.id}  — ${cp.name}`));
    }
  }
}

main()
  .catch(e => { console.error('DB Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
