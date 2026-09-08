const testEmail = `test_${Date.now()}@nexus.test`;
const testPassword = 'Password@123';
const API_URL = 'http://localhost:5000/api/v1';

async function testRegister() {
  console.log(`\n--- TESTING REGISTER ---`);
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: 'Test User',
        role: 'STUDENT',
        rollNumber: 'TEST-123'
      })
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
    if (!res.ok) throw new Error('Register failed');
    return true;
  } catch (e) {
    console.error(`Register Error:`, e.message);
    return false;
  }
}

async function testLogin(email, password) {
  console.log(`\n--- TESTING LOGIN FOR ${email} ---`);
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    // Check cookies
    const cookies = res.headers.get('set-cookie');
    console.log(`Set-Cookie header: ${cookies}`);

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
    if (!res.ok) throw new Error('Login failed');
  } catch (e) {
    console.error(`Login Error:`, e.message);
  }
}

async function main() {
  const regOk = await testRegister();
  if (regOk) {
    await testLogin(testEmail, testPassword);
  }
  // test an existing one
  await testLogin('student.demo@placementnexus.dev', 'password123');
}

main();
