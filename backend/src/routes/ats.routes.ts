import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { analyzeResume, matchResume } from '../controllers/ats.controller';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload.'));
    }
  }
});

router.post(
  '/analyze',
  requireAuth,
  requireRole(['STUDENT']),
  upload.single('resume'),
  analyzeResume
);

router.post(
  '/match',
  requireAuth,
  requireRole(['STUDENT']),
  upload.single('resume'),
  matchResume
);

export default router;
