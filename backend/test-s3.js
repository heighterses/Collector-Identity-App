import dotenv from 'dotenv';
import s3Service from './src/services/s3Service.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function testS3Service() {
  console.log('🧪 Testing S3 Service...');
  console.log(`Endpoint: ${process.env.S3_ENDPOINT}`);
  console.log(`Bucket: ${process.env.S3_BUCKET_NAME}`);
  
  try {
    // Test 1: Initialize service (create bucket)
    console.log('\n1. Testing bucket initialization...');
    await s3Service.initialize();
    console.log('✅ Bucket initialization successful');
    
    // Test 2: Upload a test file
    console.log('\n2. Testing file upload...');
    const testContent = Buffer.from('This is a test file for S3 service');
    const uploadResult = await s3Service.uploadFile(
      testContent,
      'test.txt',
      'text/plain',
      'test-user-123'
    );
    console.log('✅ File upload successful:', uploadResult);
    
    // Test 3: Generate signed URL
    console.log('\n3. Testing signed URL generation...');
    const signedUrl = await s3Service.getSignedUrl(uploadResult.objectKey);
    console.log('✅ Signed URL generated:', signedUrl);
    
    // Test 4: Delete test file
    console.log('\n4. Testing file deletion...');
    await s3Service.deleteFile(uploadResult.objectKey);
    console.log('✅ File deletion successful');
    
    console.log('\n🎉 All S3 tests passed!');
    
  } catch (error) {
    console.error('❌ S3 test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MinIO is not running. To start MinIO:');
      console.log('   docker-compose up -d');
      console.log('   Then run this test again.');
    }
  }
}

// Run the test
testS3Service();