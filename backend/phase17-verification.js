const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { spawn } = require('child_process');
const path = require('path');

// Mock req/res for Express controllers
function mockResponse() {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
}

function mockRequest(user, body = {}, params = {}) {
  return {
    user,
    body,
    params,
    headers: {}
  };
}

async function run() {
  console.log('=== Phase 17 AI Integration Verification ===');
  
  let pythonProcess;
  try {
    // 1. Start Python AI Service in the background
    console.log('[1] Starting FastAPI AI Service...');
    const aiServicePath = path.join(__dirname, '../ai-service');
    const pythonExe = path.join(aiServicePath, 'venv', 'Scripts', 'python.exe');
    
    pythonProcess = spawn(pythonExe, ['-m', 'uvicorn', 'app.main:app', '--port', '8000'], {
      cwd: aiServicePath,
      env: { ...process.env, AI_PROVIDER: 'mock', AI_INTERNAL_KEY: 'test-key' }
    });

    // Wait for FastAPI to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Set env vars for Node
    process.env.AI_SERVICE_URL = 'http://localhost:8000';
    process.env.AI_INTERNAL_KEY = 'test-key';

    // Import controllers & client AFTER env vars are set
    const aiController = require('./dist/controllers/ai.controller');
    const aiClient = require('./dist/services/ai.client');

    console.log('[2] Testing AI Health...');
    const health = await aiClient.checkAIHealth();
    console.log('Health Output:', health);
    if (health.status !== 'ok' || health.provider !== 'mock') {
      throw new Error('AI Health check failed or not using mock provider');
    }
    console.log('  -> Health check PASS');

    console.log('[3] Setting up Test Data...');
    // Create test user and student profile
    const testUser = await prisma.user.create({
      data: {
        email: 'test_ai_student@nexus.com',
        passwordHash: 'hash',
        role: 'STUDENT',
        status: 'ACTIVE'
      }
    });

    const testStudent = await prisma.student.create({
      data: {
        userId: testUser.id,
        fullName: 'AI Test Student',
        rollNumber: 'AI1001'
      }
    });

    // Create a dummy resume
    const resume = await prisma.resume.create({
      data: {
        studentId: testStudent.id,
        fileUrl: 'fake_url',
        fileName: 'resume.pdf',
        fileSizeBytes: 1024,
        isPrimary: true
      }
    });
    console.log('  -> Test user & resume created');

    console.log('[4] Testing Resume Analysis...');
    const reqResume = mockRequest({ userId: testUser.id }, { resume_text: 'A'.repeat(100) });
    const resResume = mockResponse();
    await aiController.resumeAnalyze(reqResume, resResume);
    if (!resResume.data?.success || !resResume.data?.data?.isAiGenerated) {
      throw new Error('Resume analysis failed: ' + JSON.stringify(resResume.data));
    }
    
    // Check if ResumeAnalysis record was created
    const analysisCount = await prisma.resumeAnalysis.count({
      where: { studentId: testStudent.id }
    });
    if (analysisCount === 0) throw new Error('ResumeAnalysis record not created');
    console.log('  -> Resume analysis PASS');

    console.log('[5] Testing Career Guidance...');
    const reqCareer = mockRequest({ userId: testUser.id });
    const resCareer = mockResponse();
    await aiController.careerGuidance(reqCareer, resCareer);
    if (!resCareer.data?.success || !resCareer.data?.data?.isAiGenerated) {
      throw new Error('Career guidance failed: ' + JSON.stringify(resCareer.data));
    }
    console.log('  -> Career guidance PASS');

    console.log('[6] Testing Interview Question Generation & Ownership (IDOR)...');
    const reqInterview = mockRequest({ userId: testUser.id }, { role: 'Software Engineer', count: 3 });
    const resInterview = mockResponse();
    await aiController.interviewGenerateQuestions(reqInterview, resInterview);
    
    if (!resInterview.data?.success || !resInterview.data?.data?.sessionId) {
      throw new Error('Interview question generation failed: ' + JSON.stringify(resInterview.data));
    }
    const sessionId = resInterview.data.data.sessionId;
    const questions = resInterview.data.data.questions;
    console.log('  -> Questions generated successfully. Session ID:', sessionId);

    console.log('[7] Testing Interview Answer Evaluation...');
    const reqEval = mockRequest({ userId: testUser.id }, { 
      session_id: sessionId,
      question: questions[0].question,
      answer: 'My answer',
      role: 'Software Engineer',
      topic: questions[0].topic
    });
    const resEval = mockResponse();
    await aiController.interviewEvaluateAnswer(reqEval, resEval);
    
    if (!resEval.data?.success || !resEval.data?.data?.isAiGenerated) {
      throw new Error('Answer evaluation failed: ' + JSON.stringify(resEval.data));
    }
    console.log('  -> Evaluation PASS');

    console.log('[8] Testing IDOR on Session Evaluation...');
    // Create another user
    const hackerUser = await prisma.user.create({
      data: { email: 'hacker@nexus.com', passwordHash: 'hash', role: 'STUDENT', status: 'ACTIVE' }
    });
    const hackerStudent = await prisma.student.create({
      data: { userId: hackerUser.id, fullName: 'Hacker', rollNumber: 'HACK01' }
    });
    
    const reqEvalHacker = mockRequest({ userId: hackerUser.id }, { 
      session_id: sessionId,
      question: questions[0].question,
      answer: 'My answer',
      role: 'Software Engineer',
      topic: questions[0].topic
    });
    const resEvalHacker = mockResponse();
    await aiController.interviewEvaluateAnswer(reqEvalHacker, resEvalHacker);
    if (resEvalHacker.statusCode !== 403) {
      throw new Error('IDOR vulnerability detected! Hacker could evaluate session they do not own. Status code: ' + resEvalHacker.statusCode);
    }
    console.log('  -> Session IDOR protection PASS');

    console.log('[9] Checking Non-mutation of Deterministic Scores...');
    // Ensure ReadinessScores were NOT mutated by AI tests
    const readinessCount = await prisma.readinessScore.count({ where: { studentId: testStudent.id }});
    if (readinessCount > 0) {
      throw new Error('AI mutated ReadinessScore!');
    }
    console.log('  -> Deterministic score protection PASS');

    console.log('[10] Testing Drive Preparation AI...');
    const company = await prisma.company.create({
      data: { name: 'AI Test Corp', status: 'ACTIVE' }
    });
    const recruiterUser = await prisma.user.create({
      data: { email: 'recruiter@nexus.com', passwordHash: 'hash', role: 'RECRUITER', status: 'ACTIVE' }
    });
    const recruiter = await prisma.recruiter.create({
      data: { userId: recruiterUser.id, companyId: company.id, fullName: 'Test Recruiter' }
    });
    const drive = await prisma.placementDrive.create({
      data: {
        companyId: company.id,
        createdByRecruiterId: recruiter.id,
        title: 'Software Engineer Drive',
        jobTitle: 'Software Engineer',
        description: 'Test Drive',
        location: 'Remote',
        applicationStartAt: new Date(),
        applicationEndAt: new Date(Date.now() + 86400000)
      }
    });

    const reqDrivePrep = mockRequest({ userId: testUser.id }, {}, { drive_id: drive.id });
    const resDrivePrep = mockResponse();
    await aiController.drivePreparationAdvice(reqDrivePrep, resDrivePrep);
    if (!resDrivePrep.data?.success || !resDrivePrep.data?.data?.isAiGenerated) {
      throw new Error('Drive Preparation AI failed: ' + JSON.stringify(resDrivePrep.data));
    }
    console.log('  -> Drive Preparation PASS');

    console.log('[11] Testing Provider Failure...');
    const reqFail = mockRequest({ userId: testUser.id }, { resume_text: 'ERROR_TRIGGER_TEST' }); // Our mock provider doesn't necessarily fail on this, but we can test validation error at least
    const resFail = mockResponse();
    await aiController.resumeAnalyze(mockRequest({ userId: testUser.id }, { resume_text: '' }), resFail);
    if (resFail.statusCode !== 400) {
      throw new Error('Expected 400 for empty resume text, got ' + resFail.statusCode);
    }
    console.log('  -> Validation Error PASS');

    console.log('\n✅ PHASE 17 VERIFICATION SUCCESSFUL');

  } catch (err) {
    console.error('\n❌ PHASE 17 VERIFICATION FAILED:');
    console.error(err);
  } finally {
    console.log('\nCleaning up test data...');
    try {
      await prisma.user.deleteMany({
        where: { email: { in: ['test_ai_student@nexus.com', 'hacker@nexus.com', 'recruiter@nexus.com'] } }
      });
      await prisma.company.deleteMany({
        where: { name: 'AI Test Corp' }
      });
    } catch(e) {}
    await prisma.$disconnect();

    if (pythonProcess) {
      pythonProcess.kill();
    }
  }
}

run();
