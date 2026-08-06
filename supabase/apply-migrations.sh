#!/usr/bin/env bash
#
# Aplica migraciones SQL contra la base de Supabase.
#
# Uso:
#   SUPABASE_DB_URL='postgresql://...' ./supabase/apply-migrations.sh                 # las pendientes
#   SUPABASE_DB_URL='postgresql://...' ./supabase/apply-migrations.sh archivo.sql ... # las que indiques
#
# La cadena de conexión está en el panel de Supabase:
#   Project Settings → Database → Connection string → URI
# Incluye la contraseña de la base, que NO es la anon key ni la service_role.
# No la guardes en .env: ese archivo lo lee Vite y acaba en el bundle del navegador.
#
# Cada migración corre dentro de una transacción: si algo falla, esa migración
# se revierte entera y el script se detiene sin tocar las siguientes.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Falta SUPABASE_DB_URL." >&2
  echo "Panel de Supabase → Project Settings → Database → Connection string → URI" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql no está en el PATH." >&2
  echo "En este equipo suele estar en /Library/PostgreSQL/16/bin/psql" >&2
  exit 1
fi

# Sin argumentos, las tres migraciones que quedaron pendientes tras conectar
# el buscador a datos reales. El orden importa.
DEFAULT_MIGRATIONS=(
  "supabase/migrations/20260806120000_create_public_genius_directory.sql"
  "supabase/migrations/20260806130000_unify_reviews_in_supabase.sql"
  "supabase/migrations/20260806140000_create_media_buckets.sql"
)

if [[ $# -gt 0 ]]; then
  MIGRATIONS=("$@")
else
  MIGRATIONS=("${DEFAULT_MIGRATIONS[@]}")
fi

echo "Aplicando ${#MIGRATIONS[@]} migración(es)…"
echo

for migration in "${MIGRATIONS[@]}"; do
  if [[ ! -f "$migration" ]]; then
    echo "No existe: $migration" >&2
    exit 1
  fi

  echo "→ $(basename "$migration")"
  psql "$SUPABASE_DB_URL" \
    --single-transaction \
    --set ON_ERROR_STOP=on \
    --quiet \
    --file "$migration"
  echo "  ok"
done

echo
echo "Listo. Verifica con:"
echo "  psql \"\$SUPABASE_DB_URL\" -c \"select count(*) from public_genius_profiles\""
echo "  psql \"\$SUPABASE_DB_URL\" -c \"select id from storage.buckets\""
