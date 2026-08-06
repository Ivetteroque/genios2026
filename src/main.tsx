import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeMockPaymentData } from './utils/paymentUtils';
import { getCategories } from './utils/categoryUtils';
import { getLocations } from './utils/locationUtils';
import { migrateLegacyReviews } from './utils/reviewUtils';

// Inicializar datos mock al inicio de la aplicación
initializeMockPaymentData();
getCategories(); // Esto inicializa las categorías si no existen
getLocations(); // Esto inicializa las ubicaciones si no existen

// Rescatar las reseñas que quedaron en localStorage antes de unificarlas en
// Supabase. Es idempotente y no bloquea el arranque.
migrateLegacyReviews().catch((error) => {
  console.error('Error migrando reseñas antiguas:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
