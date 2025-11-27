import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { env } from '../src/config/env';

const s3 = new S3Client({
  region: env.storage.region,
  credentials: {
    accessKeyId: env.storage.accessKeyId,
    secretAccessKey: env.storage.secretAccessKey,
  },
  endpoint: env.storage.endpoint,
  forcePathStyle: env.storage.forcePathStyle,
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.storage.bucketName }));
    console.log('Bucket exists');
  } catch (e) {
    console.log('Bucket not found, creating...');
    await s3.send(new CreateBucketCommand({ Bucket: env.storage.bucketName }));
    console.log('Bucket created');
  }
}

ensureBucket().catch((e) => {
  console.error('Failed to ensure bucket', e);
  process.exit(1);
});

