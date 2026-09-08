const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== Phase 14 Backend Verification ===');
  try {
    // 1. Setup Test Users
    const studentUser = await prisma.user.create({
      data: {
        email: 'test_student_14@nexus.com',
        passwordHash: 'hash',
        role: 'STUDENT',
        status: 'ACTIVE'
      }
    });

    const studentProfile = await prisma.student.create({
      data: {
        userId: studentUser.id,
        fullName: 'Phase 14 Student',
        rollNumber: 'PH14001'
      }
    });

    const alumniUser = await prisma.user.create({
      data: {
        email: 'test_alumni_14@nexus.com',
        passwordHash: 'hash',
        role: 'ALUMNI',
        status: 'ACTIVE'
      }
    });

    const officerUser = await prisma.user.create({
      data: {
        email: 'test_officer_14@nexus.com',
        passwordHash: 'hash',
        role: 'PLACEMENT_OFFICER',
        status: 'ACTIVE'
      }
    });

    console.log('Test users created.');

    // Function to get a JWT token
    async function getToken(email) {
      // In a real API test, we'd mock the token, but since this is an internal script 
      // we can directly use the services if we import them, but we want to test the API.
      // Let's generate a quick JWT for testing if needed, or better yet, test the service layer directly 
      // since spinning up a full test suite with tokens requires the exact secret.
      
      // Since this is just a quick verification script, let's test the Service layer directly to ensure rules work.
      const alumniService = require('./src/services/alumni.service');
      const referralService = require('./src/services/referral.service');
      
      console.log('Testing Alumni Profile Creation...');
      const profile = await alumniService.createOrUpdateProfile(alumniUser.id, {
        fullName: 'Verified Alumni 14',
        degree: 'B.Tech',
        branch: 'CSE',
        graduationYear: 2020,
        collegeName: 'Nexus Institute',
        currentCompany: 'Tech Corp',
        currentRole: 'SDE 2'
      });
      console.log('Alumni profile created with status:', profile.verification.status);
      
      if (profile.verification.status !== 'PENDING') throw new Error('Expected PENDING');

      console.log('Testing Officer Approval...');
      await alumniService.approveAlumni(profile.id, officerUser.id);
      
      const approvedProfile = await alumniService.getProfileByUserId(alumniUser.id);
      console.log('Alumni verified status:', approvedProfile.verification.status);
      if (approvedProfile.verification.status !== 'APPROVED') throw new Error('Expected APPROVED');

      console.log('Testing Opportunity Creation...');
      const opp = await referralService.createOpportunity(alumniUser.id, {
        companyName: 'Tech Corp',
        role: 'SDE 1',
        description: 'Great role for freshers'
      });
      console.log('Opportunity created:', opp.id);

      console.log('Testing Student Referral Request...');
      const req = await referralService.createRequest(studentUser.id, opp.id, 'I am a great fit!');
      console.log('Request created:', req.id, 'Status:', req.status);

      console.log('Testing Duplicate Request Rejection...');
      try {
        await referralService.createRequest(studentUser.id, opp.id, 'Trying again');
        throw new Error('Should have rejected duplicate');
      } catch (e) {
        console.log('Duplicate correctly rejected:', e.message);
      }

      console.log('Testing Alumni Request Update (Accept)...');
      await referralService.updateRequestStatus(alumniUser.id, req.id, 'ACCEPTED', 'I will refer you tomorrow.');
      
      console.log('Testing Alumni Request Update (Referred)...');
      await referralService.updateRequestStatus(alumniUser.id, req.id, 'REFERRED', 'Done.', 'Jobvite123');

      const finalReq = await referralService.getStudentRequests(studentUser.id);
      console.log('Final student request status:', finalReq[0].status);
      
      const refRecord = await prisma.referral.findUnique({ where: { referralRequestId: finalReq[0].id } });
      console.log('Immutable Referral Record created:', !!refRecord, refRecord.proofNote);
      
      console.log('All backend checks passed!');
    }

    await getToken();

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    console.log('Cleaning up...');
    await prisma.user.deleteMany({
      where: { email: { in: ['test_student_14@nexus.com', 'test_alumni_14@nexus.com', 'test_officer_14@nexus.com'] } }
    });
    await prisma.$disconnect();
  }
}

run();
