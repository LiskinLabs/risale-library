import { AwsClient } from 'aws4fetch';

export const r2Storage = {
  getR2Client: () => {
    return new AwsClient({
      service: 's3',
      region: process.env['R2_REGION'] || 'auto',
      accessKeyId: process.env['R2_ACCESS_KEY_ID']!,
      secretAccessKey: process.env['R2_SECRET_ACCESS_KEY']!,
    });
  },

  getR2Url: () => {
    const R2_ACCOUNT_ID = process.env['R2_ACCOUNT_ID']!;
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  },

  // S3 / R2 require the object key to be URL-encoded segment-by-segment in
  // signed URLs. file_key is built from the original filename, so spaces
  // and reserved chars (e.g. `Risale AI Studio`, `A&B.epub`) are common
  // and would otherwise break the signature. We encode each path segment
  // but keep the separating slashes literal.
  encodeKey: (key: string): string => key.split('/').map(encodeURIComponent).join('/'),

  getDownloadSignedUrl: async (bucketName: string, fileKey: string, expiresIn: number) => {
    const encodedKey = r2Storage.encodeKey(fileKey);
    return (
      await r2Storage
        .getR2Client()
        .sign(
          new Request(
            `${r2Storage.getR2Url()}/${bucketName}/${encodedKey}?X-Amz-Expires=${expiresIn}`,
          ),
          {
            aws: { signQuery: true },
          },
        )
    ).url.toString();
  },

  getUploadSignedUrl: async (
    bucketName: string,
    fileKey: string,
    contentLength: number,
    expiresIn: number,
  ) => {
    const encodedKey = r2Storage.encodeKey(fileKey);
    const url = `${r2Storage.getR2Url()}/${bucketName}/${encodedKey}?X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=content-length`;
    return (
      await r2Storage.getR2Client().sign(
        new Request(url, {
          method: 'PUT',
          headers: {
            'Content-Length': contentLength.toString(),
          },
        }),
        {
          aws: { signQuery: true },
        },
      )
    ).url.toString();
  },

  putObject: async (
    bucketName: string,
    fileKey: string,
    body: ArrayBuffer | string,
    contentType: string,
  ) => {
    const encodedKey = r2Storage.encodeKey(fileKey);
    return await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${encodedKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body,
      });
  },

  deleteObject: async (bucketName: string, fileKey: string) => {
    const encodedKey = r2Storage.encodeKey(fileKey);
    return await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${encodedKey}`, {
        method: 'DELETE',
      });
  },

  headObject: async (bucketName: string, fileKey: string) => {
    const encodedKey = r2Storage.encodeKey(fileKey);
    const response = await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${encodedKey}`, {
        method: 'HEAD',
      });
    return response;
  },

  copyObject: async (
    bucketName: string,
    sourceFileKey: string,
    destFileKey: string,
    sourceBucketName?: string,
  ) => {
    const srcBucket = sourceBucketName || bucketName;
    const copySource = `/${srcBucket}/${r2Storage.encodeKey(sourceFileKey)}`;
    const response = await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${r2Storage.encodeKey(destFileKey)}`, {
        method: 'PUT',
        headers: {
          'x-amz-copy-source': copySource,
        },
      });
    return response;
  },
};
