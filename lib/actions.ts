'use server';

import { getSupabase } from '@/lib/supabase/public';

export type OwnerApplicationResult = { ok: true } | { ok: false; error: 'invalid' | 'server' };

const limits = {
  name: [2, 120],
  phone: [6, 40],
  location: [2, 200],
  description: [1, 2000],
} as const;

/**
 * Saves an "Izdajte svoju kuću" application to Supabase (table owner_applications).
 * Visitors can only insert rows; the team reads them in the Supabase dashboard.
 */
export async function submitOwnerApplication(formData: FormData): Promise<OwnerApplicationResult> {
  // Hidden field humans never see; bots that fill every input get a fake "success"
  if (String(formData.get('website') ?? '').trim() !== '') return { ok: true };

  const values = {
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
  };
  const locale = formData.get('locale') === 'en' ? 'en' : 'sr';

  for (const [field, [min, max]] of Object.entries(limits)) {
    const length = values[field as keyof typeof values].length;
    if (length < min || length > max) return { ok: false, error: 'invalid' };
  }

  const { error } = await getSupabase()
    .from('owner_applications')
    .insert({ ...values, locale });

  if (error) {
    console.error('Owner application insert failed:', error.message);
    return { ok: false, error: 'server' };
  }
  return { ok: true };
}
