/**
 * E2E Verification & Shape Cross-Check Script
 */

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
  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function run() {
  const email = `e2etest_${Date.now()}@example.com`;
  const rollNumber = `ROLL_${Date.now()}`;

  // 1. Register
  await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', role: 'STUDENT', fullName: 'E2E Student', rollNumber }),
  });

  const otp = runSql(`SELECT "otpCode" FROM users WHERE email = '${email}';`);
  await request('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode: otp }),
  });

  const loginRes = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' }),
  });

  const token = loginRes.body?.data?.accessToken;
  console.log('--- Step 5: Login ---');
  console.log('Token acquired:', token ? 'YES' : 'NO');

  // 2. Resume Upload
  const pdfBuf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const formData = new FormData();
  formData.append('resume', new Blob([pdfBuf], { type: 'application/pdf' }), 'e2e_resume.pdf');

  const uploadRes = await request('/students/me/resumes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  console.log('\n--- Step 6: Upload Resume ---');
  console.log('Upload status:', uploadRes.status);
  console.log('Upload response:', JSON.stringify(uploadRes.body, null, 2));

  // 3. GET Resumes List & Compare Shape
  const listResumes = await request('/students/me/resumes', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('\n--- Step 7: Resumes List Backend Response Shape ---');
  console.log(JSON.stringify(listResumes.body?.data?.[0], null, 2));

  // 4. Professional Profile & Compare Shape
  const profRes = await request('/students/me/professional-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ platform: 'LINKEDIN', profileUrl: 'https://linkedin.com/in/e2estudent' }),
  });

  console.log('\n--- Step 8: Professional Profile Backend Response Shape ---');
  console.log(JSON.stringify(profRes.body?.data, null, 2));

  // 5. Coding Profile & Compare Shape
  const codingRes = await request('/students/me/coding-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      platform: 'GITHUB',
      username: 'e2edev',
      profileUrl: 'https://github.com/e2edev',
      statistics: { repos: 42, followers: 10, rating: 'Gold' },
    }),
  });

  console.log('\n--- Step 9: Coding Profile Backend Response Shape ---');
  console.log(JSON.stringify(codingRes.body?.data, null, 2));

  // 6. Duplicate Platform Error Response
  const dupCodingRes = await request('/students/me/coding-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      platform: 'GITHUB',
      username: 'e2edev_dup',
      profileUrl: 'https://github.com/e2edev_dup',
    }),
  });

  console.log('\n--- Step 10: Duplicate Platform Error Response ---');
  console.log('Status:', dupCodingRes.status);
  console.log('Body:', JSON.stringify(dupCodingRes.body, null, 2));

  // 7. Non-PDF Upload Error Response
  const formDataTxt = new FormData();
  formDataTxt.append('resume', new Blob([Buffer.from('not pdf')], { type: 'text/plain' }), 'test.txt');

  const badResumeRes = await request('/students/me/resumes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formDataTxt,
  });

  console.log('\n--- Step 11: Non-PDF Upload Error Response ---');
  console.log('Status:', badResumeRes.status);
  console.log('Body:', JSON.stringify(badResumeRes.body, null, 2));
}

run().catch(console.error);
