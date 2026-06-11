import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import sharp from 'sharp';

const MIME_EXT   = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ALLOWED    = Object.keys(MIME_EXT);
const MAX_SIZE   = 5 * 1024 * 1024; // 5 MB
const MAX_DIM    = 1400;
const ONE_YEAR_S = 365 * 24 * 60 * 60;

// Accepts a Buffer; returns the detected MIME type or null
function detectMime(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  return null;
}

async function compress(buffer, mime) {
  const s = sharp(buffer).resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
  if (mime === 'image/png')  return s.png({ quality: 85 }).toBuffer();
  if (mime === 'image/webp') return s.webp({ quality: 82 }).toBuffer();
  return s.jpeg({ quality: 82 }).toBuffer();
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // 1. MIME type header (first pass, client-supplied)
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP' }, { status: 400 });
    }

    // 2. Client-reported size guard (first pass — spoofable, real check is on raw.length below)
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    }

    // 3. Read body once; check actual buffer size (defeats spoofed file.size metadata)
    const raw = Buffer.from(await file.arrayBuffer());
    if (raw.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    }

    // 4. Magic-byte check (tamper-proof; derived from the already-read buffer)
    const actualMime = detectMime(raw);
    if (!actualMime || !ALLOWED.includes(actualMime)) {
      return NextResponse.json({ error: 'File content does not match a valid image type' }, { status: 400 });
    }

    // 5. Resize to max 1400 px + compress
    const compressed = await compress(raw, actualMime);

    // 6. UUID key (collision-proof) + 1-year CDN cache
    const key = `menu/${crypto.randomUUID()}.${MIME_EXT[actualMime]}`;
    const blob = await put(key, compressed, {
      access: 'public',
      contentType: actualMime,
      cacheControlMaxAge: ONE_YEAR_S,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[upload] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
