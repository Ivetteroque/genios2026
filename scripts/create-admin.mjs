#!/usr/bin/env node
/**
 * Crea (o actualiza) un administrador del panel en Supabase Auth.
 *
 * El rol y los permisos van en `app_metadata`, que solo se puede escribir con
 * la service_role: ni el propio usuario puede ascenderse a admin. Las políticas
 * RLS leen ese rol desde el JWT mediante `is_admin()`
 * (migración 20260806160000_admin_read_access.sql).
 *
 * Uso:
 *
 *   SUPABASE_SERVICE_ROLE_KEY='...' node scripts/create-admin.mjs \
 *     admin@genios.pe 'una-contraseña-larga' 'Administrador Principal' super_admin
 *
 * Argumentos: email, contraseña, nombre (opcional), rol (opcional).
 * El rol puede ser `admin` o `super_admin`; por defecto, `admin`.
 *
 * Si el email ya existe, se le actualiza la contraseña y los metadatos: sirve
 * para recuperar el acceso sin crear un usuario nuevo.
 *
 * La service_role key está en el panel de Supabase → Project Settings → API.
 * NO la pongas en .env: ese archivo lo lee Vite y acabaría en el bundle.
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

/** Qué puede ver cada rol dentro del panel (lo consulta `hasPermission`). */
const PERMISSIONS = {
  super_admin: ['users', 'genios', 'reports', 'settings', 'payments'],
  admin: ['users', 'genios', 'reports']
};

const [email, password, name = 'Administrador', role = 'admin'] = process.argv.slice(2);

if (!email || !password) {
  console.error("Uso: SUPABASE_SERVICE_ROLE_KEY='...' node scripts/create-admin.mjs <email> <contraseña> [nombre] [admin|super_admin]");
  process.exit(1);
}

if (!PERMISSIONS[role]) {
  console.error(`Rol inválido: ${role}. Usá admin o super_admin.`);
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const readEnv = (key) => {
  if (process.env[key]) return process.env[key];
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  } catch {
    return undefined;
  }
};

const url = readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('Falta la URL del proyecto (SUPABASE_URL o VITE_SUPABASE_URL en .env).');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Panel de Supabase → Project Settings → API → service_role.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const appMetadata = { role, name, permissions: PERMISSIONS[role] };

/** Busca el usuario por email recorriendo el listado paginado de Auth. */
const findUserByEmail = async (target) => {
  const PAGE_SIZE = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;

    const found = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (found) return found;
    if (data.users.length < PAGE_SIZE) return null;
  }
};

const existing = await findUserByEmail(email);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    app_metadata: appMetadata
  });
  if (error) {
    console.error('No se pudo actualizar el administrador:', error.message);
    process.exit(1);
  }
  console.log(`Administrador actualizado: ${email} (${role})`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata
  });
  if (error) {
    console.error('No se pudo crear el administrador:', error.message);
    process.exit(1);
  }
  console.log(`Administrador creado: ${email} (${role})`);
}

console.log('Ya podés entrar en /panel con ese email y contraseña.');
