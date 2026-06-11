/* eslint-disable */
/**
 * One-time migration: download all non-blob images from the DB and re-upload
 * them to Vercel Blob, then update every row with the new blob URL.
 *
 * Usage:
 *   source <(grep -v '^#' .env | sed 's/^/export /') && node prisma/migrate-images-to-blob.js
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { uploadUrlToBlob, isAlreadyBlob } = require('./lib/uploadToBlobFromUrl');

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function migrateModel({ label, rows, urlField, idField = 'id', blobKeyFn, updateFn }) {
  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const url = row[urlField];
    if (!url || isAlreadyBlob(url)) { skipped++; continue; }

    const blobKey = blobKeyFn(row);
    process.stdout.write(`  [${label}] ${row[idField]} → ${blobKey} …`);
    try {
      const blobUrl = await uploadUrlToBlob(url, blobKey);
      await updateFn(row[idField], blobUrl);
      migrated++;
      process.stdout.write(` ✓\n`);
    } catch (err) {
      process.stdout.write(` FAILED: ${err.message}\n`);
    }
  }

  console.log(`  ${label}: ${migrated} migrated, ${skipped} already blob / null`);
  return migrated;
}

async function main() {
  console.log('Migrating existing DB images to Vercel Blob…\n');

  const [categories, items, banners] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true, coverUrl: true } }),
    prisma.menuItem.findMany({ select: { id: true, name: true, imageUrl: true } }),
    prisma.banner.findMany({ select: { id: true, service: true, imageUrl: true } }),
  ]);

  let total = 0;

  total += await migrateModel({
    label: 'Category',
    rows: categories,
    urlField: 'coverUrl',
    blobKeyFn: r => `menu/cat-${r.slug}.jpg`,
    updateFn: (id, url) => prisma.category.update({ where: { id }, data: { coverUrl: url } }),
  });

  total += await migrateModel({
    label: 'MenuItem',
    rows: items,
    urlField: 'imageUrl',
    blobKeyFn: r => {
      const safe = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `menu/item-${safe}.jpg`;
    },
    updateFn: (id, url) => prisma.menuItem.update({ where: { id }, data: { imageUrl: url } }),
  });

  total += await migrateModel({
    label: 'Banner',
    rows: banners,
    urlField: 'imageUrl',
    blobKeyFn: r => `menu/banner-${r.service}.jpg`,
    updateFn: (id, url) => prisma.banner.update({ where: { id }, data: { imageUrl: url } }),
  });

  console.log(`\n✓ Migration complete — ${total} records updated.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
