import * as codingRepo from '../repositories/codingProfile.repository';
import * as studentService from './student.service';
import { recalculateAndUpdateProfileCompletion } from './profileCompletion.service';

function createCustomError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

export async function addCodingProfile(
  userId: string,
  platform: string,
  username: string,
  profileUrl: string,
  statistics?: Record<string, any>,
) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  try {
    const profile = await codingRepo.addCodingProfile(
      studentId,
      platform.toUpperCase(),
      username,
      profileUrl,
      statistics,
    );
    await recalculateAndUpdateProfileCompletion(studentId);
    return profile;
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw createCustomError('A coding profile for this platform already exists for your account.', 'CONFLICT', 409);
    }
    throw err;
  }
}

export async function listCodingProfiles(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  return codingRepo.listCodingProfiles(studentId);
}

export async function updateCodingProfile(
  userId: string,
  id: string,
  data: Partial<{
    username: string;
    profileUrl: string;
    statistics: Record<string, any>;
  }>,
) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const existing = await codingRepo.findCodingProfileById(id);

  if (!existing || existing.studentId !== studentId) {
    throw createCustomError('Coding profile not found.', 'NOT_FOUND', 404);
  }

  return codingRepo.updateCodingProfile(id, data);
}

export async function deleteCodingProfile(userId: string, id: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const existing = await codingRepo.findCodingProfileById(id);

  if (!existing || existing.studentId !== studentId) {
    throw createCustomError('Coding profile not found.', 'NOT_FOUND', 404);
  }

  await codingRepo.deleteCodingProfile(id);
  await recalculateAndUpdateProfileCompletion(studentId);
  return { message: 'Coding profile deleted successfully.' };
}
