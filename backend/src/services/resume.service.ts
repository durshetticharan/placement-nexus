import * as resumeRepo from '../repositories/resume.repository';
import * as studentService from './student.service';
import { recalculateAndUpdateProfileCompletion } from './profileCompletion.service';
import { fileStorage } from '../utils/fileStorage';

function createCustomError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

export async function uploadResume(userId: string, file: Express.Multer.File) {
  if (!file) {
    throw createCustomError('No resume file provided.', 'BAD_REQUEST', 400);
  }

  const studentId = await studentService.getStudentIdByUserId(userId);
  const existingResumes = await resumeRepo.findResumesByStudent(studentId);

  // If first resume, auto-set as primary
  const isPrimary = existingResumes.length === 0;

  const storageResult = await fileStorage.saveFile(file);

  const resume = await resumeRepo.createResume(studentId, {
    fileUrl: storageResult.fileUrl,
    fileName: file.originalname,
    fileSizeBytes: storageResult.fileSizeBytes,
    isPrimary,
  });

  await recalculateAndUpdateProfileCompletion(studentId);

  return resume;
}

export async function listResumes(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  return resumeRepo.findResumesByStudent(studentId);
}

export async function setPrimaryResume(userId: string, resumeId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const resume = await resumeRepo.findResumeById(resumeId);

  if (!resume || resume.studentId !== studentId) {
    throw createCustomError('Resume not found.', 'NOT_FOUND', 404);
  }

  return resumeRepo.setPrimaryResume(studentId, resumeId);
}

export async function deleteResume(userId: string, resumeId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const resume = await resumeRepo.findResumeById(resumeId);

  if (!resume || resume.studentId !== studentId) {
    throw createCustomError('Resume not found.', 'NOT_FOUND', 404);
  }

  // Delete file from disk/storage
  await fileStorage.deleteFile(resume.fileUrl);

  // Delete DB record
  await resumeRepo.deleteResume(resumeId);

  // If deleted resume was primary, set newest remaining resume as primary
  if (resume.isPrimary) {
    const remaining = await resumeRepo.findResumesByStudent(studentId);
    if (remaining.length > 0) {
      await resumeRepo.setPrimaryResume(studentId, remaining[0].id);
    }
  }

  await recalculateAndUpdateProfileCompletion(studentId);

  return { message: 'Resume deleted successfully.' };
}
