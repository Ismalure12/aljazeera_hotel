/* eslint-disable */
const { put } = require('@vercel/blob');
const sharp = require('sharp');

const BLOB_HOSTS      = ['blob.vercel-storage.com', 'public.blob.vercel-storage.com'];
const MAX_FETCH_BYTES = 10 * 1024 * 1024; // 10 MB
const FETCH_TIMEOUT   = 30_000;           // 30 s
const MAX_DIM         = 1400;
const ONE_YEAR_S      = 365 * 24 * 60 * 60;

function isAlreadyBlob(url) {
  if (!url) return true;
  try {
    return BLOB_HOSTS.some(h => new URL(url).hostname.endsWith(h));
  } catch {
    return false;
  }
}

async function compressImage(buffer, contentType) {
  const s = sharp(buffer).resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
  if (contentType === 'image/png')  return s.png({ quality: 85 }).toBuffer();
  if (contentType === 'image/webp') return s.webp({ quality: 82 }).toBuffer();
  return s.jpeg({ quality: 82 }).toBuffer();
}

async function uploadUrlToBlob(externalUrl, blobKey) {
  if (isAlreadyBlob(externalUrl)) return externalUrl;

  const res = await fetch(externalUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`Fetch failed [${res.status}]: ${externalUrl}`);

  const contentLength = res.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_FETCH_BYTES) {
    throw new Error(`Remote image too large (${contentLength} bytes): ${externalUrl}`);
  }

  const rawBuffer = Buffer.from(await res.arrayBuffer());
  if (rawBuffer.length > MAX_FETCH_BYTES) {
    throw new Error(`Remote image too large (${rawBuffer.length} bytes): ${externalUrl}`);
  }

  // Strip content-type parameters (e.g. "image/png; charset=utf-8" → "image/png")
  const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
  const compressed = await compressImage(rawBuffer, contentType);

  const blob = await put(blobKey, compressed, {
    access: 'public',
    contentType,
    cacheControlMaxAge: ONE_YEAR_S,
  });
  return blob.url;
}

// Uploads a map of { blobKey: externalUrl } with a concurrency cap.
// Pre-deduplicates by externalUrl before spawning workers to avoid the
// check-then-act race that would otherwise let concurrent workers upload
// the same source URL twice.
// Returns { externalUrl: blobUrl } for use as a lookup table.
async function deduplicateAndUpload(urlMap, concurrency = 4) {
  // Build unique-by-externalUrl work list (last blobKey for a given URL wins)
  const seen = new Map(); // externalUrl → blobKey
  for (const [blobKey, externalUrl] of Object.entries(urlMap)) {
    seen.set(externalUrl, blobKey);
  }
  const unique = Array.from(seen.entries()); // [[externalUrl, blobKey], ...]

  const result = {};
  let i = 0;

  async function next() {
    while (i < unique.length) {
      const idx = i++;
      const [externalUrl, blobKey] = unique[idx];
      process.stdout.write(`  uploading ${blobKey} …`);
      const blobUrl = await uploadUrlToBlob(externalUrl, blobKey);
      result[externalUrl] = blobUrl;
      process.stdout.write(` done\n`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, next));
  return result;
}

module.exports = { uploadUrlToBlob, deduplicateAndUpload, isAlreadyBlob };
