import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const s3 = new S3Client({
  region: env.storage.region,
  credentials: {
    accessKeyId: env.storage.accessKeyId,
    secretAccessKey: env.storage.secretAccessKey,
  },
  endpoint: env.storage.endpoint,
  forcePathStyle: env.storage.forcePathStyle,
});

// Helper: ensure key doesn't accidentally include the bucket name prefix
function normalizeKey(key: string): string {
  const bucketPrefix = `${env.storage.bucketName}/`;
  if (key.startsWith(bucketPrefix)) {
    return key.slice(bucketPrefix.length);
  }
  // Also guard against accidental leading slashes
  return key.startsWith('/') ? key.slice(1) : key;
}

export const getPresignedUploadUrl = async (
  key: string,
  contentType: string,
  contentLength?: number
): Promise<string> => {
  const normalizedKey = normalizeKey(key);

  // Build params; only include ContentLength if provided
  const params: any = {
    Bucket: env.storage.bucketName,
    Key: normalizedKey,
    ContentType: contentType,
  };
  if (typeof contentLength === 'number') params.ContentLength = contentLength;

  const command = new PutObjectCommand(params);
  const url = await getSignedUrl(s3, command, { expiresIn: 900 });

  // optional debug: enable when diagnosing signature problems
  // console.debug('Presigned PUT URL:', url);

  return url;
};

export const getPresignedDownloadUrl = async (key: string): Promise<string> => {
  const normalizedKey = normalizeKey(key);

  const command = new GetObjectCommand({
    Bucket: env.storage.bucketName,
    Key: normalizedKey,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 900 });

  // optional debug
  // console.debug('Presigned GET URL:', url);

  return url;
};
  