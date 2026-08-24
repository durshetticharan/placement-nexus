-- AlterTable
ALTER TABLE "career_paths" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "career_paths_isActive_idx" ON "career_paths"("isActive");
