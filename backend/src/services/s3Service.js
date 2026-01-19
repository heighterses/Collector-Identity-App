import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import createLogger from '../utils/logger.js';

const logger = createLogger('s3Service');

class S3Service {
  constructor() {
    // S3-compatible client configuration for MinIO
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.bucketName = process.env.S3_BUCKET_NAME || 'artworks';
  }

  /**
   * Initialize the S3 service by ensuring bucket exists
   */
  async initialize() {
    try {
      // Check if bucket exists
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      logger.info('S3 bucket is ready', { bucketName: this.bucketName });
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        // Bucket doesn't exist, create it
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
          logger.info('S3 bucket created successfully', { bucketName: this.bucketName });
        } catch (createError) {
          logger.s3Error('create_bucket', createError);
          throw createError;
        }
      } else {
        logger.s3Error('bucket_check', error);
        throw error;
      }
    }
  }

  /**
   * Generate a unique object key for uploaded files
   */
  generateObjectKey(originalFilename, userId) {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename);
    
    // Format: artworks/user-{userId}/{timestamp}-{randomId}{extension}
    return `artworks/user-${userId}/${timestamp}-${randomId}${extension}`;
  }

  /**
   * Upload file buffer to S3
   */
  async uploadFile(fileBuffer, originalFilename, mimeType, userId) {
    try {
      const objectKey = this.generateObjectKey(originalFilename, userId);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'original-filename': originalFilename,
          'user-id': userId.toString(),
          'upload-timestamp': Date.now().toString(),
        },
      });

      const result = await this.client.send(command);
      
      logger.info('File uploaded to S3 successfully', {
        objectKey,
        fileSize: fileBuffer.length,
        mimeType,
        userId
      });
      
      return {
        objectKey,
        url: this.getObjectUrl(objectKey),
        etag: result.ETag,
      };
    } catch (error) {
      logger.s3Error('upload', error, userId);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Get object URL (for serving via backend)
   */
  getObjectUrl(objectKey) {
    return `${process.env.S3_ENDPOINT}/${this.bucketName}/${objectKey}`;
  }

  /**
   * Generate signed URL for secure access (expires in 1 hour)
   */
  async getSignedUrl(objectKey, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.s3Error('generate_signed_url', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Delete object from S3
   */
  async deleteFile(objectKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      await this.client.send(command);
      logger.info('File deleted from S3 successfully', { objectKey });
    } catch (error) {
      logger.s3Error('delete', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Extract object key from URL
   */
  extractObjectKeyFromUrl(url) {
    if (!url) return null;
    
    // Handle both direct S3 URLs and our backend URLs
    if (url.includes(this.bucketName)) {
      const parts = url.split(`${this.bucketName}/`);
      return parts[1] || null;
    }
    
    return null;
  }
}

// Export singleton instance
const s3Service = new S3Service();
export default s3Service;