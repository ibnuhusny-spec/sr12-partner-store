export const DEMO_SESSION_STORAGE_KEY = 'sr12_demo_pos_session';

/**
 * Returns true when the current browser tab is running inside the sandboxed POS Demo Mode.
 * Any active real owner/distributor/developer session takes precedence over demo mode.
 */
export function isDemoSessionActive(): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableDemoSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, '1');
    }
  } catch {}
}

export function clearDemoSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
    }
  } catch {}
}
