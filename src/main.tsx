import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { syncCategoriesFromServer } from './utils/categoryUtils';
import { syncLocationsFromServer } from './utils/locationUtils';

// Categorías y ubicaciones viven en Supabase (`site_catalogs`); el navegador
// guarda una caché para leerlas al instante. Se refresca en cada visita, sin
// bloquear el primer render: los componentes escuchan `categoriesChanged` y
// `locationsChanged`.
syncCategoriesFromServer().catch((error) => console.error('Error sincronizando categorías:', error));
syncLocationsFromServer().catch((error) => console.error('Error sincronizando ubicaciones:', error));

// Limpieza de datos que ya no se usan en este navegador:
// - geniusPendingAccess: contraseñas iniciales sin cifrar del antiguo alta de
//   genios por el admin.
// - paymentVouchers, trialCodes, geniusSubscriptions: datos de pago de prueba
//   que se sembraban en cada visita; los reales están en Supabase.
// - genios: copia local que leía el panel admin antes de usar Supabase.
//
// Ya no se rescatan aquí las reseñas antiguas de localStorage
// (migrateLegacyReviews): con la RLS actual solo su autor, con sesión, puede
// publicarlas, así que para cualquier otro visitante fallaría en cada carga.
try {
  ['geniusPendingAccess', 'paymentVouchers', 'trialCodes', 'geniusSubscriptions', 'genios'].forEach((key) =>
    localStorage.removeItem(key)
  );
} catch {
  // Sin acceso a localStorage no hay nada que limpiar.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
