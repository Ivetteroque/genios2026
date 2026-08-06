// Social authentication utilities.
// The app authenticates ONLY with Google, via real Supabase Auth OAuth.
// Email/password and other social providers are intentionally not supported.

import { supabase } from '../lib/supabase';

// Real Google OAuth via Supabase Auth.
// This triggers a full-page redirect to Google; the browser returns to the app
// with a session that SocialAuthBridge picks up via onAuthStateChange.
export const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) {
    console.error('Error iniciando OAuth con Google:', error);
    throw error;
  }
  // On success the browser navigates away to Google — nothing else runs here.
};
