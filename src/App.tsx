import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import AdminRoute from './components/AdminRoute';
import SocialAuthBridge from './components/SocialAuthBridge';
import LoadingSpinner from './components/LoadingSpinner';

/**
 * Cada página se descarga cuando alguien la visita, no al abrir el sitio.
 * Antes, quien entraba al home se bajaba también el panel de administración
 * entero —con sus once secciones— antes de ver nada.
 *
 * Home queda con import normal a propósito: es la primera pantalla de casi
 * todas las visitas, y separarla en su propio archivo solo agregaría una
 * segunda ida al servidor antes de poder dibujarla.
 */
const Categories = lazy(() => import('./pages/Categories'));
const Profile = lazy(() => import('./pages/Profile'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));
const GeniusProfile = lazy(() => import('./pages/GeniusProfile'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

/** Lo que se ve mientras llega el código de una página. */
const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text="Cargando..." />
  </div>
);

function App() {
  return (
    <Router>
      <SocialAuthBridge />
      <div className="font-body min-h-screen flex flex-col">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Admin Routes */}
            <Route path="/panel" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Public Routes */}
            <Route path="/*" element={
              <>
                <Header />
                <main className="flex-grow">
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/categorias/:categorySlug" element={<Categories />} />
                      <Route path="/profile/:id" element={<Profile />} />
                      <Route path="/client-profile" element={<ClientProfile />} />
                      <Route path="/genius-profile" element={<GeniusProfile />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
