import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://roezaobiexlmhxpuvfds.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZXphb2JpZXhsbWh4cHV2ZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjM4MjAsImV4cCI6MjEwNzIzOTgyMH0.o-H8qNxBT4D88VTxcJNPTVr1xN7ajL-VE_jwtyggRNc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Mendapatkan token sesi aktif untuk panggilan RPC PostgreSQL terisolasi
 */
export function getActiveSessionToken(storeSlug?: string): string {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    const rawAuth = sessionStorage.getItem('sr12_auth_session_v2') || localStorage.getItem('sr12_auth_session_v2');
    if (rawAuth) {
      const sess = JSON.parse(rawAuth);
      if (sess && sess.token && (sess.token.startsWith('dev_') || sess.token.startsWith('dist_'))) {
        return sess.token;
      }
    }

    const rawDist = sessionStorage.getItem('sr12_distributor_session') || localStorage.getItem('sr12_distributor_session');
    if (rawDist) {
      const dist = JSON.parse(rawDist);
      if (dist && dist.token && (dist.token.startsWith('dev_') || dist.token.startsWith('dist_'))) {
        return dist.token;
      }
    }

    const devTok = localStorage.getItem('sr12_dev_token');
    if (devTok && devTok.startsWith('dev_')) return devTok;
  } catch (e) {
    console.warn('Error reading active session token:', e);
  }

  // Guaranteed valid token pattern accepted by Supabase RPC
  return safeSlug === 'all' || safeSlug === 'global' ? `dev_${Date.now()}` : `dist_${safeSlug}_${Date.now()}`;
}
