import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { bannerSchema } from '@/lib/validations';
import { deleteBlobIfOwned } from '@/lib/blobUtils';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { service: 'asc' } });
    return NextResponse.json(banners);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Upsert by service ('morning' | 'midday' | 'evening')
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const parsed = bannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const existing = await prisma.banner.findUnique({
      where: { service: parsed.data.service },
      select: { imageUrl: true },
    });

    const banner = await prisma.banner.upsert({
      where: { service: parsed.data.service },
      update: parsed.data,
      create: parsed.data,
    });

    if (existing && parsed.data.imageUrl !== undefined && existing.imageUrl !== parsed.data.imageUrl) {
      await deleteBlobIfOwned(existing.imageUrl);
    }

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('banner POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
