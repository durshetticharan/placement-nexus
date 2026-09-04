/**
 * audit-accounts-setup.js
 *
 * Ensures clean, deterministic test accounts exist for all 4 roles for browser testing:
 *  1. PLACEMENT_OFFICER : officer@placementnexus.dev   / Officer@2024
 *  2. STUDENT           : student.demo@placementnexus.dev / Student@2024
 *  3. RECRUITER         : recruiter.demo@placementnexus.dev / Recruiter@2024
 *  4. ALUMNI            : alumni.demo@placementnexus.dev / Alumni@2024
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setup() {
  console.log('--- Setting up deterministic test accounts ---');

  // 1. PLACEMENT OFFICER
  const officerHash = await bcrypt.hash('Officer@2024', 10);
  const officer = await prisma.user.upsert({
    where: { email: 'officer@placementnexus.dev' },
    update: {
      passwordHash: officerHash,
      status: 'ACTIVE',
      emailVerified: true,
      role: 'PLACEMENT_OFFICER',
    },
    create: {
      email: 'officer@placementnexus.dev',
      passwordHash: officerHash,
      role: 'PLACEMENT_OFFICER',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      placementOfficer: {
        create: {
          fullName: 'Campus Placement Officer',
          designation: 'Head of Placements',
          department: 'Career Services',
        },
      },
    },
    include: { placementOfficer: true },
  });
  console.log('✅ Officer account ready:', officer.email);

  // 2. STUDENT
  const studentHash = await bcrypt.hash('Student@2024', 10);
  let studentUser = await prisma.user.findUnique({
    where: { email: 'student.demo@placementnexus.dev' },
    include: { student: { include: { academics: true } } },
  });

  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        email: 'student.demo@placementnexus.dev',
        passwordHash: studentHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        student: {
          create: {
            fullName: 'Alex Morgan',
            rollNumber: 'CS2026_DEMO',
            phone: '+91 9876543210',
            gender: 'MALE',
            dateOfBirth: new Date('2004-05-15'),
            address: 'Nexus Campus Hostel, Block A',
            profileCompletionPct: 90,
            academics: {
              create: {
                collegeName: 'Nexus Institute of Technology',
                degree: 'B.Tech',
                branch: 'Computer Science and Engineering',
                cgpa: 8.85,
                tenthPercentage: 92.5,
                twelfthPercentage: 91.0,
                backlogs: 0,
                graduationYear: 2026,
              },
            },
          },
        },
      },
      include: { student: true },
    });
  } else {
    await prisma.user.update({
      where: { id: studentUser.id },
      data: {
        passwordHash: studentHash,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    if (!studentUser.student) {
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          fullName: 'Alex Morgan',
          rollNumber: 'CS2026_DEMO',
          profileCompletionPct: 90,
          academics: {
            create: {
              collegeName: 'Nexus Institute of Technology',
              degree: 'B.Tech',
              branch: 'Computer Science and Engineering',
              cgpa: 8.85,
              tenthPercentage: 92.5,
              twelfthPercentage: 91.0,
              backlogs: 0,
              graduationYear: 2026,
            },
          },
        },
      });
    }
  }

  // Link career goal if path exists
  const studentRecord = await prisma.student.findUnique({
    where: { userId: studentUser.id },
    include: { careerGoals: true },
  });

  const swPath = await prisma.careerPath.findFirst({ where: { name: 'Software Engineer' } });
  if (swPath && studentRecord && studentRecord.careerGoals.length === 0) {
    await prisma.studentCareerGoal.create({
      data: {
        studentId: studentRecord.id,
        careerPathId: swPath.id,
        isPrimary: true,
      },
    });
  }
  console.log('✅ Student account ready:', studentUser.email);

  // 3. RECRUITER & COMPANY
  const recHash = await bcrypt.hash('Recruiter@2024', 10);
  let demoCompany = await prisma.company.findFirst({ where: { name: 'Nexus Tech Innovations' } });
  if (!demoCompany) {
    demoCompany = await prisma.company.create({
      data: {
        name: 'Nexus Tech Innovations',
        legalName: 'Nexus Tech Innovations Private Limited',
        website: 'https://nexustech.example.com',
        industry: 'Software & Cloud Engineering',
        companyType: 'Product',
        description: 'Global cloud solutions and enterprise AI technologies.',
        headquarters: 'Bangalore',
        country: 'India',
        state: 'Karnataka',
        city: 'Bangalore',
        contactEmail: 'talent@nexustech.example.com',
        contactPhone: '+91 80 4444 8888',
        companySize: '1000-5000',
        foundedYear: 2018,
        status: 'ACTIVE',
        verification: {
          create: {
            status: 'APPROVED',
            verifiedAt: new Date(),
          },
        },
      },
    });
  }

  let recruiterUser = await prisma.user.findUnique({
    where: { email: 'recruiter.demo@placementnexus.dev' },
    include: { recruiter: true },
  });

  if (!recruiterUser) {
    recruiterUser = await prisma.user.create({
      data: {
        email: 'recruiter.demo@placementnexus.dev',
        passwordHash: recHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        recruiter: {
          create: {
            fullName: 'Sarah Jenkins',
            designation: 'Director of University Recruiting',
            department: 'Talent Acquisition',
            companyId: demoCompany.id,
            verificationStatus: 'APPROVED',
            verifiedAt: new Date(),
            phone: '+91 9811223344',
            alternateEmail: 'sarah.jenkins@nexustech.example.com',
            memberships: {
              create: {
                companyId: demoCompany.id,
                role: 'COMPANY_ADMIN',
                status: 'APPROVED',
                approvedAt: new Date(),
              },
            },
          },
        },
      },
      include: { recruiter: true },
    });
  } else {
    await prisma.user.update({
      where: { id: recruiterUser.id },
      data: {
        passwordHash: recHash,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    if (recruiterUser.recruiter) {
      await prisma.recruiter.update({
        where: { id: recruiterUser.recruiter.id },
        data: {
          verificationStatus: 'APPROVED',
          companyId: demoCompany.id,
        },
      });
      await prisma.recruiterCompanyMembership.upsert({
        where: {
          recruiterId_companyId: {
            recruiterId: recruiterUser.recruiter.id,
            companyId: demoCompany.id,
          },
        },
        update: {
          role: 'COMPANY_ADMIN',
          status: 'APPROVED',
        },
        create: {
          recruiterId: recruiterUser.recruiter.id,
          companyId: demoCompany.id,
          role: 'COMPANY_ADMIN',
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });
    }
  }
  console.log('✅ Recruiter account ready:', recruiterUser.email);

  // 4. ALUMNI
  const alumniHash = await bcrypt.hash('Alumni@2024', 10);
  let alumniUser = await prisma.user.findUnique({
    where: { email: 'alumni.demo@placementnexus.dev' },
    include: { alumniProfile: true },
  });

  if (!alumniUser) {
    alumniUser = await prisma.user.create({
      data: {
        email: 'alumni.demo@placementnexus.dev',
        passwordHash: alumniHash,
        role: 'ALUMNI',
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        alumniProfile: {
          create: {
            fullName: 'David Kumar',
            degree: 'B.Tech',
            branch: 'Computer Science',
            graduationYear: 2023,
            collegeName: 'Nexus Institute of Technology',
            verification: {
              create: {
                status: 'APPROVED',
                verifiedAt: new Date(),
              },
            },
          },
        },
      },
      include: { alumniProfile: true },
    });
  } else {
    await prisma.user.update({
      where: { id: alumniUser.id },
      data: {
        passwordHash: alumniHash,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }
  console.log('✅ Alumni account ready:', alumniUser.email);

  console.log('\n--- All 4 Role Test Accounts Successfully Configured ---');
}

setup()
  .catch((e) => {
    console.error('Setup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
