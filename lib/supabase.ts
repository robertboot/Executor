import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
  '';

function looksLikeValidConfig(url: string, key: string): boolean {
  // Be permissive — we only want to catch "empty / clearly fake" values.
  // Real Supabase URLs vary (e.g. custom domains, trailing slashes).
  // Real anon keys can be JWTs (eyJ…) or the new sb_publishable_… format.
  if (!url || !key) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (url === 'https://placeholder.supabase.co') return false;
  if (key.length < 20) return false;
  if (key === 'placeholder-anon-key-not-real') return false;
  return true;
}

export const SUPABASE_CONFIGURED = looksLikeValidConfig(supabaseUrl, supabaseAnonKey);

// Diagnostic preview surfaced by the setup screen.
export const CONFIG_PREVIEW = {
  urlLength: supabaseUrl.length,
  urlStart: supabaseUrl ? supabaseUrl.slice(0, 8) : '(empty)',
  urlEnd: supabaseUrl ? supabaseUrl.slice(-15) : '(empty)',
  keyLength: supabaseAnonKey.length,
  keyStart: supabaseAnonKey ? supabaseAnonKey.slice(0, 6) : '(empty)',
};

if (!SUPABASE_CONFIGURED) {
  console.warn(
    'Supabase URL / anon key look wrong or missing. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in your hosting provider and redeploy.',
  );
}

// AsyncStorage on native, localStorage on web (default).
const storage =
  Platform.OS === 'web' ? undefined : (AsyncStorage as unknown as Storage);

// Fall back to a syntactically-valid placeholder so createClient doesn't throw
// at module load. The app will detect missing config and render a setup screen
// instead of attempting auth.
export const supabase = createClient(
  SUPABASE_CONFIGURED ? supabaseUrl : 'https://placeholder.supabase.co',
  SUPABASE_CONFIGURED ? supabaseAnonKey : 'placeholder-anon-key-not-real',
  {
    auth: {
      storage,
      autoRefreshToken: SUPABASE_CONFIGURED,
      persistSession: SUPABASE_CONFIGURED,
      detectSessionInUrl: Platform.OS === 'web' && SUPABASE_CONFIGURED,
    },
  },
);

export const QR_LANDING_BASE_URL =
  process.env.EXPO_PUBLIC_QR_LANDING_BASE_URL ||
  (Constants.expoConfig?.extra?.qrLandingBaseUrl as string | undefined) ||
  '';

export function qrUrlForItem(publicId: string): string {
  const base = QR_LANDING_BASE_URL.replace(/\/$/, '');
  return `${base}/i/${publicId}`;
}
