import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeMockPaymentData } from './utils/paymentUtils';
import { getCategories } from './utils/categoryUtils';
import { getLocations } from './utils/locationUtils';

// Inicializar datos mock al inicio de la aplicación
initializeMockPaymentData();
getCategories(); // Esto inicializa las categorías si no existen
getLocations(); // Esto inicializa las ubicaciones si no existen

// El antiguo alta de genios por el admin guardaba en este navegador las
// contraseñas iniciales sin cifrar. Ese flujo ya no existe: se borra el rastro.
//
// Ya no se rescatan aquí las reseñas antiguas de localStorage
// (migrateLegacyReviews): con la RLS actual solo su autor, con sesión, puede
// publicarlas, así que para cualquier otro visitante fallaría en cada carga.
try {
  localStorage.removeItem('geniusPendingAccess');
} catch {
  // Sin acceso a localStorage no hay nada que limpiar.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
