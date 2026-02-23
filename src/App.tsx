import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import ClientProfile from './pages/ClientProfile';
import GeniusProfile from './pages/GeniusProfile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <div className="font-body min-h-screen flex flex-col">
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
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categorias/:categorySlug" element={<Categories />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/client-profile" element={<ClientProfile />} />
                  <Route path="/genius-profile" element={<GeniusProfile />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;