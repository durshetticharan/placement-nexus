import * as profRepo from '../repositories/professionalProfile.repository';
import * as studentService from './student.service';
import { recalculateAndUpdateProfileCompletion } from './profileCompletion.service';

function createCustomError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

export async function addProfile(userId: string, platform: string, profileUrl: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  try {
    const profile = await profRepo.addProfile(studentId, platform.toUpperCase(), profileUrl);
    await recalculateAndUpdateProfileCompletion(studentId);
    return profile;
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw createCustomError('A professional profile for this platform already exists for your account.', 'CONFLICT', 409);
    }
    throw err;
  }
}

export async function listProfiles(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  return profRepo.listProfiles(studentId);
}

export async function updateProfile(userId: string, id: string, profileUrl: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const existing = await profRepo.findProfileById(id);

  if (!existing || existing.studentId !== studentId) {
    throw createCustomError('Professional profile not found.', 'NOT_FOUND', 404);
  }

  return profRepo.updateProfile(id, profileUrl);
}

export async function deleteProfile(userId: string, id: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const existing = await profRepo.findProfileById(id);

  if (!existing || existing.studentId !== studentId) {
    throw createCustomError('Professional profile not found.', 'NOT_FOUND', 404);
  }

  await profRepo.deleteProfile(id);
  await recalculateAndUpdateProfileCompletion(studentId);
  return { message: 'Professional profile deleted successfully.' };
}
