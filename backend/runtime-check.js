const BASE = 'http://localhost:5000/api/v1';

async function main() {
  // 1. Login as recruiter
  const login = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reca_1788693757633@test.com', password: 'Recruiter@123' })
  });
  const loginData = await login.json();
  const token = loginData.data?.accessToken;
  console.log('1. Login:', login.status, token ? 'token=OK' : 'token=MISSING');

  // 2. Get drives
  const drives = await fetch(BASE + '/recruiters/drives', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const drivesData = await drives.json();
  console.log('2. GET /recruiters/drives:', drives.status, 'count:', drivesData.data?.length);
  const driveId = drivesData.data?.[0]?.id;

  if (!driveId) {
    console.log('No drives found, stopping.');
    return;
  }

  // 3. Get applications for drive
  const apps = await fetch(BASE + '/recruiters/me/drives/' + driveId + '/applications', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const appsData = await apps.json();
  console.log('3. GET /applications:', apps.status, 'count:', appsData.data?.length);

  const firstApp = appsData.data?.[0];
  if (!firstApp) {
    console.log('No applications found, stopping.');
    return;
  }

  console.log('4. App sample:', JSON.stringify({
    id: firstApp.id,
    status: firstApp.status,
    jobMatchPct: firstApp.jobMatchPct,
    dynamicJobMatch: firstApp.dynamicJobMatch,
    hasStudentAcademics: !!firstApp.student?.academics,
    hasStudentFullName: !!firstApp.student?.fullName,
    readinessScore: firstApp.student?.readinessScores?.[0]?.overallScore ?? 'N/A'
  }, null, 2));

  // 5. Match breakdown
  const breakdown = await fetch(BASE + '/recruiters/me/applications/' + firstApp.id + '/match-breakdown', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const bdData = await breakdown.json();
  console.log('5. GET match-breakdown:', breakdown.status);
  if (bdData.data) {
    console.log('   keys:', Object.keys(bdData.data));
    console.log('   normalizedScore:', bdData.data.normalizedScore);
    console.log('   categories:', bdData.data.categories?.map(c => c.name));
  }

  // 6. IDOR test — try to access with a different token
  console.log('\n--- IDOR Test ---');
  const officerLogin = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'officer@placementnexus.dev', password: 'Officer@2024' })
  });
  const officerData = await officerLogin.json();
  const officerToken = officerData.data?.accessToken;
  console.log('Officer Login:', officerLogin.status);

  // Officer should NOT be able to access recruiter match-breakdown
  const idorAttempt = await fetch(BASE + '/recruiters/me/applications/' + firstApp.id + '/match-breakdown', {
    headers: { Authorization: 'Bearer ' + officerToken }
  });
  console.log('IDOR attempt (officer -> recruiter route):', idorAttempt.status, idorAttempt.status === 403 ? 'BLOCKED OK' : 'IDOR FAIL');
}

main().catch(e => { console.error(e); process.exit(1); });
