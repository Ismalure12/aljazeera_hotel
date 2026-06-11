import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import RoyalShell from '@/components/public/RoyalShell';

// Fallback ISR window. Admin mutations also call revalidatePath('/') so edits
// appear on the public menu immediately; this is just a safety-net refresh.
export const revalidate = 120;

function decimalToNumber(d) {
  return d == null ? null : Number(d.toString());
}

async function fetchCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            optionGroups: {
              orderBy: { sortOrder: 'asc' },
              include: { options: { orderBy: { sortOrder: 'asc' } } },
            },
            extras: { orderBy: { sortOrder: 'asc' } },
            tags: { include: { tag: true } },
          },
        },
      },
    });
  } catch (err) {
    console.error('Failed to load menu categories:', err);
    return [];
  }
}

export default async function HomePage() {
  const categories = await fetchCategories();

  // Sanitize Prisma Decimal -> number for the client component
  const safeCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    kicker: c.kicker,
    headline: c.headline,
    sub: c.sub,
    coverUrl: c.coverUrl,
    period: c.period,
    items: c.items.map((it) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      price: decimalToNumber(it.price),
      imageUrl: it.imageUrl,
      kcal: it.kcal,
      prepTime: it.prepTime,
      pairing: it.pairing,
      optionGroups: it.optionGroups.map((g) => ({
        id: g.id,
        title: g.title,
        options: g.options.map((o) => ({ id: o.id, name: o.name, priceAdd: decimalToNumber(o.priceAdd) })),
      })),
      extras: it.extras.map((e) => ({ id: e.id, name: e.name, priceAdd: decimalToNumber(e.priceAdd) })),
      tags: it.tags.map((t) => ({ id: t.tag.id, slug: t.tag.slug, label: t.tag.label, variant: t.tag.variant })),
    })),
  }));

  return (
    <Suspense fallback={null}>
      <RoyalShell categories={safeCategories} />
    </Suspense>
  );
}
