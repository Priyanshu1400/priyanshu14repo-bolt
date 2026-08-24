import { supabase } from './supabase';

export type SiteContentMap = Record<string, string>;

export async function getSiteContent(keys: string[]): Promise<SiteContentMap> {
  const { data, error } = await supabase
    .from('site_content')
    .select('key, value')
    .in('key', keys);

  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.key, row.value]));
}

export async function getSiteContentValue(key: string): Promise<string> {
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? '';
}

export async function setSiteContent(key: string, value: string): Promise<void> {
  await supabase
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() });
}
