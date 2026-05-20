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

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL / anon key not set. Add EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
  );
}

// AsyncStorage on native, localStorage on web (default).
const storage =
  Platform.OS === 'web' ? undefined : (AsyncStorage as unknown as Storage);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const QR_LANDING_BASE_URL =
  process.env.EXPO_PUBLIC_QR_LANDING_BASE_URL ||
  (Constants.expoConfig?.extra?.qrLandingBaseUrl as string | undefined) ||
  '';

export function qrUrlForItem(publicId: string): string {
  const base = QR_LANDING_BASE_URL.replace(/\/$/, '');
  return `${base}/i/${publicId}`;
}
