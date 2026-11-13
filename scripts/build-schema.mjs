/**
 * Regenera supabase/schema_completo.sql concatenando, en orden, todas las
 * migraciones de supabase/migrations.
 *
 * Uso: pnpm db:schema
 *
 * Ese archivo sirve para levantar un proyecto de Supabase NUEVO pegándolo en el
 * SQL Editor. Se desincroniza cada vez que se agrega una migración, así que
 * conviene correr este script en el mismo commit que la migración.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');
const outFile = path.join(root, 'supabase', 'schema_completo.sql');

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const header = `-- ============================================================================
-- GENIOS A LA OBRA — Script de base de datos consolidado
-- Genera todo el esquema (tablas, RLS, policies, funciones y seeds).
-- Pegar completo en el SQL Editor de un proyecto Supabase NUEVO y ejecutar.
-- Orden respetado por dependencias de claves foráneas.
--
-- ARCHIVO GENERADO: no editar a mano. Se regenera con \`pnpm db:schema\`
-- a partir de supabase/migrations (${migrations.length} migraciones).
-- ============================================================================
`;

const sections = migrations.map((file) => {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8').trimEnd();
  return `
-- ############################################################################
-- MIGRATION: ${file}
-- ############################################################################

${sql}
`;
});

fs.writeFileSync(outFile, `${header}\n${sections.join('\n')}`);
console.log(`schema_completo.sql regenerado con ${migrations.length} migraciones.`);
