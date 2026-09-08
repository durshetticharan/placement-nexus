const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Mock Experiences & Resources ---');

  // 1. Ensure an officer exists for moderation metadata
  let officer = await prisma.user.findFirst({
    where: { role: 'PLACEMENT_OFFICER' },
  });
  if (!officer) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    officer = await prisma.user.create({
      data: {
        email: 'officer@nexus.com',
        passwordHash,
        role: 'PLACEMENT_OFFICER',
        status: 'ACTIVE',
      },
    });
  }

  // 2. Ensure an alumni profile exists
  let alumniUser = await prisma.user.findFirst({
    where: { role: 'ALUMNI' },
    include: { alumniProfile: true },
  });

  let alumniProfileId = alumniUser?.alumniProfile?.id;

  if (!alumniProfileId) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'priya.sharma@alumni.nexus.dev',
        passwordHash,
        role: 'ALUMNI',
        status: 'ACTIVE',
      },
    });
    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        fullName: 'Priya Sharma',
        degree: 'B.Tech Computer Science',
        graduationYear: 2023,
        branch: 'Computer Science',
        collegeName: 'Nexus Institute of Technology',
        currentCompany: 'Google',
        currentRole: 'Software Engineer',
        yearsExperience: 2,
        isVerified: true,
      },
    });
    alumniProfileId = profile.id;
  }

  // 3. Ensure a student profile exists
  let studentUser = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    include: { student: true },
  });

  let studentId = studentUser?.student?.id;

  if (!studentId) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'rahul.verma@student.nexus.dev',
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const s = await prisma.student.create({
      data: {
        userId: user.id,
        fullName: 'Rahul Verma',
        rollNumber: 'CS2024042',
        branch: 'Computer Science',
        degree: 'B.Tech',
        batch: 2025,
        cgpa: 8.85,
      },
    });
    studentId = s.id;
  }

  console.log(`Using Alumni ID: ${alumniProfileId}, Student ID: ${studentId}, Officer ID: ${officer.id}`);

  // 4. Mock Experiences
  const experiencesData = [
    {
      companyName: 'Google',
      role: 'Software Engineer (L3)',
      driveYear: 2024,
      difficulty: 'HARD',
      outcome: 'SELECTED',
      isAnonymous: false,
      overallRating: 5,
      overallTips: 'Focus heavily on problem breakdown, edge cases, and continuous verbal communication during coding rounds. Clean modular code is valued over hasty solutions.',
      narrative: 'The Google recruitment process was well-structured. It began with an online assessment followed by two technical DSA interview rounds and one Googleyness/Leadership round. Interviewers were exceptionally friendly and gave constructive hints whenever I paused to structure my thoughts.',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
      rounds: [
        {
          roundNumber: 1,
          roundType: 'CODING',
          topics: ['Dynamic Programming', 'Graph Traversal', 'Arrays'],
          difficulty: 'Hard',
          questionsAsked: 'Shortest path in a weighted grid with obstacles + DP state space reduction.',
          tips: 'Solve at least 80+ LeetCode Hard problems and practice explaining your logic while writing code.',
        },
        {
          roundNumber: 2,
          roundType: 'TECHNICAL',
          topics: ['Binary Trees', 'Binary Search', 'Time & Space Complexity'],
          difficulty: 'Medium',
          questionsAsked: 'Lowest Common Ancestor in a ternary tree and optimizing space complexity from O(H) to O(1).',
          tips: 'Think about corner cases like empty trees, single node, and degenerate skewed trees.',
        },
        {
          roundNumber: 3,
          roundType: 'HR',
          topics: ['Googleyness', 'Leadership', 'Conflict Resolution'],
          difficulty: 'Medium',
          questionsAsked: 'Describe a project where you had a major technical disagreement with a teammate. How did you resolve it?',
          tips: 'Structure your answers using the STAR method (Situation, Task, Action, Result).',
        },
      ],
    },
    {
      companyName: 'Microsoft',
      role: 'Software Development Engineer (SDE-1)',
      driveYear: 2024,
      difficulty: 'MEDIUM',
      outcome: 'SELECTED',
      isAnonymous: false,
      overallRating: 5,
      overallTips: 'Thoroughly revise Core CS fundamentals: Operating Systems (Paging, Threading), DBMS (Indexing, Transactions), and OOP concepts along with standard DSA.',
      narrative: 'Applied through the on-campus recruitment drive. The assessment took place on Mettl, followed by 3 interview rounds on MS Teams. The questions were practical and directly tested algorithmic thinking and core computer science fundamentals.',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
      rounds: [
        {
          roundNumber: 1,
          roundType: 'CODING',
          topics: ['Strings', 'HashMaps', 'Sliding Window'],
          difficulty: 'Medium',
          questionsAsked: 'Longest substring with at most K distinct characters with duplicate handling.',
          tips: 'Double check pointer boundaries in sliding window algorithms.',
        },
        {
          roundNumber: 2,
          roundType: 'TECHNICAL',
          topics: ['Operating Systems', 'LRU Cache', 'System Architecture'],
          difficulty: 'Medium',
          questionsAsked: 'Design and implement an LRU Cache from scratch with O(1) get and put operations. Explain Virtual Memory & Page Faults.',
          tips: 'Combine HashMap with a Doubly Linked List for the LRU Cache.',
        },
        {
          roundNumber: 3,
          roundType: 'MANAGERIAL',
          topics: ['System Design Basics', 'Resume Deep Dive'],
          difficulty: 'Easy',
          questionsAsked: 'Walk me through the architecture of your full-stack capstone project. How did you handle user authentication and database indexing?',
          tips: 'Be prepared to explain architectural choices made in your portfolio projects.',
        },
      ],
    },
    {
      companyName: 'Amazon',
      role: 'SDE-1 (Cloud & Platform)',
      driveYear: 2023,
      difficulty: 'HARD',
      outcome: 'SELECTED',
      isAnonymous: true,
      overallRating: 4,
      overallTips: 'Amazon heavily tests Leadership Principles. Have 2 to 3 distinct project stories mapped to Customer Obsession, Ownership, and Bias for Action.',
      narrative: 'The interview loop consisted of an Online Assessment with 2 coding questions plus a Work Style Assessment, followed by 3 rounds of technical interviews. Every round opened with 15-20 minutes of Amazon Leadership Principle behavioral questions.',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
      rounds: [
        {
          roundNumber: 1,
          roundType: 'CODING',
          topics: ['Heaps', 'Priority Queue', 'Topological Sort'],
          difficulty: 'Hard',
          questionsAsked: 'Package dependency resolution graph with cycle detection, followed by top K frequent elements stream.',
          tips: 'Know the trade-offs between BFS Kahn algorithm vs DFS recursion for topological sorting.',
        },
        {
          roundNumber: 2,
          roundType: 'TECHNICAL',
          topics: ['Trees', 'Serialization', 'Leadership Principles'],
          difficulty: 'Medium',
          questionsAsked: 'Serialize and Deserialize a Binary Tree. LP Question: Tell me about a time you took calculated risks.',
          tips: 'Keep code clean and articulate how edge cases (like null nodes) are formatted during serialization.',
        },
      ],
    },
    {
      companyName: 'Tata Consultancy Services (TCS)',
      role: 'Digital Software Engineer',
      driveYear: 2024,
      difficulty: 'EASY',
      outcome: 'SELECTED',
      isAnonymous: false,
      overallRating: 4,
      overallTips: 'Practice numerical aptitude and speed arithmetic for the initial cognitive test. Technical questions focus on Java fundamentals and SQL queries.',
      narrative: 'Attended the TCS National Qualifier Test (NQT) for the Digital cadre. After clearing the aptitude and advanced coding rounds, I had a combined 45-minute Technical, Managerial, and HR interview.',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
      rounds: [
        {
          roundNumber: 1,
          roundType: 'APTITUDE',
          topics: ['Quantitative Aptitude', 'Reasoning', 'Verbal'],
          difficulty: 'Medium',
          questionsAsked: 'Speed and distance, probability, permutation, and reading comprehension.',
          tips: 'Time management is key. Do not spend more than 1.5 minutes on any single question.',
        },
        {
          roundNumber: 2,
          roundType: 'TECHNICAL',
          topics: ['Java Core', 'SQL Joins', 'Object Oriented Programming'],
          difficulty: 'Easy',
          questionsAsked: 'Explain abstraction vs encapsulation. Write a SQL query to find the second highest salary without using LIMIT.',
          tips: 'Revise subqueries, GROUP BY, and HAVING clauses in SQL.',
        },
      ],
    },
    {
      companyName: 'Atlassian',
      role: 'Associate Software Engineer',
      driveYear: 2024,
      difficulty: 'VERY_HARD',
      outcome: 'WAITLISTED',
      isAnonymous: true,
      overallRating: 5,
      overallTips: 'Atlassian places supreme value on production-readiness: writing unit tests, handling null pointers, clean variable names, and thread safety.',
      narrative: 'A fantastic and deeply technical interview loop. The code craftsmanship round was one of the most practical interviews I have taken—implementing an in-memory data store with concurrency safety.',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
      rounds: [
        {
          roundNumber: 1,
          roundType: 'CODING',
          topics: ['Data Structures', 'Code Craftsmanship', 'Concurrency'],
          difficulty: 'Hard',
          questionsAsked: 'Implement an in-memory rate limiter with sliding window log and thread-safe lock management.',
          tips: 'Always write unit test assertions before telling the interviewer you are finished.',
        },
      ],
    },
  ];

  let expCount = 0;
  for (const exp of experiencesData) {
    const existing = await prisma.driveExperience.findFirst({
      where: {
        companyName: exp.companyName,
        role: exp.role,
        driveYear: exp.driveYear,
      },
    });

    if (!existing) {
      const { rounds, ...data } = exp;
      const created = await prisma.driveExperience.create({
        data: {
          ...data,
          rounds: {
            create: rounds,
          },
        },
      });
      console.log(`Created Experience: ${created.companyName} (${created.role})`);
      expCount++;
    } else {
      console.log(`Experience already exists: ${exp.companyName} (${exp.role})`);
    }
  }

  // 5. Mock Resources
  const resourcesData = [
    {
      companyName: 'General',
      category: 'CODING',
      resourceType: 'LINK',
      title: "Striver's SDE Sheet — Top 190 Coding Interview Problems",
      description: 'Comprehensive topic-wise sheet covering Arrays, Linked Lists, Trees, Dynamic Programming, and Graphs with step-by-step video solutions.',
      externalUrl: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/',
      roundType: 'CODING',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
    },
    {
      companyName: 'General',
      category: 'CODING',
      resourceType: 'LINK',
      title: 'NeetCode 150 — Practice Curated LeetCode Patterns',
      description: 'Master coding patterns (Two Pointers, Sliding Window, Backtracking, Graphs) with visual animations and Python/Java/C++ code templates.',
      externalUrl: 'https://neetcode.io/practice',
      roundType: 'CODING',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
    },
    {
      companyName: 'General',
      category: 'TECHNICAL',
      resourceType: 'GUIDE',
      title: 'Core CS Fundamentals Quick Revision Guide (OS, DBMS, Networks)',
      description: 'High-yield revision notes covering ACID transactions, indexing B-Trees, normal forms, TCP vs UDP handshake, and CPU process scheduling.',
      externalUrl: 'https://www.geeksforgeeks.org/last-minute-notes-computer-networks/',
      roundType: 'TECHNICAL',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
    },
    {
      companyName: 'Amazon',
      category: 'COMPANY_PREP',
      resourceType: 'ARTICLE',
      title: 'Amazon 16 Leadership Principles — Framework & Model Answers',
      description: 'Detailed breakdown of all Amazon Leadership Principles with concrete interview story templates using the STAR behavioral framework.',
      externalUrl: 'https://www.levels.fyi/blog/amazon-leadership-principles.html',
      roundType: 'MANAGERIAL',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
    },
    {
      companyName: 'Google',
      category: 'COMPANY_PREP',
      resourceType: 'GUIDE',
      title: 'Google Software Engineer Interview Preparation Handbook',
      description: 'Insider tips on Google technical interview rubrics, problem-solving expectations, complexity analysis, and Googleyness behavioral rounds.',
      externalUrl: 'https://techinterviewhandbook.org/google-interview-guide/',
      roundType: 'TECHNICAL',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
    },
    {
      companyName: 'General',
      category: 'HR',
      resourceType: 'ARTICLE',
      title: 'Mastering the HR Interview: The STAR Method Playbook',
      description: 'How to answer standard HR questions like "Tell me about yourself", "Strengths and Weaknesses", and handling team conflicts with poise.',
      externalUrl: 'https://www.themuse.com/advice/star-interview-method',
      roundType: 'HR',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
    },
    {
      companyName: 'General',
      category: 'RESUME',
      resourceType: 'PDF',
      title: 'Harvard ATS-Optimized Clean Resume Template',
      description: 'Minimalist single-page LaTeX & Docx resume format formatted to maximize score in Applicant Tracking Systems (ATS) for campus placements.',
      externalUrl: 'https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/',
      roundType: 'OTHER',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
    },
    {
      companyName: 'General',
      category: 'APTITUDE',
      resourceType: 'LINK',
      title: 'IndiaBIX Quantitative Aptitude & Reasoning Solved Practice Bank',
      description: 'Comprehensive repository of solved quantitative formulas, shortcuts, and tests frequently asked in online placement assessments.',
      externalUrl: 'https://www.indiabix.com/aptitude/questions-and-answers/',
      roundType: 'APTITUDE',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
    },
    {
      companyName: 'TCS',
      category: 'DRIVE_PREP',
      resourceType: 'ARTICLE',
      title: 'TCS NQT & Digital Pattern Breakdown & Previous Year Questions',
      description: 'Section-wise weightage, scoring patterns, negative marking guidelines, and recent coding questions for upcoming TCS campus drives.',
      externalUrl: 'https://prepinsta.com/tcs-nqt/',
      roundType: 'APTITUDE',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      studentId: studentId,
    },
    {
      companyName: 'General',
      category: 'TECHNICAL',
      resourceType: 'GUIDE',
      title: 'System Design Primer for College Graduates & SDE-1',
      description: 'Primer covering Caching strategies, Load Balancing, SQL vs NoSQL, Horizontal vs Vertical scaling, and REST API best practices.',
      externalUrl: 'https://github.com/donnemartin/system-design-primer',
      roundType: 'TECHNICAL',
      status: 'APPROVED',
      moderatedById: officer.id,
      moderatedAt: new Date(),
      alumniProfileId: alumniProfileId,
    },
  ];

  let resCount = 0;
  for (const res of resourcesData) {
    const existing = await prisma.driveResource.findFirst({
      where: {
        title: res.title,
      },
    });

    if (!existing) {
      const created = await prisma.driveResource.create({
        data: res,
      });
      console.log(`Created Resource: ${created.title} (${created.category})`);
      resCount++;
    } else {
      console.log(`Resource already exists: ${res.title}`);
    }
  }

  console.log(`\nSuccessfully seeded ${expCount} mock experiences and ${resCount} mock resources.`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
