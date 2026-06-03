import { createClient } from '@supabase/supabase-js';
import { getRuntimeConfig } from '@/services/runtimeConfig';

const safeAtob = (str?: string): string => {
  if (!str) return '';
  try {
    return atob(str.replace(/["']/g, ''));
  } catch (e) {
    console.error('Failed to decode base64 string:', str, e);
    return '';
  }
};

const supabaseUrl =
  getRuntimeConfig()?.supabaseUrl ||
  process.env['SUPABASE_URL'] ||
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ||
  safeAtob(process.env['NEXT_PUBLIC_DEFAULT_SUPABASE_URL_BASE64']);
const supabaseAnonKey =
  getRuntimeConfig()?.supabaseAnonKey ||
  process.env['SUPABASE_ANON_KEY'] ||
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
  safeAtob(process.env['NEXT_PUBLIC_DEFAULT_SUPABASE_KEY_BASE64']);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
);

export const createSupabaseClient = (accessToken?: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });
};

export const createSupabaseAdminClient = () => {
  const supabaseAdminKey = process.env['SUPABASE_ADMIN_KEY'] || '';
  if (!supabaseAdminKey) {
    console.error(
      'WARNING: SUPABASE_ADMIN_KEY is not set. Server-side Supabase operations (storage, sharing, payments) will fail.\n' +
        'Get the service_role key from https://supabase.com/dashboard → Project Settings → API → service_role\n' +
        'Then add it to apps/readest-app/.env.local: SUPABASE_ADMIN_KEY=<your-key>',
    );
  }
  return createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
