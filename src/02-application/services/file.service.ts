// File Upload Service - Application Layer
// Handles file attachments for messages
import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { ValidationError, NotFoundError } from '../../00-core/errors.js';

// File limits
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];
const ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

export interface UploadResult {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface AttachmentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  buffer: Buffer;
}

export class FileService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(private readonly prisma: PrismaClient) {
    this.uploadDir = process.env.UPLOAD_DIR ?? './uploads';
    this.baseUrl = process.env.BASE_URL ?? 'http://localhost:3001';
  }

  private validateFile(input: AttachmentInput): void {
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
      );
    }

    if (!ALLOWED_TYPES.includes(input.fileType)) {
      throw new ValidationError(`File type "${input.fileType}" is not allowed`);
    }
  }

  private async ensureUploadDir(): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
  }

  // Upload file and create attachment record for channel message
  async uploadForMessage(
    messageId: string,
    input: AttachmentInput
  ): Promise<UploadResult> {
    this.validateFile(input);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    await this.ensureUploadDir();

    // Generate unique filename
    const ext = extname(input.fileName) || this.getExtFromType(input.fileType);
    const storedName = `${randomUUID()}${ext}`;
    const filePath = join(this.uploadDir, storedName);

    // Write file
    await writeFile(filePath, input.buffer);

    // Create attachment record
    const attachment = await this.prisma.attachment.create({
      data: {
        messageId,
        fileName: input.fileName,
        fileUrl: `${this.baseUrl}/uploads/${storedName}`,
        fileType: input.fileType,
        fileSize: input.fileSize
      }
    });

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize
    };
  }

  // Upload general file (for workspace icons, etc.) - no database record
  async uploadGeneral(input: AttachmentInput): Promise<string> {
    // Only validate file type for images (workspace icons)
    if (!ALLOWED_IMAGE_TYPES.includes(input.fileType)) {
      throw new ValidationError('Only image files are allowed');
    }

    if (input.fileSize > 5 * 1024 * 1024) {
      // 5MB for icons
      throw new ValidationError('File size must be less than 5MB');
    }

    await this.ensureUploadDir();

    const ext = extname(input.fileName) || this.getExtFromType(input.fileType);
    const storedName = `${randomUUID()}${ext}`;
    const filePath = join(this.uploadDir, storedName);

    await writeFile(filePath, input.buffer);

    return `${this.baseUrl}/uploads/${storedName}`;
  }

  // Upload file for DM
  async uploadForDM(
    messageId: string,
    input: AttachmentInput
  ): Promise<UploadResult> {
    this.validateFile(input);

    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Direct message', messageId);
    }

    await this.ensureUploadDir();

    const ext = extname(input.fileName) || this.getExtFromType(input.fileType);
    const storedName = `${randomUUID()}${ext}`;
    const filePath = join(this.uploadDir, storedName);

    await writeFile(filePath, input.buffer);

    const attachment = await this.prisma.dMAttachment.create({
      data: {
        messageId,
        fileName: input.fileName,
        fileUrl: `${this.baseUrl}/uploads/${storedName}`,
        fileType: input.fileType,
        fileSize: input.fileSize
      }
    });

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize
    };
  }

  // Delete attachment
  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    if (attachment) {
      // Extract filename from URL
      const fileName = attachment.fileUrl.split('/').pop();
      if (fileName) {
        const filePath = join(this.uploadDir, fileName);
        try {
          await unlink(filePath);
        } catch {
          // File might not exist, continue
        }
      }

      await this.prisma.attachment.delete({
        where: { id: attachmentId }
      });
    }
  }

  // Get attachment info
  async getAttachment(attachmentId: string): Promise<UploadResult | null> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) return null;

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize
    };
  }

  private getExtFromType(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'text/csv': '.csv'
    };
    return map[mimeType] ?? '';
  }

  // Check if file is an image
  isImage(fileType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(fileType);
  }
}
