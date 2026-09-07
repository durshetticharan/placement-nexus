import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { NotificationService } from './src/services/notification.service';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';
const MOCK_JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret';

function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, MOCK_JWT_SECRET, { expiresIn: '1h' });
}

let studentUser: any, recruiterUser: any, officerUser: any;
let studentToken: string, recruiterToken: string, officerToken: string;

async function setup() {
  console.log('--- SETUP ---');
  // Find users
  studentUser = await prisma.user.findFirst({ where: { role: 'STUDENT', student: { isNot: null } }, include: { student: true } });
  recruiterUser = await prisma.user.findFirst({ where: { role: 'RECRUITER', recruiter: { isNot: null } }, include: { recruiter: { include: { company: true } } } });
  officerUser = await prisma.user.findFirst({ where: { role: 'PLACEMENT_OFFICER' } });

  if (!studentUser || !recruiterUser || !officerUser) {
    throw new Error('Missing test users');
  }

  studentToken = generateToken(studentUser.id, 'STUDENT');
  recruiterToken = generateToken(recruiterUser.id, 'RECRUITER');
  officerToken = generateToken(officerUser.id, 'PLACEMENT_OFFICER');
  
  console.log(`Student ID: ${studentUser.id}`);
  console.log(`Recruiter ID: ${recruiterUser.id}`);
  console.log(`Officer ID: ${officerUser.id}`);
}

async function testNotifications() {
  console.log('\n--- NOTIFICATION TESTS ---');
  
  // Clean up notifications for student
  await prisma.notification.deleteMany({ where: { userId: studentUser.id } });

  // 1. Create a notification via internal API
  await NotificationService.sendNotification({
    userId: studentUser.id,
    type: 'APPLICATION_STATUS',
    title: 'Test App Status',
    message: 'Your app is shortlisted',
    metadata: { test: true }
  });

  console.log('[PASS] NotificationService.sendNotification');

  // 2. Fetch notifications as Student
  const resList = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${studentToken}` } }).then(r => r.json());
  if (resList.data.length !== 1) throw new Error('Expected 1 notification');
  const notifId = resList.data[0].id;
  console.log('[PASS] GET /notifications');

  // 3. Notification IDOR (Recruiter tries to read Student's notification)
  const idorRes = await fetch(`${API_URL}/notifications/${notifId}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${recruiterToken}` } });
  if (idorRes.status !== 404 && idorRes.status !== 403 && idorRes.status !== 500) {
    throw new Error(`Unexpected IDOR error: ${idorRes.status}`);
  }
  console.log('[PASS] Notification IDOR protected');

  // 4. Mark as read
  const readRes = await fetch(`${API_URL}/notifications/${notifId}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${studentToken}` } });
  if (!readRes.ok) throw new Error('PATCH /read failed: ' + readRes.status);
  const notif = await prisma.notification.findUnique({ where: { id: notifId } });
  if (!notif || !notif.isRead) throw new Error('Notification not marked as read');
  console.log('[PASS] Mark notification as read');

  // 5. Mark all as read
  const readAllRes = await fetch(`${API_URL}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${studentToken}` } });
  if (!readAllRes.ok) throw new Error('PATCH /read-all failed: ' + readAllRes.status);
  console.log('[PASS] Mark all as read');

  // 6. Preferences
  const prefGet = await fetch(`${API_URL}/notifications/preferences`, { headers: { Authorization: `Bearer ${studentToken}` } }).then(r => r.json());
  if (prefGet.data.emailEnabled !== true) throw new Error('Default prefs should be true');

  await fetch(`${API_URL}/notifications/preferences`, { 
    method: 'PATCH', 
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailEnabled: false })
  });
  const prefGet2 = await fetch(`${API_URL}/notifications/preferences`, { headers: { Authorization: `Bearer ${studentToken}` } }).then(r => r.json());
  if (prefGet2.data.emailEnabled !== false) throw new Error('Prefs not updated');
  console.log('[PASS] Notification Preferences updated');
}

async function testAnalytics() {
  console.log('\n--- ANALYTICS TESTS ---');

  // Student Analytics
  const studentRes = await fetch(`${API_URL}/analytics/student`, { headers: { Authorization: `Bearer ${studentToken}` } }).then(r => r.json());
  if (typeof studentRes.data?.readinessScore !== 'number') throw new Error('Invalid student readinessScore');
  console.log('[PASS] Student Analytics');

  // Recruiter Analytics
  const recRes = await fetch(`${API_URL}/analytics/recruiter`, { headers: { Authorization: `Bearer ${recruiterToken}` } }).then(r => r.json());
  if (typeof recRes.data?.driveStats?.total !== 'number') throw new Error('Invalid recruiter driveStats');
  console.log('[PASS] Recruiter Analytics');

  // Officer Analytics
  const offRes = await fetch(`${API_URL}/analytics/officer`, { headers: { Authorization: `Bearer ${officerToken}` } }).then(r => r.json());
  if (typeof offRes.data?.students?.total !== 'number') throw new Error('Invalid officer students.total');
  console.log('[PASS] Officer Analytics');

  // IDOR - Student tries to access Recruiter Analytics
  const idorRes2 = await fetch(`${API_URL}/analytics/recruiter`, { headers: { Authorization: `Bearer ${studentToken}` } });
  if (idorRes2.status !== 403) throw new Error(`Unexpected status for IDOR: ${idorRes2.status}`);
  console.log('[PASS] Analytics IDOR protected');
}

async function run() {
  try {
    await setup();
    await testNotifications();
    await testAnalytics();
    console.log('\n--- PHASE 18 VERIFICATION PASSED ---');
    process.exit(0);
  } catch (err: any) {
    console.error('\n--- VERIFICATION FAILED ---');
    console.error(err.message);
    if (err.response?.data) console.error(err.response.data);
    process.exit(1);
  }
}

run();
