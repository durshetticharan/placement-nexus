import * as careerGoalRepo from '../repositories/careerGoal.repository';
import * as careerPathRepo from '../repositories/careerPath.repository';
import { ServiceError } from './careerPath.service';

export async function getStudentCareerGoal(userId: string) {
  const student = await careerGoalRepo.findStudentByUserId(userId);
  if (!student) {
    throw new ServiceError(404, 'NOT_FOUND', 'Student profile not found.');
  }

  const primaryGoal = await careerGoalRepo.getPrimaryStudentCareerGoal(student.id);
  const allGoals = await careerGoalRepo.getStudentCareerGoals(student.id);

  return {
    primaryGoal: primaryGoal || (allGoals.length > 0 ? allGoals[0] : null),
    allGoals,
  };
}

export async function setStudentCareerGoal(userId: string, careerPathId: string) {
  const student = await careerGoalRepo.findStudentByUserId(userId);
  if (!student) {
    throw new ServiceError(404, 'NOT_FOUND', 'Student profile not found.');
  }

  const careerPath = await careerPathRepo.findCareerPathById(careerPathId);
  if (!careerPath) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found.');
  }

  if (!careerPath.isActive) {
    throw new ServiceError(400, 'BAD_REQUEST', 'Cannot select an inactive career path as a career goal.');
  }

  const updatedGoal = await careerGoalRepo.setStudentCareerGoal(student.id, careerPathId);

  return updatedGoal;
}

export async function deleteStudentCareerGoal(userId: string, careerPathId?: string) {
  const student = await careerGoalRepo.findStudentByUserId(userId);
  if (!student) {
    throw new ServiceError(404, 'NOT_FOUND', 'Student profile not found.');
  }

  await careerGoalRepo.removeStudentCareerGoal(student.id, careerPathId);
  return { message: 'Career goal successfully removed.' };
}
