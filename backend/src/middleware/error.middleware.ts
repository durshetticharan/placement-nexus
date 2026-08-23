import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

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

  // 3. Handle custom application errors or fallback errors
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
