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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
