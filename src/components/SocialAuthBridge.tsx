import React, { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  getCurrentUser,
  setCurrentUser,
  getRegisteredUsers,
  User,
} from '../utils/authUtils';
import SocialLoginRoleModal from './SocialLoginRoleModal';

/**
 * Bridges Supabase Auth (Google OAuth) with the app's localStorage-based user
 * system. Real Google login is a full-page redirect, so the modal that started
 * it no longer exists when the browser returns — this component, mounted at the
 * app root, is what resumes the flow:
 *
 *  - Listens for a Supabase session (initial load + onAuthStateChange).
 *  - If the Google email matches an existing app user → log them in + redirect.
 *  - If it's a brand-new Google user → show the role-selection modal.
 *  - If the app is already logged in as that email → do nothing (reload/no-op).
 */

interface PendingSocialUser {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  provider: string;
}

const SocialAuthBridge: React.FC = () => {
  const [pending, setPending] = useState<PendingSocialUser | null>(null);
  // Guards against the initial getSession() and onAuthStateChange both firing
  // for the same sign-in and processing it twice.
  const processedEmail = useRef<string | null>(null);

  useEffect(() => {
    const redirectByRole = (user: User) => {
      window.location.href = user.role === 'genius' ? '/genius-profile' : '/client-profile';
    };

    const handleSession = (session: Session | null) => {
      const su = session?.user;
      const email = su?.email;
      if (!su || !email) return;

      const emailKey = email.toLowerCase();

      // Already logged into the app as this same person → nothing to do
      // (this is the normal case on every page reload with a live session).
      const current = getCurrentUser();
      if (current && current.email.toLowerCase() === emailKey) {
        processedEmail.current = emailKey;
        return;
      }

      if (processedEmail.current === emailKey) return;
      processedEmail.current = emailKey;

      const meta = (su.user_metadata ?? {}) as Record<string, string>;
      const provider = (su.app_metadata?.provider as string) || 'google';
      const name = meta.full_name || meta.name || email.split('@')[0];
      const profileImage = meta.avatar_url || meta.picture || '';

      // Existing app user with this email → log in directly.
      const existing = getRegisteredUsers().find(
        (u) => u.email.toLowerCase() === emailKey
      );
      if (existing) {
        setCurrentUser(existing);
        redirectByRole(existing);
        return;
      }

      // New user → ask for role before creating the app account.
      setPending({ id: su.id, name, email, profileImage, provider });
    };

    // Handle a session already present in the URL / storage on first load.
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));

    // Handle the sign-in that arrives after returning from Google.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') handleSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!pending) return null;

  return (
    <SocialLoginRoleModal
      isOpen={true}
      onClose={() => setPending(null)}
      providerName={pending.provider}
      userInfo={{
        id: pending.id,
        name: pending.name,
        email: pending.email,
        profileImage: pending.profileImage,
      }}
    />
  );
};

export default SocialAuthBridge;
