import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'user'], { error: 'Role must be admin or user' }).default('user'),
});

export const updateUserSchema = z.object({
  email: z.email({ error: 'Invalid email address' }).optional(),
  role: z.enum(['admin', 'user'], { error: 'Role must be admin or user' }).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  code: z.string().length(6, 'Reset code must be exactly 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const PERIODS = ['any', 'morning', 'midday', 'afternoon', 'evening'];

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  kicker: z.string().max(120).nullable().optional(),
  headline: z.string().max(300).nullable().optional(),
  sub: z.string().max(300).nullable().optional(),
  coverUrl: z.url({ error: 'Cover must be a valid URL' })
    .refine(u => u.includes('blob.vercel-storage.com'), 'Image must be hosted on Vercel Blob')
    .nullable().optional(),
  period: z.enum(PERIODS, { error: `Period must be one of: ${PERIODS.join(', ')}` }).optional().default('any'),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const PLATFORMS = ['phone', 'whatsapp', 'instagram', 'facebook', 'twitter', 'tiktok', 'website'];

export const socialLinkSchema = z.object({
  platform: z.enum(PLATFORMS, { error: `Platform must be one of: ${PLATFORMS.join(', ')}` }),
  value: z.string().min(1, 'Value is required'),
});

export const updateSocialLinkSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export const menuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().positive(),
  imageUrl: z.url({ error: 'Image must be a valid URL' })
    .refine(u => u.includes('blob.vercel-storage.com'), 'Image must be hosted on Vercel Blob')
    .nullable().optional(),
  kcal: z.string().max(40).nullable().optional(),
  prepTime: z.string().max(40).nullable().optional(),
  pairing: z.string().max(80).nullable().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const optionGroupSchema = z.object({
  menuItemId: z.number().int().positive(),
  title: z.string().min(1).max(80),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const itemOptionSchema = z.object({
  optionGroupId: z.number().int().positive(),
  name: z.string().min(1).max(120),
  priceAdd: z.number().min(0).optional().default(0),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const itemExtraSchema = z.object({
  menuItemId: z.number().int().positive(),
  name: z.string().min(1).max(120),
  priceAdd: z.number().min(0).optional().default(0),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const TAG_VARIANTS = ['default', 'green', 'spicy'];

export const tagSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  label: z.string().min(1).max(60),
  variant: z.enum(TAG_VARIANTS).optional().default('default'),
});

export const itemTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive()),
});

const SERVICES = ['morning', 'midday', 'afternoon', 'evening'];

export const bannerSchema = z.object({
  service: z.enum(SERVICES, { error: `Service must be one of: ${SERVICES.join(', ')}` }),
  tagLabel: z.string().min(1).max(120),
  headline: z.string().min(1).max(400),
  body: z.string().min(1).max(600),
  imageUrl: z.url({ error: 'Image must be a valid URL' })
    .refine(u => u.includes('blob.vercel-storage.com'), 'Image must be hosted on Vercel Blob')
    .nullable().optional(),
  ctaText: z.string().min(1).max(60),
  ctaCategorySlug: z.string().max(60).nullable().optional(),
  meta1Label: z.string().max(40).nullable().optional(),
  meta1Value: z.string().max(40).nullable().optional(),
  meta2Label: z.string().max(40).nullable().optional(),
  meta2Value: z.string().max(40).nullable().optional(),
  meta3Label: z.string().max(40).nullable().optional(),
  meta3Value: z.string().max(40).nullable().optional(),
  isActive: z.boolean().optional().default(true),
});
