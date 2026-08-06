#!/usr/bin/env node
/**
 * Comprime las imágenes que ya estaban guardadas antes de que la app empezara a
 * comprimir en el navegador (src/utils/imageCompression.ts).
 *
 * Hace dos pasadas:
 *
 *   1. buckets — recorre profile-photos, portfolios y review-images, y
 *      reemplaza cada archivo por su versión WebP redimensionada. El archivo se
 *      sobrescribe EN LA MISMA RUTA, así que ninguna URL guardada en la base
 *      deja de funcionar. La extensión del path queda mintiendo (un .jpg que en
 *      realidad es WebP), pero lo que el navegador respeta es el Content-Type
 *      del objeto, que sí se actualiza. Renombrar obligaría a reescribir todas
 *      las referencias en genius_profiles y genius_reviews: mucho más riesgo
 *      para una diferencia cosmética.
 *
 *   2. base64 — las imágenes que nunca llegaron a Storage y siguen como
 *      data-URL dentro de genius_profiles.profile_photo / .portfolio y de
 *      genius_reviews.images. Son las peores: viajan en cada consulta que toque
 *      esas columnas, infladas un 33% por el base64. Se suben al bucket que les
 *      corresponde y la columna pasa a guardar la URL.
 *
 * Uso:
 *
 *   SUPABASE_SERVICE_ROLE_KEY='...' node scripts/compress-existing-images.mjs
 *   SUPABASE_SERVICE_ROLE_KEY='...' node scripts/compress-existing-images.mjs --aplicar
 *   ... --aplicar --solo=buckets     # o --solo=base64
 *
 * Sin --aplicar solo informa lo que haría: nada se escribe.
 *
 * La service_role key está en el panel de Supabase → Project Settings → API.
 * NO la pongas en .env: ese archivo lo lee Vite y acabaría en el bundle del
 * navegador. Pasala en la misma línea del comando, como en apply-migrations.sh.
 *
 * Necesita sharp (ya está en devDependencies) y la service_role porque los
 * buckets no tienen política de UPDATE para la anon key, a propósito.
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// --- Configuración -------------------------------------------------------

/** Mismos valores que usa el cliente, para que todo el material sea uniforme. */
const PRESETS = {
  'profile-photos': { maxSize: 800, quality: 82 },
  portfolios: { maxSize: 1400, quality: 80 },
  'review-images': { maxSize: 1400, quality: 80 }
};

/** Recomprimir para ahorrar cuatro bytes no vale el riesgo de tocar el archivo. */
const MIN_SAVINGS = 0.1;

/** Archivos ya livianos y de tamaño razonable: se dejan como están. */
const SIZE_ALREADY_FINE = 120 * 1024;

/** Cuántas imágenes procesar a la vez. Alto no ayuda: el cuello es la red. */
const CONCURRENCY = 4;

const CACHE_ONE_YEAR = '31536000';

// --- Utilidades ----------------------------------------------------------

const args = process.argv.slice(2);
const apply = args.includes('--aplicar');
const only = args.find((a) => a.startsWith('--solo='))?.split('=')[1] ?? 'todo';

if (!['todo', 'buckets', 'base64'].includes(only)) {
  console.error(`--solo debe ser buckets, base64 o todo (recibido: ${only})`);
  process.exit(1);
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** Lee VITE_SUPABASE_URL del .env sin arrastrar dotenv como dependencia. */
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
  console.error("Pasala en el comando, no en .env:  SUPABASE_SERVICE_ROLE_KEY='...' node scripts/...");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

/** Ejecuta las tareas de a `limit`, en vez de soltar cientos de golpe. */
const inBatches = async (items, limit, task) => {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    results.push(...(await Promise.all(items.slice(i, i + limit).map(task))));
  }
  return results;
};

/**
 * Redimensiona y recodifica a WebP. Devuelve null si no vale la pena tocar el
 * archivo: ya es chico, ya está optimizado, o el resultado no ahorra nada.
 */
const compress = async (buffer, { maxSize, quality }, { force = false } = {}) => {
  const { width, height } = await sharp(buffer).metadata();
  const alreadySmall =
    buffer.length < SIZE_ALREADY_FINE && Math.max(width ?? 0, height ?? 0) <= maxSize;
  if (alreadySmall && !force) return null;

  const output = await sharp(buffer, { failOn: 'none' })
    .rotate() // respeta la orientación EXIF; sin esto las fotos de celular giran
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  if (!force && output.length > buffer.length * (1 - MIN_SAVINGS)) return null;
  return output;
};

// --- Pasada 1: archivos que ya están en los buckets -----------------------

/** `list` no es recursivo: las carpetas vienen con id null y hay que bajar. */
const listRecursive = async (bucket, prefix = '') => {
  const files = [];
  const PAGE_SIZE = 100;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: PAGE_SIZE, offset });

    if (error) throw error;
    if (!data?.length) break;

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        files.push(...(await listRecursive(bucket, path)));
      } else {
        files.push({ path, size: item.metadata?.size ?? 0 });
      }
    }

    if (data.length < PAGE_SIZE) break;
  }

  return files;
};

const migrateBucket = async (bucket) => {
  const preset = PRESETS[bucket];
  let files;

  try {
    files = await listRecursive(bucket);
  } catch (error) {
    console.error(`  No se pudo listar ${bucket}: ${error.message}`);
    return { before: 0, after: 0, touched: 0, failures: 1 };
  }

  console.log(`\n[${bucket}] ${files.length} archivo(s)`);

  const results = await inBatches(files, CONCURRENCY, async ({ path, size }) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;

      const original = Buffer.from(await data.arrayBuffer());
      const compressed = await compress(original, preset);

      if (!compressed) return { before: original.length, after: original.length, touched: false };

      if (apply) {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, {
            contentType: 'image/webp',
            upsert: true,
            cacheControl: CACHE_ONE_YEAR
          });
        if (uploadError) throw uploadError;
      }

      const savings = Math.round((1 - compressed.length / original.length) * 100);
      console.log(`  ${path}: ${mb(original.length)} → ${mb(compressed.length)} (-${savings}%)`);

      return { before: original.length, after: compressed.length, touched: true };
    } catch (error) {
      console.error(`  ✗ ${path}: ${error.message}`);
      return { before: size, after: size, touched: false, failed: true };
    }
  });

  return {
    before: results.reduce((sum, r) => sum + r.before, 0),
    after: results.reduce((sum, r) => sum + r.after, 0),
    touched: results.filter((r) => r.touched).length,
    failures: results.filter((r) => r.failed).length
  };
};

// --- Pasada 2: data-URLs que siguen dentro de la base ---------------------

const isDataUrl = (value) => typeof value === 'string' && value.startsWith('data:');

/** Comprime un data-URL y lo sube al bucket. Devuelve la URL pública. */
const uploadDataUrl = async (dataUrl, bucket, prefix) => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const original = Buffer.from(base64, 'base64');

  // Aquí sí se fuerza: aunque la imagen sea chica, sacarla de la fila ya es la
  // ganancia. Quedarse en base64 nunca es la mejor opción.
  const compressed = (await compress(original, PRESETS[bucket], { force: true })) ?? original;
  const path = `${prefix}/migrada-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  if (!apply) {
    return { url: `(dry-run) ${path}`, before: original.length, after: compressed.length };
  }

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    contentType: 'image/webp',
    upsert: false,
    cacheControl: CACHE_ONE_YEAR
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, before: original.length, after: compressed.length };
};

const migrateProfiles = async () => {
  const { data, error } = await supabase
    .from('genius_profiles')
    .select('id, profile_photo, portfolio');

  if (error) throw error;

  const pending = (data ?? []).filter(
    (row) => isDataUrl(row.profile_photo) || (row.portfolio ?? []).some(isDataUrl)
  );

  console.log(`\n[genius_profiles] ${pending.length} perfil(es) con imágenes en base64`);
  let before = 0;
  let after = 0;
  let failures = 0;

  for (const row of pending) {
    try {
      const changes = {};

      if (isDataUrl(row.profile_photo)) {
        const result = await uploadDataUrl(row.profile_photo, 'profile-photos', row.id);
        changes.profile_photo = result.url;
        before += result.before;
        after += result.after;
      }

      const portfolio = row.portfolio ?? [];
      if (portfolio.some(isDataUrl)) {
        changes.portfolio = [];
        for (const image of portfolio) {
          if (!isDataUrl(image)) {
            changes.portfolio.push(image);
            continue;
          }
          const result = await uploadDataUrl(image, 'portfolios', row.id);
          changes.portfolio.push(result.url);
          before += result.before;
          after += result.after;
        }
      }

      if (apply) {
        const { error: updateError } = await supabase
          .from('genius_profiles')
          .update(changes)
          .eq('id', row.id);
        if (updateError) throw updateError;
      }

      console.log(`  ${row.id}: ${Object.keys(changes).join(', ')}`);
    } catch (err) {
      console.error(`  ✗ ${row.id}: ${err.message}`);
      failures += 1;
    }
  }

  return { before, after, touched: pending.length - failures, failures };
};

const migrateReviews = async () => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('id, reviewed_genius_id, images');

  if (error) throw error;

  const pending = (data ?? []).filter((row) => (row.images ?? []).some(isDataUrl));

  console.log(`\n[genius_reviews] ${pending.length} reseña(s) con imágenes en base64`);
  let before = 0;
  let after = 0;
  let failures = 0;

  for (const row of pending) {
    try {
      const images = [];
      for (const image of row.images ?? []) {
        if (!isDataUrl(image)) {
          images.push(image);
          continue;
        }
        const result = await uploadDataUrl(image, 'review-images', row.reviewed_genius_id ?? row.id);
        images.push(result.url);
        before += result.before;
        after += result.after;
      }

      if (apply) {
        const { error: updateError } = await supabase
          .from('genius_reviews')
          .update({ images })
          .eq('id', row.id);
        if (updateError) throw updateError;
      }

      console.log(`  ${row.id}: ${images.length} imagen(es)`);
    } catch (err) {
      console.error(`  ✗ ${row.id}: ${err.message}`);
      failures += 1;
    }
  }

  return { before, after, touched: pending.length - failures, failures };
};

// --- Ejecución -----------------------------------------------------------

const total = { before: 0, after: 0, touched: 0, failures: 0 };
const accumulate = (partial) => {
  total.before += partial.before;
  total.after += partial.after;
  total.touched += partial.touched;
  total.failures += partial.failures;
};

console.log(
  apply
    ? 'Modo APLICAR: se van a reemplazar archivos.'
    : 'Modo simulación (agregá --aplicar para escribir).'
);

if (only === 'todo' || only === 'buckets') {
  for (const bucket of Object.keys(PRESETS)) {
    accumulate(await migrateBucket(bucket));
  }
}

if (only === 'todo' || only === 'base64') {
  accumulate(await migrateProfiles());
  accumulate(await migrateReviews());
}

const totalSavings = total.before > 0 ? Math.round((1 - total.after / total.before) * 100) : 0;

console.log('\n─────────────────────────────');
console.log(`Elementos modificados: ${total.touched}`);
console.log(`Peso: ${mb(total.before)} → ${mb(total.after)} (-${totalSavings}%)`);
if (total.failures > 0) console.log(`Fallos: ${total.failures} (ver el detalle arriba)`);
if (!apply) console.log('\nNada se escribió. Repetí con --aplicar cuando los números te convenzan.');
