import { supabase } from '../lib/supabase';
import {
  compressImage,
  GALLERY_PRESET,
  PROFILE_PHOTO_PRESET,
  type CompressOptions
} from '../utils/imageCompression';

/**
 * Subida de imágenes a Supabase Storage.
 *
 * Antes las imágenes se guardaban como data-URLs base64 dentro de las columnas
 * de Postgres. Ahora la columna guarda la URL pública y el archivo vive en un
 * bucket (migración 20260806140000_create_media_buckets.sql).
 */

export const PROFILE_PHOTOS_BUCKET = 'profile-photos';
export const PORTFOLIOS_BUCKET = 'portfolios';

/** Una imagen ya migrada es una URL; una sin migrar es un data-URL base64. */
export const isDataUrl = (value: string): boolean => value.startsWith('data:');

const extensionFor = (mimeType: string): string => {
  const subtype = mimeType.split('/')[1] || 'jpg';
  return subtype === 'jpeg' ? 'jpg' : subtype;
};

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

/** Cada bucket se muestra a un tamaño distinto, así que se comprime distinto. */
const presetFor = (bucket: string): CompressOptions =>
  bucket === PROFILE_PHOTOS_BUCKET ? PROFILE_PHOTO_PRESET : GALLERY_PRESET;

/**
 * Sube un archivo (o un data-URL heredado) y devuelve su URL pública.
 * Si el valor ya es una URL, se devuelve tal cual: subir dos veces la misma
 * imagen sería desperdicio.
 */
export const uploadImage = async (
  bucket: string,
  image: File | string,
  pathPrefix: string
): Promise<string> => {
  if (typeof image === 'string' && !isDataUrl(image)) return image;

  const original = typeof image === 'string' ? await (await fetch(image)).blob() : image;
  const blob = await compressImage(original, presetFor(bucket));
  const path = `${pathPrefix || 'sin-id'}/${Date.now()}-${randomSuffix()}.${extensionFor(blob.type)}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: blob.type,
      upsert: false,
      // Las URLs llevan timestamp, así que el archivo nunca cambia: se puede
      // cachear un año y ahorrar la descarga en visitas siguientes.
      cacheControl: '31536000'
    });

  if (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Sube varias imágenes en paralelo. Las que fallan se descartan con un aviso en
 * consola en vez de tumbar el guardado entero.
 */
export const uploadImages = async (
  bucket: string,
  images: Array<File | string>,
  pathPrefix: string
): Promise<string[]> => {
  const results = await Promise.all(
    images.map(async (image) => {
      try {
        return await uploadImage(bucket, image, pathPrefix);
      } catch {
        return null;
      }
    })
  );

  return results.filter((url): url is string => url !== null);
};

/**
 * Convierte a Storage las imágenes que todavía estén en base64.
 * Devuelve los mismos valores si ya eran URLs, para poder llamarla sin
 * comprobar antes.
 */
export const migrateImagesToStorage = async (
  bucket: string,
  images: string[],
  pathPrefix: string
): Promise<string[]> => {
  if (!images.some(isDataUrl)) return images;
  return uploadImages(bucket, images, pathPrefix);
};
