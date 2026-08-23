import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createResume(
  studentId: string,
  data: {
    fileUrl: string;
    fileName: string;
    fileSizeBytes: number;
    isPrimary?: boolean;
  },
) {
  if (data.isPrimary) {
    await prisma.resume.updateMany({
      where: { studentId },
      data: { isPrimary: false },
    });
  }

  return prisma.resume.create({
    data: {
      studentId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      isPrimary: data.isPrimary ?? false,
    },
  });
}

export async function findResumesByStudent(studentId: string) {
  return prisma.resume.findMany({
    where: { studentId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function findResumeById(id: string) {
  return prisma.resume.findUnique({
    where: { id },
  });
}

export async function setPrimaryResume(studentId: string, resumeId: string) {
  await prisma.resume.updateMany({
    where: { studentId },
    data: { isPrimary: false },
  });

  return prisma.resume.update({
    where: { id: resumeId },
    data: { isPrimary: true },
  });
}

export async function deleteResume(id: string) {
  return prisma.resume.delete({
    where: { id },
  });
}
