import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const isProduction = process.env.NODE_ENV === 'production';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handle Multer limit file size error
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File size exceeds the 5MB limit.',
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || 'File upload error occurred.',
      },
    });
    return;
  }

  // 2. Handle Multer fileFilter custom rejection error
  if (err && err.message === 'Only PDF files are allowed for resume upload.') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Only PDF files are allowed for resume upload.',
      },
    });
    return;
  }

  // 3. Handle CORS errors
  if (err && err.message?.startsWith('CORS:')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Request origin not allowed.',
      },
    });
    return;
  }

  // 4. Handle custom application errors or fallback errors
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // In production: never expose internal error messages, stack traces, or filesystem paths
  const message = isProduction && statusCode === 500
    ? 'An unexpected internal error occurred. Please try again later.'
    : err.message || 'An unexpected error occurred.';

  // Log the full error server-side (never exposed to client)
  if (statusCode === 500) {
    console.error('[error-handler]', {
      code,
      message: err.message,
      stack: isProduction ? '[suppressed in production]' : err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
