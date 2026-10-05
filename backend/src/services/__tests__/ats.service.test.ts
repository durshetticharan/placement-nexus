/**
 * ATS Service Test Script — v2 (accuracy fixes)
 *
 * Validates the improved ATS scoring logic with:
 *  - The 4 original JDs (new expected baselines)
 *  - New edge-case JDs (no bullets, experience mismatch, fresher)
 *
 * Run: npx tsx src/services/__tests__/ats.service.test.ts
 */

import {
  deterministicExtract,
  calculateAtsScore,
  normalizeSkill,
} from '../ats.service';

// ── Test Data ────────────────────────────────────────────────────────────────

const candidateResume = `
Contact Info
Education: BTech Computer Science
Skills: Python, Java, SQL, React, Git
Experience: Software Engineer at XYZ (3 years). Built REST APIs with Node.js and Express.
Projects: Web App using React and MongoDB.
`;

const toughJD = `PRINCIPAL AI/ML PLATFORM ENGINEER

Required:

Python
Go
Java
Advanced SQL
Apache Spark
Apache Kafka
PyTorch
TensorFlow
XGBoost
Kubernetes
Docker
AWS
Terraform
MLflow
Kubeflow
gRPC
Distributed Systems
System Design
OAuth 2.0
OpenID Connect

Experience:

5+ years professional software engineering
3+ years production ML systems

Preferred:

LLM
RAG
LangChain
LlamaIndex
AWS Bedrock
Vector Databases
Prometheus
Grafana
OpenTelemetry`;

const nonsenseJD = `NASA FLUX CAPACITOR QUANTUM ORBITAL ENGINEER

Required skills:

- Quantum Orbital Programming
- Flux Capacitor Architecture
- Temporal Database Engineering
- Chrono Distributed Systems
- Quantum Kubernetes
- Hyperdimensional SQL

Experience:

10+ years Quantum Engineering`;

const perfectJD = `
Required skills:
- Python
- Java
- SQL
- React
- Git
- Node.js
- Express
- MongoDB

Experience: 3+ years Software Engineering
Education: Bachelor degree
`;

const partialJD = `
Required skills:
- Python
- Java
- SQL
- React
- Git
- Docker
- Kubernetes
- AWS
- Kafka
- Go
`;

// New edge case: JD with NO section headers at all
const headerlessJD = `
Looking for a Python developer who knows React and MongoDB.
Must have experience with Docker and AWS.
5 years minimum experience required.
`;

// New edge case: Perfect match with experience/education
const fullMatchJD = `
Required:

Python
Java
SQL
React
Git
Node.js
Express
MongoDB

Experience:

3+ years software engineering

Education:

Bachelor's degree in Computer Science

Preferred:

REST API
`;

// ── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assertRange(name: string, actual: number, min: number, max: number): void {
  if (actual >= min && actual <= max) {
    console.log(`  ✓ ${name}: ${actual} (expected ${min}–${max})`);
    passed++;
  } else {
    console.log(`  ✗ ${name}: ${actual} (expected ${min}–${max})`);
    failed++;
  }
}

function assertEqual(name: string, actual: any, expected: any): void {
  if (actual === expected) {
    console.log(`  ✓ ${name}: "${actual}"`);
    passed++;
  } else {
    console.log(`  ✗ ${name}: "${actual}" (expected "${expected}")`);
    failed++;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  ATS SERVICE v2 — ACCURACY TESTS');
console.log('═══════════════════════════════════════════════════════════════\n');

// ── normalizeSkill tests ─────────────────────────────────────────────────────

console.log('── normalizeSkill ──────────────────────────────────────────────');
const aliasTests: [string, string][] = [
  ['react.js', 'React'],
  ['React.js', 'React'],
  ['node js', 'Node.js'],
  ['NODEJS', 'Node.js'],
  ['postgresql', 'PostgreSQL'],
  ['AWS', 'AWS'],
  ['spring boot', 'Spring Boot'],
  ['python', 'Python'],
  ['TypeScript', 'TypeScript'],
  ['apache kafka', 'Kafka'],
  ['tensorflow', 'TensorFlow'],
];

for (const [input, expected] of aliasTests) {
  assertEqual(`normalizeSkill("${input}")`, normalizeSkill(input), expected);
}

// ── Extraction tests ─────────────────────────────────────────────────────────

console.log('\n── Extraction Quality ──────────────────────────────────────────');

// Test: Tough JD should extract all 20 required skills (plain text, no bullets)
const toughExtraction = deterministicExtract(candidateResume, toughJD);
assertRange('Tough JD: required skills extracted', toughExtraction.jdRequiredSkills.length, 15, 25);
assertRange('Tough JD: preferred skills extracted', toughExtraction.jdPreferredSkills.length, 5, 15);
assertRange('Tough JD: experience reqs extracted', toughExtraction.jdExperienceRequirements.length, 1, 5);
console.log(`    Required: ${toughExtraction.jdRequiredSkills.join(', ')}`);
console.log(`    Preferred: ${toughExtraction.jdPreferredSkills.join(', ')}`);
console.log(`    Exp Reqs: ${toughExtraction.jdExperienceRequirements.join(', ')}`);

// Test: Nonsense JD should extract the fake skills (they're bulleted)
const nonsenseExtraction = deterministicExtract(candidateResume, nonsenseJD);
assertRange('Nonsense JD: required skills extracted', nonsenseExtraction.jdRequiredSkills.length, 4, 8);
assertRange('Nonsense JD: experience reqs extracted', nonsenseExtraction.jdExperienceRequirements.length, 1, 3);
console.log(`    Required: ${nonsenseExtraction.jdRequiredSkills.join(', ')}`);

// ── Scoring tests ────────────────────────────────────────────────────────────

console.log('\n── ATS Scoring ────────────────────────────────────────────────');

function runTest(name: string, jd: string, minScore: number, maxScore: number): void {
  const extraction = deterministicExtract(candidateResume, jd);
  const result = calculateAtsScore(extraction);

  console.log(`\n  ${name}`);
  console.log(`    Required:  ${result.matchDetails.jdRequiredSkills.join(', ') || '(none extracted)'}`);
  console.log(`    Matched:   ${result.matchDetails.matchedRequiredSkills.join(', ') || '(none)'}`);
  console.log(`    Missing:   ${result.matchDetails.missingRequiredSkills.join(', ') || '(none)'}`);
  console.log(`    Exp Rel:   ${result.matchDetails.experienceRelevance}`);
  console.log(`    Edu Match: ${result.matchDetails.educationMatch}`);
  console.log(`    Breakdown: ${JSON.stringify(result.scoreBreakdown)}`);

  assertRange(`${name} score`, result.atsScore, minScore, maxScore);
}

// Tough JD: Fresher with 3/20 skills, 3 years vs 5+ needed → very low score
runTest('TOUGH JD', toughJD, 5, 30);

// Nonsense JD: No real skills match, 10+ years needed → near zero
runTest('NONSENSE JD', nonsenseJD, 0, 15);

// Perfect JD: All 8 skills match + experience + education → very high
runTest('PERFECT JD', perfectJD, 85, 100);

// Partial: 5/10 skills match → moderate
runTest('PARTIAL MATCH JD', partialJD, 30, 60);

// Full match with experience + education
runTest('FULL MATCH JD', fullMatchJD, 75, 100);

// Headerless JD: No "Required:" section → should extract very few requirements
runTest('HEADERLESS JD', headerlessJD, 0, 40);

// ── Discrimination test ──────────────────────────────────────────────────────

console.log('\n── Discrimination Test ─────────────────────────────────────────');

const perfectResult = calculateAtsScore(deterministicExtract(candidateResume, perfectJD));
const toughResult = calculateAtsScore(deterministicExtract(candidateResume, toughJD));
const nonsenseResult = calculateAtsScore(deterministicExtract(candidateResume, nonsenseJD));

const perfectMinusTough = perfectResult.atsScore - toughResult.atsScore;
const perfectMinusNonsense = perfectResult.atsScore - nonsenseResult.atsScore;

console.log(`\n  Perfect(${perfectResult.atsScore}) - Tough(${toughResult.atsScore}) = ${perfectMinusTough} point gap`);
console.log(`  Perfect(${perfectResult.atsScore}) - Nonsense(${nonsenseResult.atsScore}) = ${perfectMinusNonsense} point gap`);

// The gap between a perfect match and a terrible match should be at least 50 points
assertRange('Perfect vs Tough gap', perfectMinusTough, 50, 100);
assertRange('Perfect vs Nonsense gap', perfectMinusNonsense, 70, 100);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
