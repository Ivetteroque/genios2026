import React, { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  getCurrentUser,
  setCurrentUser,
  getRegisteredUsers,
  saveRegisteredUser,
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
 *
 * No navega a ninguna página: al iniciar sesión el usuario permanece donde
 * estaba y solo se actualiza el header con su cuenta.
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

      // La sesión de un administrador también es una sesión de Supabase Auth,
      // pero no representa a un cliente de la plataforma: sin esto, entrar al
      // panel dejaría al admin "logueado" como usuario en la web pública.
      const role = (su.app_metadata as { role?: string } | undefined)?.role;
      if (role === 'admin' || role === 'super_admin') return;

      const emailKey = email.toLowerCase();

      // Already logged into the app as this same person → nothing que hacer
      // (el caso normal en cada recarga con sesión viva), salvo que la sesión
      // guardada arrastre un id distinto al de Supabase Auth: ese id es la
      // identidad con la que se guardan reseñas y favoritos, así que se corrige
      // aquí mismo en vez de esperar a un nuevo login.
      const current = getCurrentUser();
      if (current && current.email.toLowerCase() === emailKey) {
        processedEmail.current = emailKey;
        if (current.id !== su.id) {
          const fixed: User = { ...current, id: su.id };
          saveRegisteredUser(fixed);
          setCurrentUser(fixed);
        }
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

      // Returning user → refresh their capability flag. No redirigimos: el
      // usuario se queda donde estaba y solo cambia el header (setCurrentUser
      // emite `authStateChanged`).
      const existing = getRegisteredUsers().find(
        (u) => u.email.toLowerCase() === emailKey
      );
      if (existing) {
        // El id SIEMPRE es el de Supabase Auth: es la identidad estable con la
        // que se guardan reseñas, favoritos y el perfil de cliente. Una entrada
        // de localStorage con un id heredado haría que el usuario no reconozca
        // sus propios datos (p. ej. volvería a ofrecerle reseñar a un genio que
        // ya reseñó).
        const updated: User = { ...existing, id: su.id, isGenius };
        saveRegisteredUser(updated);
        setCurrentUser(updated);
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
      saveRegisteredUser(newUser);
      setCurrentUser(newUser);
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
