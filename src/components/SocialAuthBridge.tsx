import React, { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  getCurrentUser,
  setCurrentUser,
  getRegisteredUsers,
  addRegisteredUser,
  User,
} from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';

/**
 * Bridges Supabase Auth (Google OAuth) with the app's user system. Real Google
 * login is a full-page redirect, so this component — mounted at the app root —
 * is what resumes the flow when the browser returns:
 *
 *  - Listens for a Supabase session (initial load + onAuthStateChange).
 *  - Everyone signs in as a CLIENT. Being a Genio is an additive capability, so
 *    we look up whether this account already has a genius_profile in the DB and
 *    set `isGenius` accordingly (that's what enables the header's Cliente/Genio
 *    switch). A brand-new account is created as a plain client.
 *  - If the app is already logged in as that email → do nothing (reload/no-op).
 */

const SocialAuthBridge: React.FC = () => {
  // Guards against the initial getSession() and onAuthStateChange both firing
  // for the same sign-in and processing it twice.
  const processedEmail = useRef<string | null>(null);

  useEffect(() => {
    const handleSession = async (session: Session | null) => {
      const su = session?.user;
      const email = su?.email;
      if (!su || !email) return;

      const emailKey = email.toLowerCase();

      // Already logged into the app as this same person → nothing to do
      // (the normal case on every page reload with a live session).
      const current = getCurrentUser();
      if (current && current.email.toLowerCase() === emailKey) {
        processedEmail.current = emailKey;
        return;
      }

      if (processedEmail.current === emailKey) return;
      processedEmail.current = emailKey;

      const meta = (su.user_metadata ?? {}) as Record<string, string>;
      const name = meta.full_name || meta.name || email.split('@')[0];
      const profileImage = meta.avatar_url || meta.picture || '';

      // Does this account already have a Genio profile in the DB? That's the
      // stable, cross-device signal for "can act as a genio".
      let isGenius = false;
      try {
        isGenius = !!(await getGeniusProfile(su.id));
      } catch (err) {
        console.error('No se pudo verificar el perfil de Genio:', err);
      }

      // Returning user → refresh their capability flag and land them in the
      // view they last used (genio panel only if they actually are a genio).
      const existing = getRegisteredUsers().find(
        (u) => u.email.toLowerCase() === emailKey
      );
      if (existing) {
        const updated: User = { ...existing, isGenius };
        setCurrentUser(updated);
        window.location.href =
          updated.role === 'genius' && isGenius ? '/genius-profile' : '/client-profile';
        return;
      }

      // Brand-new account → everyone starts as a client.
      const newUser: User = {
        id: su.id,
        name,
        email,
        role: 'client',
        isGenius,
        loginMethod: 'google',
        isVerified: true,
        registeredAt: new Date().toISOString(),
        profileImage,
      };
      addRegisteredUser(newUser);
      setCurrentUser(newUser);
      window.location.href = '/client-profile';
    };

    // Handle a session already present in the URL / storage on first load.
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));

    // Handle the sign-in that arrives after returning from Google.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') handleSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
};

export default SocialAuthBridge;
