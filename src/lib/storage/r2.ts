import "server-only";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireEnv } from "@/lib/env";

function r2() {
  const env = requireEnv("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET");
  return { env, client: new S3Client({ region: "auto", endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } }) };
}

export function documentKey(companyId: string, projectId: string, expenseId: string, filename: string) {
  return `companies/${companyId}/projects/${projectId}/expenses/${expenseId}/${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  const { env, client } = r2();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 600 });
}

export async function createDownloadUrl(key: string) {
  const { env, client } = r2();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), { expiresIn: 600 });
}

export async function uploadDocument(key: string, body: Uint8Array, contentType: string) {
  const { env, client } = r2();
  await client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteDocuments(keys: string[]) {
  if (!keys.length) return;
  const { env, client } = r2();
  await client.send(new DeleteObjectsCommand({ Bucket: env.R2_BUCKET, Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true } }));
}
