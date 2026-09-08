-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ExperienceDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "ExperienceOutcome" AS ENUM ('SELECTED', 'REJECTED', 'WAITLISTED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('APTITUDE', 'CODING', 'TECHNICAL', 'HR', 'RESUME', 'COMPANY_PREP', 'DRIVE_PREP', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "drive_experiences" DROP COLUMN "isModerated",
ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "difficulty" "ExperienceDifficulty",
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "narrative" TEXT,
ADD COLUMN     "outcome" "ExperienceOutcome" NOT NULL DEFAULT 'PREFER_NOT_TO_SAY',
ADD COLUMN     "overallRating" INTEGER,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ExperienceStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT,
ALTER COLUMN "alumniProfileId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "drive_resources" DROP COLUMN "isModerated",
ADD COLUMN     "category" "ResourceCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ResourceStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT,
ALTER COLUMN "alumniProfileId" DROP NOT NULL,
ALTER COLUMN "companyName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "drive_experiences_applicationId_key" ON "drive_experiences"("applicationId");

-- CreateIndex
CREATE INDEX "drive_experiences_status_idx" ON "drive_experiences"("status");

-- CreateIndex
CREATE INDEX "drive_experiences_alumniProfileId_idx" ON "drive_experiences"("alumniProfileId");

-- CreateIndex
CREATE INDEX "drive_experiences_studentId_idx" ON "drive_experiences"("studentId");

-- CreateIndex
CREATE INDEX "drive_resources_status_idx" ON "drive_resources"("status");

-- CreateIndex
CREATE INDEX "drive_resources_category_idx" ON "drive_resources"("category");

-- CreateIndex
CREATE INDEX "drive_resources_alumniProfileId_idx" ON "drive_resources"("alumniProfileId");

-- CreateIndex
CREATE INDEX "drive_resources_studentId_idx" ON "drive_resources"("studentId");

-- AddForeignKey
ALTER TABLE "drive_experiences" ADD CONSTRAINT "drive_experiences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_experiences" ADD CONSTRAINT "drive_experiences_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_resources" ADD CONSTRAINT "drive_resources_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

