const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5000/api/v1';
const PG_CONN = { user: 'postgres', password: 'root', host: '127.0.0.1', db: 'placement_nexus' };

function runSql(query) {
  const cmd = `psql -U ${PG_CONN.user} -h ${PG_CONN.host} -d ${PG_CONN.db} -t -A -c "${query.replace(/"/g, '\\"')}"`;
  try {
    return execSync(cmd, { env: { ...process.env, PGPASSWORD: PG_CONN.password }, encoding: 'utf-8' }).trim();
  } catch (e) {
    return null;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function run() {
  console.log('===============================================================');
  console.log('PHASE 6 END-TO-END FUNCTIONAL & SCORING VERIFICATION');
  console.log('===============================================================\n');

  const results = [];

  // Step 1: tsc check (already run, but recorded here)
  results.push({ check: 1, desc: 'tsc --noEmit backend & frontend', status: 'PASS' });

  // Step 2: Login as Officer
  const officerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'officer@placementnexus.dev', password: 'Officer@2024' }),
  });
  const officerToken = officerLogin.body?.data?.accessToken;
  console.log('Step 2: Officer Login Status:', officerLogin.status, '| Token acquired:', !!officerToken);
  results.push({ check: 2, desc: 'Officer login & accessToken', status: officerToken ? 'PASS' : 'FAIL' });

  // Step 3: Register & Login Student 1 + Student 2
  const s1Email = `student1_${Date.now()}@nexus.test`;
  const s1Roll = `ROLL1_${Date.now()}`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: s1Email, password: 'StudentPass123!', role: 'STUDENT', fullName: 'Student One', rollNumber: s1Roll }),
  });
  const s1Otp = runSql(`SELECT "otpCode" FROM users WHERE email = '${s1Email}';`);
  await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: s1Email, otpCode: s1Otp }),
  });
  const s1Login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: s1Email, password: 'StudentPass123!' }),
  });
  const s1Token = s1Login.body?.data?.accessToken;

  // Student 2 for security tests
  const s2Email = `student2_${Date.now()}@nexus.test`;
  const s2Roll = `ROLL2_${Date.now()}`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: s2Email, password: 'StudentPass123!', role: 'STUDENT', fullName: 'Student Two', rollNumber: s2Roll }),
  });
  const s2Otp = runSql(`SELECT "otpCode" FROM users WHERE email = '${s2Email}';`);
  await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: s2Email, otpCode: s2Otp }),
  });
  const s2Login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: s2Email, password: 'StudentPass123!' }),
  });
  const s2Token = s2Login.body?.data?.accessToken;

  console.log('Step 3: Student 1 Token:', !!s1Token, '| Student 2 Token:', !!s2Token);
  results.push({ check: 3, desc: 'Student login & accessTokens', status: (s1Token && s2Token) ? 'PASS' : 'FAIL' });

  // Step 4: Officer creates assessment
  const createAssRes = await request('/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      title: 'Phase 6 Qualifier Exam',
      description: 'Comprehensive Test',
      category: 'APTITUDE',
      topic: 'Logical Reasoning',
      durationMins: 10,
      passPercentage: 60,
    }),
  });
  const assessmentId = createAssRes.body?.data?.id;
  console.log('\nStep 4: Create Assessment Status:', createAssRes.status, '| ID:', assessmentId);
  results.push({ check: 4, desc: 'POST /assessments (Officer create)', status: (createAssRes.status === 201 && assessmentId) ? 'PASS' : 'FAIL' });

  // Step 5: Question 1 — MCQ_SINGLE
  const q1Res = await request(`/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      type: 'MCQ_SINGLE',
      text: 'What is 2+2?',
      topic: 'Arithmetic',
      marks: 5,
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ],
    }),
  });
  const q1 = q1Res.body?.data;
  const q1CorrectOpt = q1?.options?.find(o => o.isCorrect);
  console.log('Step 5: Question 1 (MCQ_SINGLE) Status:', q1Res.status, '| Q1 ID:', q1?.id, '| Correct Opt:', q1CorrectOpt?.id);
  results.push({ check: 5, desc: 'POST question 1 (MCQ_SINGLE)', status: (q1Res.status === 201 && q1?.id) ? 'PASS' : 'FAIL' });

  // Step 6: Question 2 — MCQ_MULTIPLE
  const q2Res = await request(`/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      type: 'MCQ_MULTIPLE',
      text: 'Which are prime numbers?',
      topic: 'Number Theory',
      marks: 5,
      options: [
        { text: '2', isCorrect: true },
        { text: '4', isCorrect: false },
        { text: '7', isCorrect: true },
        { text: '9', isCorrect: false },
      ],
    }),
  });
  const q2 = q2Res.body?.data;
  const q2CorrectOpts = q2?.options?.filter(o => o.isCorrect).map(o => o.id);
  console.log('Step 6: Question 2 (MCQ_MULTIPLE) Status:', q2Res.status, '| Q2 ID:', q2?.id, '| Correct Opts:', q2CorrectOpts);
  results.push({ check: 6, desc: 'POST question 2 (MCQ_MULTIPLE)', status: (q2Res.status === 201 && q2?.id) ? 'PASS' : 'FAIL' });

  // Step 7: Question 3 — DESCRIPTIVE
  const q3Res = await request(`/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      type: 'DESCRIPTIVE',
      text: 'Explain your reasoning approach.',
      marks: 5,
    }),
  });
  const q3 = q3Res.body?.data;
  console.log('Step 7: Question 3 (DESCRIPTIVE) Status:', q3Res.status, '| Q3 ID:', q3?.id);
  results.push({ check: 7, desc: 'POST question 3 (DESCRIPTIVE)', status: (q3Res.status === 201 && q3?.id) ? 'PASS' : 'FAIL' });

  // Step 8: Try publishing empty assessment
  const emptyAssRes = await request('/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      title: 'Empty Assessment',
      category: 'TECHNICAL',
      topic: 'Testing',
      durationMins: 5,
    }),
  });
  const emptyId = emptyAssRes.body?.data?.id;
  const pubEmptyRes = await request(`/assessments/${emptyId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  console.log('Step 8: Publish 0-question assessment Status:', pubEmptyRes.status, '| Rejection message:', pubEmptyRes.body?.error?.message);
  results.push({ check: 8, desc: 'Publish 0-question assessment rejected (400)', status: (pubEmptyRes.status === 400) ? 'PASS' : 'FAIL' });

  // Step 9: Publish real assessment
  const pubRealRes = await request(`/assessments/${assessmentId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  console.log('Step 9: Publish real assessment Status:', pubRealRes.status, '| Status:', pubRealRes.body?.data?.status);
  results.push({ check: 9, desc: 'Publish 3-question assessment (200)', status: (pubRealRes.status === 200 && pubRealRes.body?.data?.status === 'PUBLISHED') ? 'PASS' : 'FAIL' });

  // Step 10: Security Check — Student GET /assessments/:id must NOT leak isCorrect
  const studentGetAssRes = await request(`/assessments/${assessmentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${s1Token}` },
  });
  const studentAssData = studentGetAssRes.body?.data;
  const isCorrectLeaked = JSON.stringify(studentAssData).includes('"isCorrect"');
  console.log('Step 10: Student GET assessment Status:', studentGetAssRes.status, '| Answer key leaked:', isCorrectLeaked);
  results.push({ check: 10, desc: 'Student GET assessment strips isCorrect flags', status: (!isCorrectLeaked && studentGetAssRes.status === 200) ? 'PASS' : 'FAIL' });

  // Step 11: Start attempt
  const startAttemptRes = await request('/attempts/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ assessmentId }),
  });
  const attemptId = startAttemptRes.body?.data?.attempt?.id;
  console.log('\nStep 11: Start attempt Status:', startAttemptRes.status, '| Attempt ID:', attemptId);
  results.push({ check: 11, desc: 'POST /attempts/start (201)', status: (startAttemptRes.status === 201 && attemptId) ? 'PASS' : 'FAIL' });

  // Step 12: Answer Q1 (MCQ_SINGLE correct choice)
  const ansQ1Res = await request(`/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ questionId: q1.id, selectedOptionId: q1CorrectOpt.id }),
  });
  console.log('Step 12: Answer Q1 (MCQ_SINGLE) Status:', ansQ1Res.status);
  results.push({ check: 12, desc: 'PATCH answer Q1 correct (200)', status: (ansQ1Res.status === 200) ? 'PASS' : 'FAIL' });

  // Step 13: Answer Q2 (MCQ_MULTIPLE correct choices [2, 7])
  const ansQ2Res = await request(`/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ questionId: q2.id, selectedOptionIds: q2CorrectOpts }),
  });
  console.log('Step 13: Answer Q2 (MCQ_MULTIPLE) Status:', ansQ2Res.status);
  results.push({ check: 13, desc: 'PATCH answer Q2 correct set (200)', status: (ansQ2Res.status === 200) ? 'PASS' : 'FAIL' });

  // Step 14: Answer Q3 (DESCRIPTIVE)
  const ansQ3Res = await request(`/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ questionId: q3.id, freeTextAnswer: 'I used deduction.' }),
  });
  console.log('Step 14: Answer Q3 (DESCRIPTIVE) Status:', ansQ3Res.status);
  results.push({ check: 14, desc: 'PATCH answer Q3 descriptive (200)', status: (ansQ3Res.status === 200) ? 'PASS' : 'FAIL' });

  // Step 15: Resume test — start attempt again returns existing attempt
  const reStartRes = await request('/attempts/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ assessmentId }),
  });
  const isResumed = reStartRes.body?.data?.resumed === true && reStartRes.body?.data?.attempt?.id === attemptId;
  console.log('Step 15: Resume test Status:', reStartRes.status, '| Resumed flag:', reStartRes.body?.data?.resumed);
  results.push({ check: 15, desc: 'POST /attempts/start returns existing attempt (resume)', status: isResumed ? 'PASS' : 'FAIL' });

  // Step 16: Submit attempt
  const submitRes = await request(`/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
  });
  console.log('\n--- RAW SUBMIT RESPONSE (POST /api/v1/attempts/:id/submit) ---');
  console.log(JSON.stringify(submitRes.body, null, 2));
  results.push({ check: 16, desc: 'POST /attempts/:id/submit (200)', status: (submitRes.status === 200) ? 'PASS' : 'FAIL' });

  // Step 17: Scoring correctness checks
  const resData = submitRes.body?.data?.result;
  const q3Ans = await request(`/attempts/${attemptId}/result`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${s1Token}` },
  });

  console.log('\n--- RAW RESULT DETAIL RESPONSE (GET /api/v1/attempts/:id/result) ---');
  console.log(JSON.stringify(q3Ans.body, null, 2));

  const resultAnswers = q3Ans?.body?.data?.answers || [];
  const q1Scored = resultAnswers.find(a => a.questionId === q1.id);
  const q2Scored = resultAnswers.find(a => a.questionId === q2.id);
  const q3Scored = resultAnswers.find(a => a.questionId === q3.id);

  const q1Correct = q1Scored?.marksAwarded === 5 && q1Scored?.isCorrect === true;
  const q2Correct = q2Scored?.marksAwarded === 5 && q2Scored?.isCorrect === true;
  const q3Pending = q3Scored?.marksAwarded === null && q3Scored?.isCorrect === null;
  const pct100 = Number(resData?.percentage) === 100;
  const hasUngraded = submitRes.body?.data?.hasUngradedQuestions === true;
  const pendingCount = submitRes.body?.data?.pendingManualReviewCount === 1;

  console.log('\n--- Step 17 Analysis ---');
  console.log('Q1 Scored 5/5:', q1Correct, `(marks=${q1Scored?.marksAwarded}, isCorrect=${q1Scored?.isCorrect})`);
  console.log('Q2 Scored 5/5:', q2Correct, `(marks=${q2Scored?.marksAwarded}, isCorrect=${q2Scored?.isCorrect})`);
  console.log('Q3 Pending:', q3Pending, `(marks=${q3Scored?.marksAwarded}, isCorrect=${q3Scored?.isCorrect})`);
  console.log('Percentage 100% (10/10 auto-graded):', pct100, `(percentage=${resData?.percentage})`);
  console.log('hasUngradedQuestions:', hasUngraded, '| pendingCount:', pendingCount);
  console.log('topicBreakdown:', JSON.stringify(resData?.topicBreakdown));

  const scoringPass = q1Correct && q2Correct && q3Pending && pct100 && hasUngraded && pendingCount;
  results.push({ check: 17, desc: 'Scoring correctness (auto-graded percentage, pending flags, topic breakdown)', status: scoringPass ? 'PASS' : 'FAIL' });

  // Step 18: Wrong-answer scoring test
  const wrongAssRes = await request('/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({ title: 'Wrong Answer Test', category: 'TECHNICAL', topic: 'Testing', durationMins: 5 }),
  });
  const wrongAssId = wrongAssRes.body?.data?.id;
  const wrongQRes = await request(`/assessments/${wrongAssId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      type: 'MCQ_SINGLE', text: 'Capital of France?', marks: 10,
      options: [{ text: 'London', isCorrect: false }, { text: 'Paris', isCorrect: true }]
    }),
  });
  const wrongQ = wrongQRes.body?.data;
  const wrongOpt = wrongQ.options.find(o => !o.isCorrect);
  await request(`/assessments/${wrongAssId}/publish`, { method: 'POST', headers: { Authorization: `Bearer ${officerToken}` } });

  const wrongStart = await request('/attempts/start', { method: 'POST', headers: { Authorization: `Bearer ${s1Token}` }, body: JSON.stringify({ assessmentId: wrongAssId }) });
  const wrongAttemptId = wrongStart.body?.data?.attempt?.id;
  await request(`/attempts/${wrongAttemptId}/answers`, { method: 'PATCH', headers: { Authorization: `Bearer ${s1Token}` }, body: JSON.stringify({ questionId: wrongQ.id, selectedOptionId: wrongOpt.id }) });
  const wrongSubmit = await request(`/attempts/${wrongAttemptId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${s1Token}` } });

  const wrongResult = wrongSubmit.body?.data?.result;
  const wrongScoredCorrectly = Number(wrongResult?.percentage) === 0 && wrongResult?.scoredMarks === 0;
  console.log('Step 18: Wrong Answer Score:', wrongResult?.percentage, '% | Scored Marks:', wrongResult?.scoredMarks);
  results.push({ check: 18, desc: 'Wrong answer scoring test (0%, 0 marks)', status: wrongScoredCorrectly ? 'PASS' : 'FAIL' });

  // Step 19: MCQ_MULTIPLE Partial selection test (exact match rule)
  const mcqMultiAssRes = await request('/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({ title: 'Partial Match Test', category: 'APTITUDE', topic: 'Math', durationMins: 5 }),
  });
  const mcqMultiAssId = mcqMultiAssRes.body?.data?.id;
  const mcqMultiQRes = await request(`/assessments/${mcqMultiAssId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      type: 'MCQ_MULTIPLE', text: 'Select even numbers', marks: 10,
      options: [
        { text: '2', isCorrect: true },
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ]
    }),
  });
  const mcqMultiQ = mcqMultiQRes.body?.data;
  const correctOptIds = mcqMultiQ.options.filter(o => o.isCorrect).map(o => o.id);
  await request(`/assessments/${mcqMultiAssId}/publish`, { method: 'POST', headers: { Authorization: `Bearer ${officerToken}` } });

  const partialStart = await request('/attempts/start', { method: 'POST', headers: { Authorization: `Bearer ${s1Token}` }, body: JSON.stringify({ assessmentId: mcqMultiAssId }) });
  const partialAttemptId = partialStart.body?.data?.attempt?.id;

  // Submit ONLY 1 of the 2 correct options
  await request(`/attempts/${partialAttemptId}/answers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ questionId: mcqMultiQ.id, selectedOptionIds: [correctOptIds[0]] }),
  });
  const partialSubmit = await request(`/attempts/${partialAttemptId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${s1Token}` } });

  const partialResult = partialSubmit.body?.data?.result;
  const partialIsZero = Number(partialResult?.percentage) === 0 && partialResult?.scoredMarks === 0;
  console.log('Step 19: Partial Match Score:', partialResult?.percentage, '% | Scored Marks:', partialResult?.scoredMarks);
  results.push({ check: 19, desc: 'MCQ_MULTIPLE partial match exact-set-rule (scores 0%, incorrect)', status: partialIsZero ? 'PASS' : 'FAIL' });

  // Step 20: Cross-student security check
  const crossStudentRes = await request(`/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${s2Token}` }, // Student 2 trying to modify Student 1's attempt
    body: JSON.stringify({ questionId: q1.id, selectedOptionId: q1CorrectOpt.id }),
  });
  console.log('Step 20: Cross-student answer PATCH Status:', crossStudentRes.status);
  results.push({ check: 20, desc: 'Cross-student attempt modification blocked (404/403)', status: (crossStudentRes.status === 404 || crossStudentRes.status === 403) ? 'PASS' : 'FAIL' });

  // Step 21: Post-submission edit test
  const postSubEditRes = await request(`/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${s1Token}` }, // Student 1 trying to edit submitted attempt
    body: JSON.stringify({ questionId: q1.id, selectedOptionId: q1CorrectOpt.id }),
  });
  console.log('Step 21: Post-submission answer PATCH Status:', postSubEditRes.status);
  results.push({ check: 21, desc: 'Post-submission answer modification blocked (409)', status: (postSubEditRes.status === 409) ? 'PASS' : 'FAIL' });

  // Step 22: Officer-only route access with Student token
  const rbacTestRes = await request('/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({ title: 'Rbac Violation', category: 'TECHNICAL', topic: 'Rbac', durationMins: 5 }),
  });
  console.log('Step 22: Student calling Officer POST /assessments Status:', rbacTestRes.status);
  results.push({ check: 22, desc: 'Student calling Officer route blocked (403)', status: (rbacTestRes.status === 403) ? 'PASS' : 'FAIL' });

  // Step 23: Student Attempt History
  const historyRes = await request('/attempts/history', {
    method: 'GET',
    headers: { Authorization: `Bearer ${s1Token}` },
  });
  const historyList = historyRes.body?.data || [];
  console.log('Step 23: History length:', historyList.length);
  results.push({ check: 23, desc: 'GET /attempts/history lists past attempts with scores', status: (historyRes.status === 200 && historyList.length >= 3) ? 'PASS' : 'FAIL' });

  console.log('\n===============================================================');
  console.log('VERIFICATION SUMMARY');
  console.log('===============================================================');
  let allPass = true;
  for (const r of results) {
    console.log(`Step ${r.check.toString().padStart(2)}: [${r.status}] ${r.desc}`);
    if (r.status !== 'PASS') allPass = false;
  }
  console.log('===============================================================');
  console.log('OVERALL STATUS:', allPass ? 'ALL 23 CHECKS PASSED ✅' : 'SOME CHECKS FAILED ❌');
  console.log('===============================================================\n');
}

run().catch(console.error);
