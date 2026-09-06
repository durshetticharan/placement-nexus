-- AlterTable
ALTER TABLE "alumni_profiles" ADD COLUMN     "isMentor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxMentees" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "mentorBio" TEXT,
ADD COLUMN     "mentorTopics" TEXT[];

-- AlterTable
ALTER TABLE "referral_requests" ADD COLUMN     "alumniProfileId" TEXT;

-- CreateTable
CREATE TABLE "drive_preparation_plans" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "placementDriveId" TEXT NOT NULL,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_preparation_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparation_tasks" (
    "id" TEXT NOT NULL,
    "drivePreparationPlanId" TEXT,
    "learningPathId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "driveResourceId" TEXT,
    "driveExperienceId" TEXT,
    "learningResourceId" TEXT,
    "skillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preparation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_guidance" (
    "id" TEXT NOT NULL,
    "mentorshipRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_guidance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drive_preparation_plans_studentId_placementDriveId_key" ON "drive_preparation_plans"("studentId", "placementDriveId");

-- CreateIndex
CREATE INDEX "mentor_guidance_mentorshipRequestId_idx" ON "mentor_guidance"("mentorshipRequestId");

-- AddForeignKey
ALTER TABLE "drive_preparation_plans" ADD CONSTRAINT "drive_preparation_plans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_preparation_plans" ADD CONSTRAINT "drive_preparation_plans_placementDriveId_fkey" FOREIGN KEY ("placementDriveId") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_drivePreparationPlanId_fkey" FOREIGN KEY ("drivePreparationPlanId") REFERENCES "drive_preparation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_driveResourceId_fkey" FOREIGN KEY ("driveResourceId") REFERENCES "drive_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_driveExperienceId_fkey" FOREIGN KEY ("driveExperienceId") REFERENCES "drive_experiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_learningResourceId_fkey" FOREIGN KEY ("learningResourceId") REFERENCES "learning_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_requests" ADD CONSTRAINT "referral_requests_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "alumni_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_guidance" ADD CONSTRAINT "mentor_guidance_mentorshipRequestId_fkey" FOREIGN KEY ("mentorshipRequestId") REFERENCES "mentorship_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
