import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import path from 'path';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import recruiterRoutes from './routes/recruiter.routes';
import companyRoutes from './routes/company.routes';
import officerRoutes from './routes/officer.routes';
import alumniRoutes from './routes/alumni.routes';
import studentRoutes from './routes/student.routes';
import assessmentRoutes from './routes/assessment.routes';
import attemptRoutes from './routes/attempt.routes';
import careerRoutes from './routes/career.routes';
import referralRoutes from './routes/referral.routes';
import driveExperienceRoutes from './routes/driveExperience.routes';
import driveResourceRoutes from './routes/driveResource.routes';
import mentorRoutes from './routes/mentor.routes';
import mentorshipRoutes from './routes/mentorship.routes';
import preparationRoutes from './routes/preparation.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false, // allow static file downloads cross-origin
}));

// Allow credentials + specific origin for cookie-based refresh token
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: () => process.env.NODE_ENV === 'test',
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads/resumes', express.static(path.join(process.cwd(), 'uploads', 'resumes')));

app.use(pinoHttp());

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/recruiters', recruiterRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/officer', officerRoutes);
app.use('/api/v1/alumni', alumniRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/attempts', attemptRoutes);
app.use('/api/v1/career', careerRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/experiences', driveExperienceRoutes);
app.use('/api/v1/resources', driveResourceRoutes);
app.use('/api/v1/mentors', mentorRoutes);
app.use('/api/v1/mentorships', mentorshipRoutes);
app.use('/api/v1/preparation', preparationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
