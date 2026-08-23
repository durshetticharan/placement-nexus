import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '../config/upload.config';

export interface FileStorageResult {
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

export interface IFileStorageProvider {
  saveFile(file: Express.Multer.File): Promise<FileStorageResult>;
  getFileUrl(fileName: string): string;
  deleteFile(fileUrlOrName: string): Promise<void>;
}

export class LocalStorageProvider implements IFileStorageProvider {
  async saveFile(file: Express.Multer.File): Promise<FileStorageResult> {
    const fileName = file.filename;
    const fileUrl = `/uploads/resumes/${fileName}`;
    return {
      fileUrl,
      fileName,
      fileSizeBytes: file.size,
    };
  }

  getFileUrl(fileName: string): string {
    if (fileName.startsWith('/')) return fileName;
    return `/uploads/resumes/${fileName}`;
  }

  async deleteFile(fileUrlOrName: string): Promise<void> {
    const fileName = path.basename(fileUrlOrName);
    const filePath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

// Single instance export — swapping to S3/Cloudinary in future requires only changing this instance export
export const fileStorage: IFileStorageProvider = new LocalStorageProvider();
