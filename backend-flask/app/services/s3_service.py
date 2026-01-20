import boto3
from botocore.exceptions import ClientError
import hashlib
import time
import os
from pathlib import Path
from flask import current_app

class S3Service:
    def __init__(self):
        self.client = None
        self.bucket_name = None
        self._initialized = False
    
    def _initialize_client(self):
        """Initialize S3 client with configuration"""
        if self._initialized:
            return
            
        try:
            self.client = boto3.client(
                's3',
                endpoint_url=current_app.config['S3_ENDPOINT'],
                aws_access_key_id=current_app.config['S3_ACCESS_KEY'],
                aws_secret_access_key=current_app.config['S3_SECRET_KEY'],
                region_name=current_app.config['S3_REGION']
            )
            self.bucket_name = current_app.config['S3_BUCKET_NAME']
            self._initialized = True
        except Exception as e:
            current_app.logger.error(f'Failed to initialize S3 client: {str(e)}')
            raise
    
    def initialize(self):
        """Initialize the S3 service by ensuring bucket exists"""
        if not self._initialized:
            self._initialize_client()
            
        try:
            # Check if bucket exists
            self.client.head_bucket(Bucket=self.bucket_name)
            current_app.logger.info(f'S3 bucket is ready: {self.bucket_name}')
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    current_app.logger.info(f'S3 bucket created successfully: {self.bucket_name}')
                except ClientError as create_error:
                    current_app.logger.error(f'Failed to create S3 bucket: {str(create_error)}')
                    raise create_error
            else:
                current_app.logger.error(f'S3 bucket check failed: {str(e)}')
                raise e
    
    def generate_object_key(self, original_filename, user_id):
        """Generate a unique object key for uploaded files"""
        timestamp = int(time.time() * 1000)
        random_id = hashlib.md5(f"{user_id}{timestamp}".encode()).hexdigest()[:8]
        extension = Path(original_filename).suffix
        
        # Format: artworks/user-{user_id}/{timestamp}-{random_id}{extension}
        return f"artworks/user-{user_id}/{timestamp}-{random_id}{extension}"
    
    def upload_file(self, file_buffer, original_filename, mime_type, user_id):
        """Upload file buffer to S3"""
        if not self._initialized:
            self._initialize_client()
            
        try:
            object_key = self.generate_object_key(original_filename, user_id)
            
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=file_buffer,
                ContentType=mime_type,
                Metadata={
                    'original-filename': original_filename,
                    'user-id': str(user_id),
                    'upload-timestamp': str(int(time.time()))
                }
            )
            
            current_app.logger.info(f'File uploaded to S3 successfully: {object_key}')
            
            return {
                'object_key': object_key,
                'url': self.get_object_url(object_key)
            }
        except Exception as e:
            current_app.logger.error(f'Failed to upload file to S3: {str(e)}')
            raise Exception(f'Failed to upload file to S3: {str(e)}')
    
    def get_object_url(self, object_key):
        """Get object URL (for serving via backend)"""
        return f"{current_app.config['S3_ENDPOINT']}/{self.bucket_name}/{object_key}"
    
    def get_signed_url(self, object_key, expires_in=3600):
        """Generate signed URL for secure access (expires in 1 hour)"""
        try:
            signed_url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_key},
                ExpiresIn=expires_in
            )
            return signed_url
        except Exception as e:
            current_app.logger.error(f'Failed to generate signed URL: {str(e)}')
            raise Exception(f'Failed to generate signed URL: {str(e)}')
    
    def delete_file(self, object_key):
        """Delete object from S3"""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
            current_app.logger.info(f'File deleted from S3 successfully: {object_key}')
        except Exception as e:
            current_app.logger.error(f'Failed to delete file from S3: {str(e)}')
            raise Exception(f'Failed to delete file from S3: {str(e)}')
    
    def extract_object_key_from_url(self, url):
        """Extract object key from URL"""
        if not url:
            return None
        
        # Handle both direct S3 URLs and our backend URLs
        if self.bucket_name in url:
            parts = url.split(f'{self.bucket_name}/')
            return parts[1] if len(parts) > 1 else None
        
        return None

# Create singleton instance
s3_service = S3Service()