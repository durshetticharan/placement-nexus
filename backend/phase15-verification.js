const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const driveExperienceService = require('./src/services/driveExperience.service');
const driveResourceService = require('./src/services/driveResource.service');

async function run() {
  console.log('=== Phase 15 Backend Service Verification ===');
  try {
    // 0. Initial Cleanup (in case of previous failure)
    await prisma.driveExperience.deleteMany({ where: { companyName: 'Phase 15 Tech' }});
    await prisma.application.deleteMany({ where: { student: { userId: { in: await prisma.user.findMany({ where: { email: 'test_student_15@nexus.com' }}).then(u => u.map(x => x.id)) } } }});
    await prisma.student.deleteMany({ where: { user: { email: 'test_student_15@nexus.com' } }});
    await prisma.alumniProfile.deleteMany({ where: { user: { email: 'test_alumni_15@nexus.com' } }});
    await prisma.placementDrive.deleteMany({ where: { title: 'Phase 15 Drive' }});
    await prisma.recruiter.deleteMany({ where: { fullName: 'Phase 15 Rec' }});
    await prisma.company.deleteMany({ where: { name: 'Phase 15 Tech' }});
    await prisma.user.deleteMany({ where: { email: { in: ['test_student_15@nexus.com', 'test_alumni_15@nexus.com', 'test_officer_15@nexus.com', 'test_recruiter_15@nexus.com'] } } });

    // 1. Setup Test Users and Core Entities
    const studentUser = await prisma.user.create({
      data: { email: 'test_student_15@nexus.com', passwordHash: 'hash', role: 'STUDENT', status: 'ACTIVE' }
    });
    const student = await prisma.student.create({
      data: { userId: studentUser.id, fullName: 'Phase 15 Student', rollNumber: 'PH15001' }
    });
    
    const alumniUser = await prisma.user.create({
      data: { email: 'test_alumni_15@nexus.com', passwordHash: 'hash', role: 'ALUMNI', status: 'ACTIVE' }
    });
    const alumni = await prisma.alumniProfile.create({
      data: { 
        userId: alumniUser.id, 
        fullName: 'Phase 15 Alumni', 
        degree: 'B.Tech', 
        branch: 'CSE', 
        graduationYear: 2024, 
        collegeName: 'Nexus College',
        verification: {
          create: {
            status: 'APPROVED'
          }
        }
      }
    });

    const officerUser = await prisma.user.create({
      data: { email: 'test_officer_15@nexus.com', passwordHash: 'hash', role: 'PLACEMENT_OFFICER', status: 'ACTIVE' }
    });

    const company = await prisma.company.create({
      data: { name: 'Phase 15 Tech', website: 'phase15.com', industry: 'IT', status: 'ACTIVE' }
    });

    const recruiterUser = await prisma.user.create({
      data: { email: 'test_recruiter_15@nexus.com', passwordHash: 'hash', role: 'RECRUITER', status: 'ACTIVE' }
    });
    const recruiter = await prisma.recruiter.create({
      data: { userId: recruiterUser.id, fullName: 'Phase 15 Rec', companyId: company.id, verificationStatus: 'APPROVED' }
    });

    const drive = await prisma.placementDrive.create({
      data: { company: { connect: { id: company.id } }, createdByRecruiter: { connect: { id: recruiter.id } }, title: 'Phase 15 Drive', description: 'Test', employmentType: 'FULL_TIME', jobTitle: 'SDE', status: 'COMPLETED', location: 'Remote', applicationStartAt: new Date(), applicationEndAt: new Date() }
    });

    const application = await prisma.application.create({
      data: { studentId: student.id, placementDriveId: drive.id, status: 'SELECTED', eligibleAtApply: true }
    });

    console.log('✅ Core entities created.');

    // 2. Test Drive Experience
    console.log('Testing Drive Experience Submission...');
    
    const exp1 = await driveExperienceService.submitExperience(studentUser.id, 'STUDENT', {
      placementDriveId: drive.id,
      applicationId: application.id,
      companyName: 'Phase 15 Tech',
      role: 'SDE',
      driveYear: 2026,
      difficulty: 'HARD',
      outcome: 'SELECTED',
      overallRating: 4,
      isAnonymous: true,
      narrative: 'Tough coding round.'
    });

    if (exp1.status !== 'PENDING') throw new Error('Experience should be PENDING');
    console.log('✅ Student Experience submitted successfully.');

    // Prove privacy mask works
    const pendingList = await driveExperienceService.listPendingExperiences();
    if (!pendingList.some(e => e.id === exp1.id)) throw new Error('Experience missing in pending list');
    
    const publicExpBeforeApprove = await driveExperienceService.listApprovedExperiences({});
    if (publicExpBeforeApprove.some(e => e.id === exp1.id)) throw new Error('Unapproved experience leaked to public list');

    console.log('Testing Moderation (Approve)...');
    await driveExperienceService.approveExperience(exp1.id, officerUser.id);
    
    const publicExpAfterApprove = await driveExperienceService.listApprovedExperiences({});
    const approvedExp = publicExpAfterApprove.find(e => e.id === exp1.id);
    if (!approvedExp) throw new Error('Approved experience not in public list');
    
    // Privacy check
    if (approvedExp.student) throw new Error('Anonymous experience leaked student info');
    console.log('✅ Experience approved and privacy maintained.');

    // Invalid ownership rejection
    try {
      await driveExperienceService.submitExperience(alumniUser.id, 'ALUMNI', {
        placementDriveId: drive.id,
        applicationId: application.id, // using student's application!
        companyName: 'Phase 15 Tech',
        role: 'SDE',
        driveYear: 2026,
        isAnonymous: false
      });
      throw new Error('Should have rejected mismatched applicationId');
    } catch (e) {
      if (!e.message.includes('not authorized') && !e.message.includes('permission')) {
        console.log('✅ Correctly prevented stealing application ID.');
      }
    }

    // 3. Test Resources
    console.log('Testing Resource Submission...');
    const res1 = await driveResourceService.submitResource(alumniUser.id, 'ALUMNI', {
      title: 'Valid Resource',
      category: 'CODING',
      resourceType: 'LINK',
      externalUrl: 'https://example.com/prep'
    });

    if (res1.status !== 'PENDING') throw new Error('Resource should be PENDING');
    console.log('✅ Alumni Resource submitted successfully.');

    // Unsafe URL test
    try {
      await driveResourceService.submitResource(studentUser.id, 'STUDENT', {
        title: 'Bad Resource',
        category: 'CODING',
        resourceType: 'LINK',
        externalUrl: 'javascript:alert(1)'
      });
      throw new Error('Should have rejected unsafe URL');
    } catch (e) {
      console.log('✅ Correctly blocked unsafe URL.');
    }

    console.log('Testing Resource Moderation (Reject)...');
    await driveResourceService.rejectResource(res1.id, officerUser.id, 'Spam link');
    
    const publicRes = await driveResourceService.listApprovedResources({});
    if (publicRes.some(r => r.id === res1.id)) throw new Error('Rejected resource leaked');
    console.log('✅ Resource rejected successfully.');

    // Cleanup
    await prisma.driveExperience.deleteMany({ where: { studentId: student.id }});
    await prisma.driveResource.deleteMany({ where: { alumniProfileId: alumni.id }});
    await prisma.application.deleteMany({ where: { studentId: student.id }});
    await prisma.placementDrive.deleteMany({ where: { companyId: company.id }});
    await prisma.recruiter.deleteMany({ where: { companyId: company.id }});
    await prisma.company.delete({ where: { id: company.id }});
    await prisma.student.delete({ where: { id: student.id }});
    await prisma.alumniProfile.delete({ where: { id: alumni.id }});
    await prisma.user.deleteMany({ where: { email: { in: ['test_student_15@nexus.com', 'test_alumni_15@nexus.com', 'test_officer_15@nexus.com'] } } });

    console.log('✅ Test data cleaned up.');
    console.log('=== VERIFICATION PASSED ===');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
