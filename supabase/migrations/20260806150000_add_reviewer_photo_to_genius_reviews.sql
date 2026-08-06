/*
  # Foto del autor en las reseñas de clientes

  La ficha de un genio muestra la inicial del nombre en un círculo donde debería
  ir el avatar de quien reseñó. No era un olvido de la UI: la foto de un cliente
  vive en `client_profiles.profile_image`, y esa tabla NO tiene política de
  SELECT a propósito (guarda email, DNI, teléfono y ubicación). El navegador,
  que solo cuenta con la anon key, no puede leerla.

  ## Qué agrega

  - `genius_reviews.reviewer_photo` (text): la foto del autor, guardada junto a
    la reseña en el momento de publicarla.

  ## Por qué una copia y no una vista pública

  La alternativa era exponer una vista con el avatar de todos los clientes. Un
  snapshot en la fila evita publicar cualquier dato de clientes y es el mismo
  patrón que ya usa `user_favorites.genius_snapshot`.

  El costo es que la foto queda congelada: si el cliente cambia su avatar, las
  reseñas que ya publicó siguen mostrando el anterior. Para un material que se
  lee como "así se veía cuando opinó", es un costo aceptable.

  ## Reseñas entre colegas

  No las toca. Ahí el autor es un genio y su foto se sigue leyendo en vivo desde
  `public_genius_profiles`, que sí es pública: la columna queda vacía y el
  servicio la completa al vuelo.

  ## Reseñas ya publicadas

  Quedan con la columna vacía y siguen mostrando la inicial. No hay forma de
  recuperar la foto retroactivamente sin leer `client_profiles` con service
  role; si hiciera falta, es una tarea aparte.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_photo') THEN
    ALTER TABLE genius_reviews ADD COLUMN reviewer_photo text NOT NULL DEFAULT '';
  END IF;
END $$;
