/**
 * Seed script — creates Placement Officer account, master Skills catalog,
 * Career Paths, Skill Requirements, and Learning Resources.
 *
 * Run with: npm run seed
 * Fully idempotent — safe to execute repeatedly without generating duplicates.
 */

import { PrismaClient, ProficiencyLevel, RequirementPriority } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const OFFICER_EMAIL = 'officer@placementnexus.dev';
const OFFICER_PASSWORD = 'Officer@2024';

// ── 1. Master Skill Catalog ───────────────────────────────────────────────────

interface SkillSeed {
  name: string;
  category: string;
}

const SKILLS_SEED: SkillSeed[] = [
  // Programming Languages
  { name: 'Python', category: 'Programming Language' },
  { name: 'Java', category: 'Programming Language' },
  { name: 'C++', category: 'Programming Language' },
  { name: 'JavaScript', category: 'Programming Language' },
  { name: 'TypeScript', category: 'Programming Language' },
  { name: 'Go', category: 'Programming Language' },

  // Computer Science Core
  { name: 'Data Structures & Algorithms', category: 'CS Fundamentals' },
  { name: 'System Design', category: 'CS Fundamentals' },
  { name: 'Computer Networks', category: 'CS Fundamentals' },
  { name: 'Operating Systems', category: 'CS Fundamentals' },
  { name: 'Database Management Systems', category: 'CS Fundamentals' },
  { name: 'Problem Solving', category: 'CS Fundamentals' },

  // Databases & Backend
  { name: 'SQL', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'REST API Design', category: 'Backend' },

  // DevOps & Cloud
  { name: 'Git', category: 'DevOps & Tools' },
  { name: 'Docker', category: 'DevOps & Tools' },
  { name: 'Kubernetes', category: 'DevOps & Tools' },
  { name: 'Linux', category: 'DevOps & Tools' },
  { name: 'CI/CD Pipelines', category: 'DevOps & Tools' },
  { name: 'AWS', category: 'Cloud Infrastructure' },

  // Data & Analytics
  { name: 'Statistics', category: 'Data & Analytics' },
  { name: 'Pandas', category: 'Data & Analytics' },
  { name: 'NumPy', category: 'Data & Analytics' },
  { name: 'Data Visualization', category: 'Data & Analytics' },
  { name: 'Machine Learning Fundamentals', category: 'Data & Analytics' },
];

// ── 2. Career Paths ────────────────────────────────────────────────────────────

interface CareerPathSeed {
  name: string;
  description: string;
}

const CAREER_PATHS_SEED: CareerPathSeed[] = [
  {
    name: 'Software Engineer',
    description: 'Build scalable software applications, core features, algorithms, and backend systems.',
  },
  {
    name: 'Data Analyst',
    description: 'Extract insights from complex datasets, write SQL queries, and build analytical dashboards.',
  },
  {
    name: 'DevOps Engineer',
    description: 'Manage cloud infrastructure, containerization, automated build pipelines, and reliability.',
  },
  {
    name: 'Frontend Developer',
    description: 'Design responsive, accessible, interactive web interfaces using modern frameworks.',
  },
  {
    name: 'Full Stack Engineer',
    description: 'End-to-end web application development covering database, server APIs, and modern client UIs.',
  },
];

// ── 3. Skill Requirements per Career Path ─────────────────────────────────────

interface ReqSeed {
  skillName: string;
  requiredLevel: ProficiencyLevel;
  priority: RequirementPriority;
}

const CAREER_REQUIREMENTS: Record<string, ReqSeed[]> = {
  'Software Engineer': [
    { skillName: 'Data Structures & Algorithms', requiredLevel: 'ADVANCED', priority: 'CRITICAL' },
    { skillName: 'System Design', requiredLevel: 'INTERMEDIATE', priority: 'CRITICAL' },
    { skillName: 'Python', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Java', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'SQL', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Git', requiredLevel: 'INTERMEDIATE', priority: 'MEDIUM' },
    { skillName: 'Computer Networks', requiredLevel: 'BEGINNER', priority: 'MEDIUM' },
    { skillName: 'Operating Systems', requiredLevel: 'BEGINNER', priority: 'MEDIUM' },
    { skillName: 'REST API Design', requiredLevel: 'INTERMEDIATE', priority: 'MEDIUM' },
    { skillName: 'Problem Solving', requiredLevel: 'ADVANCED', priority: 'HIGH' },
  ],
  'Data Analyst': [
    { skillName: 'SQL', requiredLevel: 'ADVANCED', priority: 'CRITICAL' },
    { skillName: 'Statistics', requiredLevel: 'INTERMEDIATE', priority: 'CRITICAL' },
    { skillName: 'Python', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Pandas', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Data Visualization', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'NumPy', requiredLevel: 'BEGINNER', priority: 'MEDIUM' },
    { skillName: 'Database Management Systems', requiredLevel: 'INTERMEDIATE', priority: 'MEDIUM' },
  ],
  'DevOps Engineer': [
    { skillName: 'Linux', requiredLevel: 'ADVANCED', priority: 'CRITICAL' },
    { skillName: 'Docker', requiredLevel: 'ADVANCED', priority: 'CRITICAL' },
    { skillName: 'Kubernetes', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'CI/CD Pipelines', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Git', requiredLevel: 'ADVANCED', priority: 'HIGH' },
    { skillName: 'AWS', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Computer Networks', requiredLevel: 'INTERMEDIATE', priority: 'MEDIUM' },
  ],
  'Frontend Developer': [
    { skillName: 'JavaScript', requiredLevel: 'ADVANCED', priority: 'CRITICAL' },
    { skillName: 'TypeScript', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'REST API Design', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Git', requiredLevel: 'INTERMEDIATE', priority: 'MEDIUM' },
  ],
  'Full Stack Engineer': [
    { skillName: 'JavaScript', requiredLevel: 'ADVANCED', priority: 'CRITICAL' },
    { skillName: 'TypeScript', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Node.js', requiredLevel: 'INTERMEDIATE', priority: 'CRITICAL' },
    { skillName: 'SQL', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'PostgreSQL', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'REST API Design', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Data Structures & Algorithms', requiredLevel: 'INTERMEDIATE', priority: 'HIGH' },
    { skillName: 'Git', requiredLevel: 'INTERMEDIATE', priority: 'MEDIUM' },
  ],
};

// ── 4. Learning Resources Seed ────────────────────────────────────────────────

interface ResourceSeed {
  title: string;
  description: string;
  resourceType: string;
  url: string;
  provider: string;
  associatedSkills: string[];
}

const LEARNING_RESOURCES_SEED: ResourceSeed[] = [
  {
    title: 'NeetCode 150 — Data Structures & Algorithms Roadmap',
    description: 'Curated list of 150 essential DSA problems categorized by pattern and difficulty.',
    resourceType: 'PRACTICE',
    url: 'https://neetcode.io/roadmap',
    provider: 'NeetCode',
    associatedSkills: ['Data Structures & Algorithms', 'Problem Solving'],
  },
  {
    title: 'System Design Primer',
    description: 'Learn how to design large-scale systems, microservices, load balancers, and caching.',
    resourceType: 'DOCUMENTATION',
    url: 'https://github.com/donnemartin/system-design-primer',
    provider: 'GitHub Open Source',
    associatedSkills: ['System Design'],
  },
  {
    title: 'PostgreSQL Tutorial & Interactive SQL Exercises',
    description: 'Master relational queries, joins, aggregations, window functions, and indexing.',
    resourceType: 'COURSE',
    url: 'https://www.postgresqltutorial.com/',
    provider: 'PostgreSQL Tutorial',
    associatedSkills: ['SQL', 'PostgreSQL', 'Database Management Systems'],
  },
  {
    title: 'Python for Data Analysis & Pandas Crash Course',
    description: 'Hands-on guide to data manipulation, cleaning, and exploratory data analysis.',
    resourceType: 'ARTICLE',
    url: 'https://pandas.pydata.org/docs/user_guide/index.html',
    provider: 'Pandas Docs',
    associatedSkills: ['Python', 'Pandas', 'Data Visualization'],
  },
  {
    title: 'Docker & Kubernetes Fundamentals for Beginners',
    description: 'Learn containerization principles, Dockerfiles, compose, and K8s deployment concepts.',
    resourceType: 'VIDEO',
    url: 'https://docs.docker.com/get-started/',
    provider: 'Docker Documentation',
    associatedSkills: ['Docker', 'Kubernetes', 'Linux'],
  },
  {
    title: 'Git Version Control Handbook',
    description: 'Complete reference for git branching, rebase, cherry-pick, and pull request workflows.',
    resourceType: 'DOCUMENTATION',
    url: 'https://git-scm.com/doc',
    provider: 'Git SCM',
    associatedSkills: ['Git', 'CI/CD Pipelines'],
  },
];

async function main() {
  console.log('\n🚀  Starting Placement Nexus Phase 7 Seeding…\n');

  // 1. Placement Officer Account
  let officerUser = await prisma.user.findUnique({ where: { email: OFFICER_EMAIL } });
  if (!officerUser) {
    const passwordHash = await bcrypt.hash(OFFICER_PASSWORD, 10);
    officerUser = await prisma.user.create({
      data: {
        email: OFFICER_EMAIL,
        passwordHash,
        role: 'PLACEMENT_OFFICER',
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        placementOfficer: {
          create: {
            fullName: 'Placement Officer',
            designation: 'Placement Officer',
            department: 'Placement Cell',
          },
        },
      },
    });
    console.log(`✅  Seeded Placement Officer: ${OFFICER_EMAIL}`);
  } else {
    console.log(`ℹ️   Placement Officer already exists: ${OFFICER_EMAIL}`);
  }

  // 2. Master Skills Catalog
  const skillNameToIdMap = new Map<string, string>();
  for (const s of SKILLS_SEED) {
    const skillRecord = await prisma.skill.upsert({
      where: { name: s.name },
      create: { name: s.name, category: s.category },
      update: { category: s.category },
    });
    skillNameToIdMap.set(s.name, skillRecord.id);
  }
  console.log(`✅  Seeded ${SKILLS_SEED.length} master skills.`);

  // 3. Career Paths
  const careerPathNameToIdMap = new Map<string, string>();
  for (const cp of CAREER_PATHS_SEED) {
    const pathRecord = await prisma.careerPath.upsert({
      where: { name: cp.name },
      create: { name: cp.name, description: cp.description, isActive: true },
      update: { description: cp.description, isActive: true },
    });
    careerPathNameToIdMap.set(cp.name, pathRecord.id);
  }
  console.log(`✅  Seeded ${CAREER_PATHS_SEED.length} career paths.`);

  // 4. Skill Requirements
  let reqCount = 0;
  for (const [pathName, reqs] of Object.entries(CAREER_REQUIREMENTS)) {
    const careerPathId = careerPathNameToIdMap.get(pathName);
    if (!careerPathId) continue;

    for (const r of reqs) {
      const skillId = skillNameToIdMap.get(r.skillName);
      if (!skillId) continue;

      await prisma.careerSkillRequirement.upsert({
        where: {
          careerPathId_skillId: { careerPathId, skillId },
        },
        create: {
          careerPathId,
          skillId,
          requiredLevel: r.requiredLevel,
          priority: r.priority,
        },
        update: {
          requiredLevel: r.requiredLevel,
          priority: r.priority,
        },
      });
      reqCount++;
    }
  }
  console.log(`✅  Seeded ${reqCount} career skill requirements.`);

  // 5. Learning Resources
  let resCount = 0;
  for (const lr of LEARNING_RESOURCES_SEED) {
    const existingResource = await prisma.learningResource.findFirst({
      where: { url: lr.url },
    });

    let resourceId: string;
    if (!existingResource) {
      const created = await prisma.learningResource.create({
        data: {
          title: lr.title,
          description: lr.description,
          resourceType: lr.resourceType,
          url: lr.url,
          provider: lr.provider,
        },
      });
      resourceId = created.id;
    } else {
      const updated = await prisma.learningResource.update({
        where: { id: existingResource.id },
        data: {
          title: lr.title,
          description: lr.description,
          resourceType: lr.resourceType,
          provider: lr.provider,
        },
      });
      resourceId = updated.id;
    }

    // Link resource skills idempotently
    for (const skillName of lr.associatedSkills) {
      const skillId = skillNameToIdMap.get(skillName);
      if (!skillId) continue;

      await prisma.learningResourceSkill.upsert({
        where: {
          learningResourceId_skillId: { learningResourceId: resourceId, skillId },
        },
        create: {
          learningResourceId: resourceId,
          skillId,
        },
        update: {},
      });
    }
    resCount++;
  }
  console.log(`✅  Seeded ${resCount} learning resources and skill links.`);

  console.log('\n🎉  Phase 7 seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
