import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config, features } from '../../00-core/config.js';
import { createLogger } from '../../00-core/logger.js';
import { randomUUID } from 'crypto';

const logger = createLogger('s3-service');

class S3Service {
  private client: S3Client | null = null;
  private bucket: string | null = null;

  constructor() {
    if (!features.s3) {
      logger.info('S3 storage is disabled (no AWS credentials configured)');
      return;
    }

    this.client = new S3Client({
      region: config.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID!,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.bucket = config.AWS_S3_BUCKET!;
    logger.info(`S3 storage initialized with bucket: ${this.bucket}`);
  }

  /**
   * Upload a file to S3
   * @returns The S3 URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folder: 'uploads' | 'avatars' = 'uploads',
  ): Promise<string> {
    if (!this.client || !this.bucket) {
      throw new Error('S3 is not configured. Please set AWS credentials in environment variables.');
    }

    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: uniqueFileName,
      Body: file,
      ContentType: mimeType,
      // Make files publicly readable (or use presigned URLs for private access)
      ACL: 'public-read',
    });

    await this.client.send(command);

    const url = `https://${this.bucket}.s3.${config.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
    logger.info({ fileName: uniqueFileName, url }, 'File uploaded to S3');

    return url;
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.client || !this.bucket) {
      throw new Error('S3 is not configured');
    }

    // Extract key from URL
    const key = fileUrl.split('.amazonaws.com/')[1];
    if (!key) {
      throw new Error('Invalid S3 URL');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
    logger.info({ key }, 'File deleted from S3');
  }

  /**
   * Generate a presigned URL for private file access
   * @param fileKey - The S3 object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getPresignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client || !this.bucket) {
      throw new Error('S3 is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }

  /**
   * Check if S3 is enabled
   */
  isEnabled(): boolean {
    return features.s3;
  }
}

export const s3Service = new S3Service();
