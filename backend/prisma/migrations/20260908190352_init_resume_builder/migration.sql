-- CreateTable
CREATE TABLE "built_resumes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "personalInfo" JSONB,
    "careerObjective" TEXT,
    "template" TEXT NOT NULL DEFAULT 'CLASSIC_ATS',
    "sectionConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "built_resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_educations" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "grade" TEXT,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_skills" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_projects" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technologies" TEXT NOT NULL,
    "projectUrl" TEXT,
    "githubUrl" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_experiences" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_certifications" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrg" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "expiryDate" TEXT,
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_achievements" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_languages" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "built_resumes_studentId_key" ON "built_resumes"("studentId");

-- CreateIndex
CREATE INDEX "resume_educations_resumeId_idx" ON "resume_educations"("resumeId");

-- CreateIndex
CREATE INDEX "resume_skills_resumeId_idx" ON "resume_skills"("resumeId");

-- CreateIndex
CREATE INDEX "resume_projects_resumeId_idx" ON "resume_projects"("resumeId");

-- CreateIndex
CREATE INDEX "resume_experiences_resumeId_idx" ON "resume_experiences"("resumeId");

-- CreateIndex
CREATE INDEX "resume_certifications_resumeId_idx" ON "resume_certifications"("resumeId");

-- CreateIndex
CREATE INDEX "resume_achievements_resumeId_idx" ON "resume_achievements"("resumeId");

-- CreateIndex
CREATE INDEX "resume_languages_resumeId_idx" ON "resume_languages"("resumeId");

-- AddForeignKey
ALTER TABLE "built_resumes" ADD CONSTRAINT "built_resumes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_educations" ADD CONSTRAINT "resume_educations_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_skills" ADD CONSTRAINT "resume_skills_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_projects" ADD CONSTRAINT "resume_projects_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_experiences" ADD CONSTRAINT "resume_experiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_certifications" ADD CONSTRAINT "resume_certifications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_achievements" ADD CONSTRAINT "resume_achievements_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_languages" ADD CONSTRAINT "resume_languages_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "built_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
