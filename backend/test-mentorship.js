const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function test() {
  const prisma = new PrismaClient();
  // Get token for student
  const res = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@nexus.com', password: 'password123' })
  });
  const data = await res.json();
  const token = data.data.accessToken;

  // Hit mentorship
  const mRes = await fetch('http://localhost:5000/api/v1/mentorships/my', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const mData = await mRes.text();
  console.log('Status:', mRes.status);
  console.log('Body:', mData);
}
test().catch(console.error);
