/**
 * Compresión de imágenes en el navegador, antes de subirlas a Storage.
 *
 * Las cámaras de celular producen fotos de 3–5 MB que después se muestran en
 * tarjetas de 300px: el usuario paga esa descarga entera en cada búsqueda.
 * Aquí se redimensionan y se recodifican a WebP antes de que salgan del cliente,
 * así lo que se guarda en el bucket ya es lo que conviene servir.
 */

export interface CompressOptions {
  /** Lado mayor máximo, en píxeles. */
  maxSize: number;
  /** Calidad de la recodificación (0–1). */
  quality: number;
}

/** Fotos de perfil: se ven como avatar o cabecera, nunca a pantalla completa. */
export const PROFILE_PHOTO_PRESET: CompressOptions = { maxSize: 800, quality: 0.82 };

/** Portafolios y fotos de reseñas: se pueden ver más grandes, pero no gigantes. */
export const GALLERY_PRESET: CompressOptions = { maxSize: 1400, quality: 0.8 };

/** Formatos que no conviene recodificar: animados o vectoriales. */
const SKIPPED_TYPES = ['image/gif', 'image/svg+xml'];

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Devuelve una versión reducida del archivo. Si algo falla —formato raro, canvas
 * no disponible— devuelve el original: es preferible subir una imagen pesada a
 * perder la subida.
 */
export const compressImage = async (
  file: Blob,
  { maxSize, quality }: CompressOptions
): Promise<Blob> => {
  if (SKIPPED_TYPES.includes(file.type)) return file;

  try {
    // `from-image` respeta la orientación EXIF; sin eso las fotos de celular
    // salen rotadas al pasar por el canvas.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const compressed = await canvasToBlob(canvas, 'image/webp', quality);

    // Una imagen ya optimizada puede engordar al recodificarla: en ese caso, el
    // original gana.
    if (!compressed || compressed.size >= file.size) return file;
    return compressed;
  } catch (error) {
    console.warn('No se pudo comprimir la imagen; se sube el original.', error);
    return file;
  }
};
