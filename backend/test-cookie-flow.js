/**
 * Test whether Vite proxy properly forwards Set-Cookie headers from backend
 */
const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: d.substring(0, 500),
      }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const loginBody = JSON.stringify({
    email: 'student.demo@placementnexus.dev',
    password: 'Student@2024',
  });

  // Test 1: Login directly to backend (5000)
  console.log('\n=== TEST 1: Login direct to backend (port 5000) ===');
  const r1 = await makeRequest({
    hostname: 'localhost', port: 5000,
    path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) },
  }, loginBody);
  console.log('Status:', r1.status);
  console.log('Set-Cookie header:', r1.headers['set-cookie'] || 'NONE');
  console.log('Body preview:', r1.body.substring(0, 200));

  // Test 2: Login via Vite proxy (5173)
  console.log('\n=== TEST 2: Login via Vite proxy (port 5173) ===');
  const r2 = await makeRequest({
    hostname: 'localhost', port: 5173,
    path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) },
  }, loginBody);
  console.log('Status:', r2.status);
  console.log('Set-Cookie header:', r2.headers['set-cookie'] || 'NONE');
  console.log('Body preview:', r2.body.substring(0, 200));

  // Test 3: If login via proxy succeeded, try refresh with the cookie
  if (r2.status === 200 && r2.headers['set-cookie']) {
    const cookieHeader = Array.isArray(r2.headers['set-cookie'])
      ? r2.headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
      : r2.headers['set-cookie'].split(';')[0];
    
    console.log('\n=== TEST 3: Refresh token via Vite proxy (with cookie) ===');
    const refreshBody = JSON.stringify({});
    const r3 = await makeRequest({
      hostname: 'localhost', port: 5173,
      path: '/api/v1/auth/refresh-token', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(refreshBody),
        'Cookie': cookieHeader,
      },
    }, refreshBody);
    console.log('Status:', r3.status);
    console.log('Body:', r3.body.substring(0, 300));
  } else {
    console.log('\nSkipping Test 3 — no Set-Cookie from proxy');
  }

  // Test 4: Refresh without cookie (should fail)
  console.log('\n=== TEST 4: Refresh without cookie (expects 401) ===');
  const refreshBody = JSON.stringify({});
  const r4 = await makeRequest({
    hostname: 'localhost', port: 5173,
    path: '/api/v1/auth/refresh-token', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(refreshBody) },
  }, refreshBody);
  console.log('Status:', r4.status, '(expected 401)');
  console.log('Body:', r4.body.substring(0, 200));
}

main().catch(console.error);
