import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');
    const bucket = process.env.R2_BUCKET_NAME || '';

    const client = getClient();
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const r2res = await client.send(cmd);

    if (!r2res.Body) {
      return new NextResponse('Not found', { status: 404 });
    }

    const contentType = r2res.ContentType || 'image/jpeg';
    const chunks: Uint8Array[] = [];
    for await (const chunk of r2res.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('R2 proxy error:', err.message);
    return new NextResponse('Error', { status: 500 });
  }
}
