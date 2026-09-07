-- CreateTable
CREATE TABLE "ai_interview_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL DEFAULT 'General',
    "driveId" TEXT,
    "questions" JSONB NOT NULL,
    "answers" JSONB,
    "model" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT '1.0',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_interview_sessions_studentId_idx" ON "ai_interview_sessions"("studentId");

-- AddForeignKey
ALTER TABLE "ai_interview_sessions" ADD CONSTRAINT "ai_interview_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
