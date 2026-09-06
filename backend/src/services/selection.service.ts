import { PrismaClient, SelectionDecision } from '@prisma/client';
import { logAudit } from './audit.service';

const prisma = new PrismaClient();

export class SelectionServiceError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = 'SelectionServiceError';
  }
}

export async function recordSelection(
  recruiterUserId: string,
  applicationId: string,
  data: {
    decision: SelectionDecision;
    finalPackage?: number;
    notes?: string;
  }
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { placementDrive: true, selection: true }
  });
  if (!application) throw new SelectionServiceError(404, 'NOT_FOUND', 'Application not found');

  const recruiter = await prisma.recruiter.findUnique({ where: { userId: recruiterUserId } });
  if (!recruiter) throw new SelectionServiceError(404, 'NOT_FOUND', 'Recruiter not found');

  const membership = await prisma.recruiterCompanyMembership.findUnique({
    where: { recruiterId_companyId: { recruiterId: recruiter.id, companyId: application.placementDrive.companyId } }
  });
  if (!membership || membership.status !== 'APPROVED') {
    throw new SelectionServiceError(403, 'FORBIDDEN', 'You do not have access to this application');
  }

  if (application.selection) {
    throw new SelectionServiceError(409, 'CONFLICT', 'Selection decision already recorded for this application');
  }

  // Record selection
  const selection = await prisma.selection.create({
    data: {
      applicationId,
      decision: data.decision,
      finalPackage: data.finalPackage,
      notes: data.notes
    }
  });

  // Update application status
  const newStatus = data.decision === 'SELECTED' ? 'SELECTED' : 'REJECTED';
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: newStatus }
  });

  await logAudit({ action: 'SELECTION_RECORDED', userId: recruiter.id, userType: 'Recruiter', message: `Final selection ${data.decision} recorded for application ${applicationId}`, metadata: { selectionId: selection.id } });

  return selection;
}
