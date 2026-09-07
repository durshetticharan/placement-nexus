import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsController {
  static async getStudentAnalytics(req: Request, res: Response) {
    try {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.userId },
        include: {
          readinessScores: {
            where: { careerPathId: null, placementDriveId: null },
            orderBy: { computedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!student) {
        return res.status(404).json({ status: 'error', message: 'Student profile not found' });
      }

      // Application Funnel
      const applications = await prisma.application.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: true,
      });

      const applicationStats = {
        total: 0,
        shortlisted: 0,
        interviewStage: 0,
        selected: 0,
        rejected: 0,
      };

      applications.forEach((app: any) => {
        applicationStats.total += app._count;
        if (app.status === 'SHORTLISTED') applicationStats.shortlisted += app._count;
        if (app.status === 'INTERVIEW_STAGE') applicationStats.interviewStage += app._count;
        if (app.status === 'SELECTED') applicationStats.selected += app._count;
        if (app.status === 'REJECTED') applicationStats.rejected += app._count;
      });

      // Skill Gaps
      const skillGaps = await prisma.skillGap.groupBy({
        by: ['gapLevel'],
        where: { studentId: student.id },
        _count: true,
      });

      const skillGapStats = {
        MISSING: 0,
        WEAK: 0,
        MODERATE: 0,
        STRONG: 0,
      };

      skillGaps.forEach((gap: any) => {
        skillGapStats[gap.gapLevel as keyof typeof skillGapStats] = gap._count;
      });

      // Assessments
      const assessments = await prisma.assessmentResult.aggregate({
        where: { attempt: { studentId: student.id } },
        _avg: { percentage: true },
        _count: true,
      });

      res.status(200).json({
        status: 'success',
        data: {
          readinessScore: student.readinessScores[0]?.overallScore || 0,
          applicationStats,
          skillGapStats,
          assessmentStats: {
            averagePercentage: assessments._avg.percentage ? Number(assessments._avg.percentage) : 0,
            totalAttempts: assessments._count,
          },
        },
      });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to get student analytics');
      res.status(500).json({ status: 'error', message: 'Failed to compute student analytics' });
    }
  }

  static async getRecruiterAnalytics(req: Request, res: Response) {
    try {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!recruiter) {
        return res.status(404).json({ status: 'error', message: 'Recruiter profile not found' });
      }

      // Drive stats
      const drives = await prisma.placementDrive.groupBy({
        by: ['status'],
        where: { companyId: recruiter.companyId },
        _count: true,
      });

      const driveStats = {
        total: 0,
        active: 0, // PUBLISHED
        closed: 0,
      };

      drives.forEach((d: any) => {
        driveStats.total += d._count;
        if (d.status === 'PUBLISHED') driveStats.active += d._count;
        if (d.status === 'CLOSED' || d.status === 'COMPLETED') driveStats.closed += d._count;
      });

      // Application funnel across company's drives
      const applications = await prisma.application.groupBy({
        by: ['status'],
        where: { placementDrive: { companyId: recruiter.companyId } },
        _count: true,
        _avg: { jobMatchPct: true },
      });

      const applicationStats = {
        total: 0,
        underReview: 0,
        shortlisted: 0,
        interviewStage: 0,
        selected: 0,
        rejected: 0,
        averageJobMatch: 0,
      };

      let totalJobMatch = 0;
      let jobMatchCount = 0;

      applications.forEach((app: any) => {
        applicationStats.total += app._count;
        if (app.status === 'UNDER_REVIEW') applicationStats.underReview += app._count;
        if (app.status === 'SHORTLISTED') applicationStats.shortlisted += app._count;
        if (app.status === 'INTERVIEW_STAGE') applicationStats.interviewStage += app._count;
        if (app.status === 'SELECTED') applicationStats.selected += app._count;
        if (app.status === 'REJECTED') applicationStats.rejected += app._count;

        if (app._avg.jobMatchPct) {
          totalJobMatch += Number(app._avg.jobMatchPct) * app._count;
          jobMatchCount += app._count;
        }
      });

      applicationStats.averageJobMatch = jobMatchCount > 0 ? Math.round(totalJobMatch / jobMatchCount) : 0;

      res.status(200).json({
        status: 'success',
        data: {
          driveStats,
          applicationStats,
        },
      });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to get recruiter analytics');
      res.status(500).json({ status: 'error', message: 'Failed to compute recruiter analytics' });
    }
  }

  static async getOfficerAnalytics(req: Request, res: Response) {
    try {
      // System-wide Student stats
      const studentPlacement = await prisma.student.groupBy({
        by: ['placementStatus'],
        _count: true,
      });

      let totalStudents = 0;
      let placedStudents = 0;

      studentPlacement.forEach((s: any) => {
        totalStudents += s._count;
        if (s.placementStatus === 'PLACED') placedStudents += s._count;
      });

      // System-wide Companies & Drives
      const totalCompanies = await prisma.company.count();
      const totalDrives = await prisma.placementDrive.count();
      const activeDrives = await prisma.placementDrive.count({ where: { status: 'PUBLISHED' } });

      // Application volume
      const applicationVolume = await prisma.application.count();
      const selectionVolume = await prisma.application.count({ where: { status: 'SELECTED' } });

      res.status(200).json({
        status: 'success',
        data: {
          students: {
            total: totalStudents,
            placed: placedStudents,
            placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
          },
          companies: {
            total: totalCompanies,
          },
          drives: {
            total: totalDrives,
            active: activeDrives,
          },
          applications: {
            total: applicationVolume,
            selected: selectionVolume,
          },
        },
      });
    } catch (err: any) {
      console.error('Failed', { err, userId: req.user?.userId });
      res.status(500).json({ status: 'error', message: 'Failed to compute officer analytics' });
    }
  }
}
