import { revalidatePath } from 'next/cache';

// Refresh the public v6 menu (home page) after an admin mutation so edits to
// categories, items, tags, option groups, options, or extras appear immediately
// instead of waiting for the ISR window. Safe to call from any route handler.
export function revalidateMenu() {
  revalidatePath('/');
}
