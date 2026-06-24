import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function generateUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL;

  if (!client || !bucket) {
    return null;
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = publicUrlBase
    ? `${publicUrlBase}/${key}`
    : `https://${bucket}.${process.env.R2_ENDPOINT}/${key}`;

  return { uploadUrl, publicUrl };
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL;

  if (!client || !bucket) {
    return null;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return publicUrlBase
    ? `${publicUrlBase}/${key}`
    : `https://${bucket}.${process.env.R2_ENDPOINT}/${key}`;
}
