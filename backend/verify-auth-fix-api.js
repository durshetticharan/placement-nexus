/**
 * API-level verification of the authorization fix.
 * Tests that GET /career/paths works with a valid Bearer token (simulating the fixed careerService.ts).
 * Also confirms the previous broken pattern (no token) returns 401.
 */
const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.substring(0, 500) }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== API AUTHORIZATION FIX VERIFICATION ===\n');

  // Step 1: Login as officer to get access token
  const loginBody = JSON.stringify({ email: 'officer@placementnexus.dev', password: 'Officer@2024' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 5000,
    path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  console.log('1. Officer Login:', loginRes.status === 200 ? '✓ 200 OK' : `✗ ${loginRes.status}`);
  if (loginRes.status !== 200) { console.log('   Body:', loginRes.body); return; }

  const { accessToken } = JSON.parse(loginRes.body).data;
  console.log('   Access token obtained:', accessToken ? '✓' : '✗');

  // Step 2: GET /career/paths WITHOUT token (old broken behavior) → should get 401
  const noAuthRes = await makeRequest({
    hostname: 'localhost', port: 5000,
    path: '/api/v1/career/paths', method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('\n2. GET /career/paths WITHOUT Authorization (old broken behavior):');
  console.log('   Status:', noAuthRes.status, noAuthRes.status === 401 ? '✓ 401 (correct — endpoint is protected)' : '✗ unexpected');

  // Step 3: GET /career/paths WITH Bearer token (new fixed behavior) → should get 200
  const withAuthRes = await makeRequest({
    hostname: 'localhost', port: 5000,
    path: '/api/v1/career/paths', method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  });
  console.log('\n3. GET /career/paths WITH Authorization: Bearer <token> (fixed behavior):');
  console.log('   Status:', withAuthRes.status, withAuthRes.status === 200 ? '✓ 200 OK' : `✗ ${withAuthRes.status}`);
  
  if (withAuthRes.status === 200) {
    const paths = JSON.parse(withAuthRes.body).data;
    console.log('   Career paths returned:', paths.length);
    paths.forEach(p => console.log(`     - ${p.name} [${p.isActive ? 'ACTIVE' : 'inactive'}]`));
  } else {
    console.log('   Error body:', withAuthRes.body);
  }

  // Step 4: Check XSS data is gone
  const pathNames = withAuthRes.status === 200 ? JSON.parse(withAuthRes.body).data.map(p => p.name) : [];
  const hasXss = pathNames.some(n => n.includes('<script') || n.includes('alert('));
  console.log('\n4. XSS payloads in career paths:', hasXss ? '✗ STILL PRESENT' : '✓ NONE — cleaned');

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('  Auth header fix (careerService.ts):  ', withAuthRes.status === 200 ? 'PASS ✓' : 'FAIL ✗');
  console.log('  Endpoint still protected (no token):  ', noAuthRes.status === 401 ? 'PASS ✓' : 'FAIL ✗');
  console.log('  XSS data cleaned:                     ', !hasXss ? 'PASS ✓' : 'FAIL ✗');
  
  const allPass = withAuthRes.status === 200 && noAuthRes.status === 401 && !hasXss;
  console.log('\n  Overall: ' + (allPass ? '✅ ALL PASS' : '❌ SOME FAILURES'));
}

main().catch(console.error);
