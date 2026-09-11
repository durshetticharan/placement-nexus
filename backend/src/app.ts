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
import resumeBuilderRoutes from './routes/resumeBuilder.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false, // allow static file downloads cross-origin
  // Content Security Policy: tightened in production
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // allow inline styles for SPA
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false, // disable CSP in dev to not break Vite HMR
  // HSTS in production only
  strictTransportSecurity: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
// In production, CORS_ORIGIN env var must be set to the deployed frontend origin.
// Never use wildcard (*) with credentials: true.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

// Global limiter — broad protection for all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } },
});

// Tight limiter for authentication endpoints (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per 15 min
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many authentication attempts. Try again in 15 minutes.' } },
});

// Limiter for AI endpoints (expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI calls per IP per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'AI request rate limit exceeded. Please wait a moment.' } },
});

app.use(globalLimiter);

// ─── Request Size Limits ───────────────────────────────────────────────────────
// JSON body: 1MB for normal API requests (multipart handled by multer separately)
app.use(express.json({ limit: '1mb' }));

app.use(cookieParser());

// ─── Static File Service (Resume Downloads) ─────────────────────────────────
// Only serve uploads; never expose other directories
app.use('/uploads/resumes', express.static(path.join(process.cwd(), 'uploads', 'resumes'), {
  // Prevent directory listings
  index: false,
}));

// ─── HTTP Request Logging (Pino) ─────────────────────────────────────────────
app.use(pinoHttp({
  // In production, log only essential fields (no full request body)
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  // Suppress health check noise in logs
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health',
  },
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
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
app.use('/api/v1/ai', aiLimiter, aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/student/resume-builder', resumeBuilderRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
