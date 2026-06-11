import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';
import { deleteBlobIfOwned } from '@/lib/blobUtils';
import { revalidateMenu } from '@/lib/revalidateMenu';

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = categorySchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const catId = parseInt(id);
    const existing = await prisma.category.findUnique({ where: { id: catId }, select: { coverUrl: true } });

    const category = await prisma.category.update({
      where: { id: catId },
      data: parsed.data,
    });

    if (existing && parsed.data.coverUrl !== undefined && existing.coverUrl !== parsed.data.coverUrl) {
      await deleteBlobIfOwned(existing.coverUrl);
    }

    revalidateMenu();
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const catId = parseInt(id);
    const existing = await prisma.category.findUnique({ where: { id: catId }, select: { coverUrl: true } });

    await prisma.category.delete({ where: { id: catId } });
    await deleteBlobIfOwned(existing?.coverUrl);

    revalidateMenu();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
