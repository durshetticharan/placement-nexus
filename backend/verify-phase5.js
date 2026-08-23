/**
 * PLACEMENT NEXUS — Phase 5 Functional Verification Script
 * ==========================================================
 * Verifies Resume Management, Professional Profiles, Coding Profiles,
 * Ownership Security, and Profile Completion calculation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';
const PG_CONN = { user: 'postgres', password: 'root', host: '127.0.0.1', db: 'placement_nexus' };

const results = [];
let passCount = 0;
let failCount = 0;

function logCheck(num, title, status, details = null) {
  const symbol = status === 'PASS' ? '✅' : '❌';
  console.log(`${symbol} Check ${num}: ${title} -> ${status}`);
  if (details) {
    console.log(`   Details:`, typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
  }
  results.push({ num, title, status, details });
  if (status === 'PASS') passCount++;
  else failCount++;
}

function runSql(query) {
  const cmd = `psql -U ${PG_CONN.user} -h ${PG_CONN.host} -d ${PG_CONN.db} -t -A -c "${query.replace(/"/g, '\\"')}"`;
  try {
    const out = execSync(cmd, {
      env: { ...process.env, PGPASSWORD: PG_CONN.password },
      encoding: 'utf-8',
    });
    return out.trim();
  } catch (e) {
    return null;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function randomEmail(prefix) {
  return `${prefix}_${Date.now()}@example.com`;
}

async function main() {
  console.log('\n======================================================');
  console.log(' STARTING PHASE 5 FULL FUNCTIONAL VERIFICATION');
  console.log('======================================================\n');

  // --- Check Backend reachability ---
  const health = await request('/health');
  if (health.status !== 200) {
    console.error('Backend is NOT reachable on http://localhost:5000. Aborting.');
    process.exit(1);
  }

  let student1Token = null;
  let student1UserId = null;
  let student1StudentId = null;
  let student1Email = randomEmail('student1');
  let student1Roll = `STU_${Date.now()}`;

  // ----------------------------------------------------
  // Check 1: Log in as a fully-registered student (fullName + rollNumber), get accessToken
  // ----------------------------------------------------
  try {
    const regRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: student1Email,
        password: 'Password123!',
        role: 'STUDENT',
        fullName: 'Student One',
        rollNumber: student1Roll,
      }),
    });

    if (regRes.status !== 200 && regRes.status !== 201) {
      logCheck(1, 'Log in as a fully-registered student', 'FAIL', { step: 'register', regRes });
    } else {
      const otp = runSql(`SELECT "otpCode" FROM users WHERE email = '${student1Email}';`);
      if (!otp) {
        logCheck(1, 'Log in as a fully-registered student', 'FAIL', 'OTP not found in DB');
      } else {
        await request('/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: student1Email, otpCode: otp }),
        });

        const loginRes = await request('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: student1Email, password: 'Password123!' }),
        });

        if (loginRes.status === 200 && loginRes.body?.data?.accessToken) {
          student1Token = loginRes.body.data.accessToken;
          student1UserId = loginRes.body.data.user.id;
          student1StudentId = runSql(`SELECT id FROM students WHERE "userId" = '${student1UserId}';`);
          logCheck(1, 'Log in as a fully-registered student', 'PASS', { email: student1Email, rollNumber: student1Roll });
        } else {
          logCheck(1, 'Log in as a fully-registered student', 'FAIL', { step: 'login', loginRes });
        }
      }
    }
  } catch (err) {
    logCheck(1, 'Log in as a fully-registered student', 'FAIL', err.message);
  }

  if (!student1Token) {
    console.log('Cannot proceed without Student 1 authentication token.');
    return;
  }

  let resume1Id = null;
  let resume1FileUrl = null;
  let resume2Id = null;

  // ----------------------------------------------------
  // Check 2: Create a tiny dummy PDF file and upload it -> isPrimary is true
  // ----------------------------------------------------
  try {
    const dummyPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const formData = new FormData();
    const pdfBlob = new Blob([dummyPdfContent], { type: 'application/pdf' });
    formData.append('resume', pdfBlob, 'test_resume_1.pdf');

    const uploadRes = await request('/students/me/resumes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: formData,
    });

    if ((uploadRes.status === 200 || uploadRes.status === 201) && uploadRes.body?.data?.isPrimary === true) {
      resume1Id = uploadRes.body.data.id;
      resume1FileUrl = uploadRes.body.data.fileUrl;
      logCheck(2, 'Resume upload (first upload isPrimary=true)', 'PASS', uploadRes.body.data);
    } else {
      logCheck(2, 'Resume upload (first upload isPrimary=true)', 'FAIL', uploadRes);
    }
  } catch (err) {
    logCheck(2, 'Resume upload (first upload isPrimary=true)', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 3: GET /api/v1/students/me/resumes -> confirm valid fileUrl
  // ----------------------------------------------------
  try {
    const listRes = await request('/students/me/resumes', {
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` },
    });

    if (
      listRes.status === 200 &&
      Array.isArray(listRes.body?.data) &&
      listRes.body.data.some(r => r.id === resume1Id && r.fileUrl && typeof r.fileUrl === 'string')
    ) {
      logCheck(3, 'GET /students/me/resumes lists resume with valid fileUrl', 'PASS', listRes.body.data);
    } else {
      logCheck(3, 'GET /students/me/resumes lists resume with valid fileUrl', 'FAIL', listRes);
    }
  } catch (err) {
    logCheck(3, 'GET /students/me/resumes lists resume with valid fileUrl', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 4: Upload a SECOND dummy PDF -> confirm isPrimary is false
  // ----------------------------------------------------
  try {
    const dummyPdfContent2 = Buffer.from('%PDF-1.4\n2 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 2 0 R >>\n%%EOF');
    const formData2 = new FormData();
    const pdfBlob2 = new Blob([dummyPdfContent2], { type: 'application/pdf' });
    formData2.append('resume', pdfBlob2, 'test_resume_2.pdf');

    const uploadRes2 = await request('/students/me/resumes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: formData2,
    });

    if ((uploadRes2.status === 200 || uploadRes2.status === 201) && uploadRes2.body?.data?.isPrimary === false) {
      resume2Id = uploadRes2.body.data.id;
      logCheck(4, 'Second resume upload has isPrimary=false', 'PASS', uploadRes2.body.data);
    } else {
      logCheck(4, 'Second resume upload has isPrimary=false', 'FAIL', uploadRes2);
    }
  } catch (err) {
    logCheck(4, 'Second resume upload has isPrimary=false', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 5: PATCH /api/v1/students/me/resumes/<second resume id>/primary -> flips isPrimary
  // ----------------------------------------------------
  try {
    if (!resume2Id) {
      logCheck(5, 'PATCH primary resume', 'FAIL', 'Skipped because resume2 upload failed');
    } else {
      const patchRes = await request(`/students/me/resumes/${resume2Id}/primary`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${student1Token}` },
      });

      const listRes = await request('/students/me/resumes', {
        method: 'GET',
        headers: { Authorization: `Bearer ${student1Token}` },
      });

      const r1 = listRes.body?.data?.find(r => r.id === resume1Id);
      const r2 = listRes.body?.data?.find(r => r.id === resume2Id);

      if (patchRes.status === 200 && r2?.isPrimary === true && r1?.isPrimary === false) {
        logCheck(5, 'PATCH primary resume (second becomes primary, first flips to false)', 'PASS', { r1, r2 });
      } else {
        logCheck(5, 'PATCH primary resume (second becomes primary, first flips to false)', 'FAIL', { patchRes, r1, r2 });
      }
    }
  } catch (err) {
    logCheck(5, 'PATCH primary resume', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 6: Upload non-PDF file (.txt or .jpg) -> REJECTED with clean error
  // ----------------------------------------------------
  try {
    const txtBuffer = Buffer.from('Hello world this is not a pdf file');
    const formDataTxt = new FormData();
    const txtBlob = new Blob([txtBuffer], { type: 'text/plain' });
    formDataTxt.append('resume', txtBlob, 'invalid_file.txt');

    const badUploadRes = await request('/students/me/resumes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: formDataTxt,
    });

    const isCleanError = badUploadRes.status >= 400 && badUploadRes.status < 500 && typeof badUploadRes.body === 'object' && badUploadRes.body?.success === false;

    if (isCleanError) {
      logCheck(6, 'Non-PDF upload rejected cleanly', 'PASS', badUploadRes);
    } else {
      logCheck(6, 'Non-PDF upload rejected cleanly', 'FAIL', badUploadRes);
    }
  } catch (err) {
    logCheck(6, 'Non-PDF upload rejected cleanly', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 7: Upload file over 5MB -> REJECTED cleanly
  // ----------------------------------------------------
  try {
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 'a'); // >5MB
    const formDataLarge = new FormData();
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const fullLargeBuf = Buffer.concat([pdfHeader, largeBuffer]);
    const largeBlob = new Blob([fullLargeBuf], { type: 'application/pdf' });
    formDataLarge.append('resume', largeBlob, 'oversized.pdf');

    const largeUploadRes = await request('/students/me/resumes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: formDataLarge,
    });

    const isCleanError = largeUploadRes.status >= 400 && largeUploadRes.status < 500 && typeof largeUploadRes.body === 'object' && largeUploadRes.body?.success === false;

    if (isCleanError) {
      logCheck(7, 'Over 5MB file upload rejected cleanly', 'PASS', largeUploadRes);
    } else {
      logCheck(7, 'Over 5MB file upload rejected cleanly', 'FAIL', largeUploadRes);
    }
  } catch (err) {
    logCheck(7, 'Over 5MB file upload rejected cleanly', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 8: DELETE one resume -> removed from DB AND file deleted from disk
  // ----------------------------------------------------
  try {
    if (!resume1Id || !resume1FileUrl) {
      logCheck(8, 'DELETE resume (DB & disk cleanup)', 'FAIL', 'No resume1Id or resume1FileUrl to delete');
    } else {
      // Relative filepath on disk
      const diskPath = path.join(process.cwd(), resume1FileUrl.replace(/^\//, ''));
      const fileExistedBefore = fs.existsSync(diskPath);

      const delRes = await request(`/students/me/resumes/${resume1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${student1Token}` },
      });

      const dbCheck = runSql(`SELECT id FROM resumes WHERE id = '${resume1Id}';`);
      const fileExistsAfter = fs.existsSync(diskPath);

      if (delRes.status === 200 && !dbCheck && (!fileExistedBefore || !fileExistsAfter)) {
        logCheck(8, 'DELETE resume (removed from DB and disk)', 'PASS', {
          fileExistedBefore,
          fileExistsAfter,
          dbCheck,
          delResBody: delRes.body,
        });
      } else {
        logCheck(8, 'DELETE resume (removed from DB and disk)', 'FAIL', {
          delRes,
          dbCheck,
          fileExistedBefore,
          fileExistsAfter,
          diskPath,
        });
      }
    }
  } catch (err) {
    logCheck(8, 'DELETE resume (DB & disk cleanup)', 'FAIL', err.message);
  }

  let linkedinId = null;

  // ----------------------------------------------------
  // Check 9: POST LinkedIn profile URL -> confirm success
  // ----------------------------------------------------
  try {
    const postProfRes = await request('/students/me/professional-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        platform: 'LINKEDIN',
        profileUrl: 'https://linkedin.com/in/student1',
      }),
    });

    if ((postProfRes.status === 200 || postProfRes.status === 201) && postProfRes.body?.data?.id) {
      linkedinId = postProfRes.body.data.id;
      logCheck(9, 'POST LinkedIn profile URL', 'PASS', postProfRes.body.data);
    } else {
      logCheck(9, 'POST LinkedIn profile URL', 'FAIL', postProfRes);
    }
  } catch (err) {
    logCheck(9, 'POST LinkedIn profile URL', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 10: SECOND LinkedIn profile for same student -> 409 CONFLICT
  // ----------------------------------------------------
  try {
    const dupProfRes = await request('/students/me/professional-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        platform: 'LINKEDIN',
        profileUrl: 'https://linkedin.com/in/student1-duplicate',
      }),
    });

    if (dupProfRes.status === 409) {
      logCheck(10, 'Duplicate LinkedIn profile returns 409 CONFLICT', 'PASS', dupProfRes.body);
    } else {
      logCheck(10, 'Duplicate LinkedIn profile returns 409 CONFLICT', 'FAIL', dupProfRes);
    }
  } catch (err) {
    logCheck(10, 'Duplicate LinkedIn profile returns 409 CONFLICT', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 11: PATCH profile URL -> confirm update
  // ----------------------------------------------------
  try {
    if (!linkedinId) {
      logCheck(11, 'PATCH professional profile URL', 'FAIL', 'No LinkedIn ID available');
    } else {
      const patchProfRes = await request(`/students/me/professional-profiles/${linkedinId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${student1Token}`,
        },
        body: JSON.stringify({
          profileUrl: 'https://linkedin.com/in/student1-updated',
        }),
      });

      if (patchProfRes.status === 200 && patchProfRes.body?.data?.profileUrl === 'https://linkedin.com/in/student1-updated') {
        logCheck(11, 'PATCH professional profile URL', 'PASS', patchProfRes.body.data);
      } else {
        logCheck(11, 'PATCH professional profile URL', 'FAIL', patchProfRes);
      }
    }
  } catch (err) {
    logCheck(11, 'PATCH professional profile URL', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 12: DELETE professional profile -> confirm removal
  // ----------------------------------------------------
  try {
    if (!linkedinId) {
      logCheck(12, 'DELETE professional profile', 'FAIL', 'No LinkedIn ID available');
    } else {
      const delProfRes = await request(`/students/me/professional-profiles/${linkedinId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${student1Token}` },
      });

      const dbCheck = runSql(`SELECT id FROM professional_profiles WHERE id = '${linkedinId}';`);

      if (delProfRes.status === 200 && !dbCheck) {
        logCheck(12, 'DELETE professional profile', 'PASS', delProfRes.body);
      } else {
        logCheck(12, 'DELETE professional profile', 'FAIL', { delProfRes, dbCheck });
      }
    }
  } catch (err) {
    logCheck(12, 'DELETE professional profile', 'FAIL', err.message);
  }

  let githubId = null;
  let leetcodeId = null;

  // ----------------------------------------------------
  // Check 13: POST GitHub coding profile -> syncStatus MANUAL_ONLY
  // ----------------------------------------------------
  try {
    const postCodingRes = await request('/students/me/coding-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        platform: 'GITHUB',
        username: 'devstudent1',
        profileUrl: 'https://github.com/devstudent1',
        statistics: { repos: 42, followers: 10 },
      }),
    });

    if (
      (postCodingRes.status === 200 || postCodingRes.status === 201) &&
      postCodingRes.body?.data?.id &&
      postCodingRes.body?.data?.syncStatus === 'MANUAL_ONLY'
    ) {
      githubId = postCodingRes.body.data.id;
      logCheck(13, 'POST GitHub profile (syncStatus=MANUAL_ONLY)', 'PASS', postCodingRes.body.data);
    } else {
      logCheck(13, 'POST GitHub profile (syncStatus=MANUAL_ONLY)', 'FAIL', postCodingRes);
    }
  } catch (err) {
    logCheck(13, 'POST GitHub profile (syncStatus=MANUAL_ONLY)', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 14: SECOND GitHub profile for same student -> 409 CONFLICT
  // ----------------------------------------------------
  try {
    const dupCodingRes = await request('/students/me/coding-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        platform: 'GITHUB',
        username: 'devstudent1_dup',
        profileUrl: 'https://github.com/devstudent1_dup',
      }),
    });

    if (dupCodingRes.status === 409) {
      logCheck(14, 'Duplicate GitHub profile returns 409 CONFLICT', 'PASS', dupCodingRes.body);
    } else {
      logCheck(14, 'Duplicate GitHub profile returns 409 CONFLICT', 'FAIL', dupCodingRes);
    }
  } catch (err) {
    logCheck(14, 'Duplicate GitHub profile returns 409 CONFLICT', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 15: Add LeetCode profile -> succeeds
  // ----------------------------------------------------
  try {
    const leetcodeRes = await request('/students/me/coding-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        platform: 'LEETCODE',
        username: 'devstudent1_lc',
        profileUrl: 'https://leetcode.com/devstudent1_lc',
      }),
    });

    if ((leetcodeRes.status === 200 || leetcodeRes.status === 201) && leetcodeRes.body?.data?.id) {
      leetcodeId = leetcodeRes.body.data.id;
      logCheck(15, 'Add LeetCode profile succeeds', 'PASS', leetcodeRes.body.data);
    } else {
      logCheck(15, 'Add LeetCode profile succeeds', 'FAIL', leetcodeRes);
    }
  } catch (err) {
    logCheck(15, 'Add LeetCode profile succeeds', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 16: PATCH GitHub profile statistics -> confirm update
  // ----------------------------------------------------
  try {
    if (!githubId) {
      logCheck(16, 'PATCH GitHub profile statistics', 'FAIL', 'No GitHub ID available');
    } else {
      const patchCodingRes = await request(`/students/me/coding-profiles/${githubId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${student1Token}`,
        },
        body: JSON.stringify({
          statistics: { repos: 50, followers: 15 },
        }),
      });

      if (
        patchCodingRes.status === 200 &&
        patchCodingRes.body?.data?.statistics?.repos === 50 &&
        patchCodingRes.body?.data?.statistics?.followers === 15
      ) {
        logCheck(16, 'PATCH GitHub profile statistics', 'PASS', patchCodingRes.body.data);
      } else {
        logCheck(16, 'PATCH GitHub profile statistics', 'FAIL', patchCodingRes);
      }
    }
  } catch (err) {
    logCheck(16, 'PATCH GitHub profile statistics', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 17: DELETE LeetCode profile -> confirm removal
  // ----------------------------------------------------
  try {
    if (!leetcodeId) {
      logCheck(17, 'DELETE LeetCode profile', 'FAIL', 'No LeetCode ID available');
    } else {
      const delLeetRes = await request(`/students/me/coding-profiles/${leetcodeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${student1Token}` },
      });

      const dbCheck = runSql(`SELECT id FROM coding_profiles WHERE id = '${leetcodeId}';`);

      if (delLeetRes.status === 200 && !dbCheck) {
        logCheck(17, 'DELETE LeetCode profile', 'PASS', delLeetRes.body);
      } else {
        logCheck(17, 'DELETE LeetCode profile', 'FAIL', { delLeetRes, dbCheck });
      }
    }
  } catch (err) {
    logCheck(17, 'DELETE LeetCode profile', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 18 & 19: SECOND student setup + Ownership Security test
  // ----------------------------------------------------
  let student2Token = null;
  let student2Email = randomEmail('student2');
  let student2Roll = `STU_${Date.now()}_2`;
  let student2ResumeId = null;

  try {
    await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: student2Email,
        password: 'Password123!',
        role: 'STUDENT',
        fullName: 'Student Two',
        rollNumber: student2Roll,
      }),
    });

    const otp2 = runSql(`SELECT "otpCode" FROM users WHERE email = '${student2Email}';`);
    await request('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: student2Email, otpCode: otp2 }),
    });

    const loginRes2 = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: student2Email, password: 'Password123!' }),
    });

    if (loginRes2.status === 200 && loginRes2.body?.data?.accessToken) {
      student2Token = loginRes2.body.data.accessToken;

      const dummyPdf = Buffer.from('%PDF-1.4\n3 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 3 0 R >>\n%%EOF');
      const formDataS2 = new FormData();
      formDataS2.append('resume', new Blob([dummyPdf], { type: 'application/pdf' }), 'student2_resume.pdf');

      const s2Upload = await request('/students/me/resumes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${student2Token}` },
        body: formDataS2,
      });

      if (s2Upload.status === 200 || s2Upload.status === 201) {
        student2ResumeId = s2Upload.body?.data?.id;
        logCheck(18, 'Second student register/login & upload resume', 'PASS', { student2ResumeId });
      } else {
        logCheck(18, 'Second student register/login & upload resume', 'FAIL', s2Upload);
      }
    } else {
      logCheck(18, 'Second student register/login & upload resume', 'FAIL', loginRes2);
    }
  } catch (err) {
    logCheck(18, 'Second student register/login & upload resume', 'FAIL', err.message);
  }

  // Check 19: As FIRST student, try to DELETE second student's resume -> 403 or 404 BLOCKED
  try {
    if (!student2ResumeId) {
      logCheck(19, 'Ownership security (blocked deleting another student\'s resume)', 'FAIL', 'No student2ResumeId available');
    } else {
      const crossDelRes = await request(`/students/me/resumes/${student2ResumeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${student1Token}` },
      });

      if (crossDelRes.status === 403 || crossDelRes.status === 404) {
        logCheck(19, 'Ownership security (blocked deleting another student\'s resume)', 'PASS', crossDelRes);
      } else {
        logCheck(19, 'Ownership security (blocked deleting another student\'s resume)', 'FAIL', crossDelRes);
      }
    }
  } catch (err) {
    logCheck(19, 'Ownership security (blocked deleting another student\'s resume)', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Check 20: GET /api/v1/students/me -> resumes & codingProfiles present, profileCompletionPct updated
  // ----------------------------------------------------
  try {
    const profileRes = await request('/students/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` },
    });

    const data = profileRes.body?.data;
    const hasResumes = Array.isArray(data?.resumes) && data.resumes.length > 0;
    const hasCodingProfiles = Array.isArray(data?.codingProfiles) && data.codingProfiles.length > 0;
    const pct = data?.profileCompletionPct;

    if (profileRes.status === 200 && hasResumes && hasCodingProfiles && typeof pct === 'number' && pct > 0) {
      logCheck(20, 'GET /students/me includes resumes, codingProfiles, and updated completionPct', 'PASS', {
        resumesCount: data.resumes.length,
        codingProfilesCount: data.codingProfiles.length,
        profileCompletionPct: pct,
      });
    } else {
      logCheck(20, 'GET /students/me includes resumes, codingProfiles, and updated completionPct', 'FAIL', { profileRes, data });
    }
  } catch (err) {
    logCheck(20, 'GET /students/me includes resumes, codingProfiles, and updated completionPct', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(` VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${results.length}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});
