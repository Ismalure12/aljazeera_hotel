import { del } from '@vercel/blob';

const BLOB_HOST = 'blob.vercel-storage.com';

export async function deleteBlobIfOwned(url) {
  if (!url) return;
  try {
    if (new URL(url).hostname.endsWith(BLOB_HOST)) await del(url);
  } catch {
    // Non-fatal: old blob stays but doesn't affect correctness
  }
}
