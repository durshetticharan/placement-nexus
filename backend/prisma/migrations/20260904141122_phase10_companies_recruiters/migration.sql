-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('COMPANY_ADMIN', 'RECRUITER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "VerificationStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "city" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "companyType" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "headquarters" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "recruiters" ADD COLUMN     "alternateEmail" TEXT,
ADD COLUMN     "department" TEXT;

-- CreateTable
CREATE TABLE "recruiter_company_memberships" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'RECRUITER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recruiter_company_memberships_companyId_idx" ON "recruiter_company_memberships"("companyId");

-- CreateIndex
CREATE INDEX "recruiter_company_memberships_recruiterId_idx" ON "recruiter_company_memberships"("recruiterId");

-- CreateIndex
CREATE INDEX "recruiter_company_memberships_status_idx" ON "recruiter_company_memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_company_memberships_recruiterId_companyId_key" ON "recruiter_company_memberships"("recruiterId", "companyId");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "recruiters_verificationStatus_idx" ON "recruiters"("verificationStatus");

-- AddForeignKey
ALTER TABLE "recruiter_company_memberships" ADD CONSTRAINT "recruiter_company_memberships_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_company_memberships" ADD CONSTRAINT "recruiter_company_memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
