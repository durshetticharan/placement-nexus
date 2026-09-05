/*
  Warnings:

  - You are about to drop the column `maxBacklogs` on the `drive_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `applicationDeadline` on the `placement_drives` table. All the data in the column will be lost.
  - You are about to drop the column `jobDescription` on the `placement_drives` table. All the data in the column will be lost.
  - You are about to drop the column `packageMax` on the `placement_drives` table. All the data in the column will be lost.
  - You are about to drop the column `packageMin` on the `placement_drives` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `placement_drives` table. All the data in the column will be lost.
  - Added the required column `applicationEndAt` to the `placement_drives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicationStartAt` to the `placement_drives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `placement_drives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobTitle` to the `placement_drives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `placement_drives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `placement_drives` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DriveStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "DriveStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "drive_requirements" DROP COLUMN "maxBacklogs",
ADD COLUMN     "allowedDegrees" TEXT[],
ADD COLUMN     "maxActiveBacklogs" INTEGER,
ADD COLUMN     "maxCgpa" DECIMAL(4,2),
ADD COLUMN     "maxHistoryBacklogs" INTEGER,
ADD COLUMN     "requireInternship" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "placement_drives" DROP COLUMN "applicationDeadline",
DROP COLUMN "jobDescription",
DROP COLUMN "packageMax",
DROP COLUMN "packageMin",
DROP COLUMN "role",
ADD COLUMN     "applicationEndAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "applicationStartAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "driveDate" TIMESTAMP(3),
ADD COLUMN     "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "jobTitle" TEXT NOT NULL,
ADD COLUMN     "jobType" TEXT NOT NULL DEFAULT 'TECHNICAL',
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "openingCount" INTEGER,
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "salaryMax" DECIMAL(12,2),
ADD COLUMN     "salaryMin" DECIMAL(12,2),
ADD COLUMN     "salaryPeriod" TEXT NOT NULL DEFAULT 'YEARLY',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "workMode" TEXT NOT NULL DEFAULT 'ONSITE';
