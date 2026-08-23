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
import alumniRoutes from './routes/alumni.routes';
import studentRoutes from './routes/student.routes';
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
  max: 100,
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads/resumes', express.static(path.join(process.cwd(), 'uploads', 'resumes')));

app.use(pinoHttp());

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/recruiters', recruiterRoutes);
app.use('/api/v1/alumni', alumniRoutes);
app.use('/api/v1/students', studentRoutes);

app.use(errorHandler);

export default app;
