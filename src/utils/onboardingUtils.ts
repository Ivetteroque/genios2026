/**
 * Piezas del camino de alta que tienen que sobrevivir al viaje de ida y vuelta
 * a Google (el login es una redirección de página completa):
 *
 * - Adónde volver después de iniciar sesión (p. ej. al formulario del genio).
 * - El código de invitación que venía en el enlace (/ser-genio?codigo=...),
 *   para canjearlo solo cuando el genio termine su perfil.
 *
 * Se guardan en localStorage porque sessionStorage no siempre sobrevive a la
 * redirección en navegadores móviles.
 */

const REDIRECT_KEY = 'postLoginRedirect';
const INVITE_KEY = 'pendingInviteCode';

export interface LoginIntent {
  /** Ruta a la que volver tras iniciar sesión, p. ej. '/genius-profile'. */
  redirectTo?: string;
  /** Texto del modal de login para este contexto. */
  title?: string;
  subtitle?: string;
}

/** Abre el modal de login (lo escucha el Header). */
export const openLogin = (intent: LoginIntent = {}) => {
  window.dispatchEvent(new CustomEvent<LoginIntent>('openLoginModal', { detail: intent }));
};

const safeGet = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* sin almacenamiento */ }
};
const safeRemove = (key: string) => {
  try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ }
};

/** Solo rutas internas: nunca un enlace a otro sitio. */
const isInternalPath = (path: string) => path.startsWith('/') && !path.startsWith('//');

// Si la persona cancela en Google, la ruta guardada no debe aplicarse días
// después en otro inicio de sesión: caduca a los 15 minutos.
const REDIRECT_TTL_MS = 15 * 60 * 1000;

export const rememberPostLoginRedirect = (path: string) => {
  if (isInternalPath(path)) safeSet(REDIRECT_KEY, JSON.stringify({ path, at: Date.now() }));
};

/** Devuelve (y olvida) la ruta pendiente, si sigue vigente. */
export const takePostLoginRedirect = (): string | null => {
  const raw = safeGet(REDIRECT_KEY);
  safeRemove(REDIRECT_KEY);
  if (!raw) return null;
  try {
    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
    if (!path || !at || Date.now() - at > REDIRECT_TTL_MS || !isInternalPath(path)) return null;
    return path;
  } catch {
    return null;
  }
};

export const normalizeInviteCode = (code: string) => code.trim().toUpperCase().slice(0, 30);

export const savePendingInviteCode = (code: string) => {
  const normalized = normalizeInviteCode(code);
  if (/^[A-Z0-9_-]{3,30}$/.test(normalized)) safeSet(INVITE_KEY, normalized);
};

export const getPendingInviteCode = (): string | null => safeGet(INVITE_KEY);

export const clearPendingInviteCode = () => safeRemove(INVITE_KEY);
