import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Menu, X, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { getFirstName } from '../utils/commonUtils';
import LoginModal from './LoginModal';
import { getCurrentUser, logout, isAuthenticated } from '../utils/authUtils';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(isAuthenticated());
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for custom events to open login modal
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true);
    };

    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => window.removeEventListener('openLoginModal', handleOpenLoginModal);
  }, []);

  // Update user state when authentication changes
  useEffect(() => {
    const checkAuthState = () => {
      setCurrentUser(getCurrentUser());
      setIsUserAuthenticated(isAuthenticated());
    };

    // Check auth state on component mount and when localStorage changes
    checkAuthState();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuthState);
    
    // Custom event listener for auth changes within the same tab
    window.addEventListener('authStateChanged', checkAuthState);
    
    return () => {
      window.removeEventListener('storage', checkAuthState);
      window.removeEventListener('authStateChanged', checkAuthState);
    };
  }, []);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLoginModal(true);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Show logout confirmation
    alert('¡Hasta pronto!\n\nHas cerrado sesión exitosamente.');
  };

  const handleProfileClick = () => {
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    
    // Navigate to user profile based on role
    if (currentUser?.role === 'genius') {
      // Navigate to genius profile page
      window.location.href = '/genius-profile';
    } else {
      // Navigate to client profile page
      window.location.href = '/client-profile';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserDropdown && !target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Briefcase className="text-primary mr-2" size={28} />
            <span className="font-heading font-bold text-xl md:text-2xl text-text">Genios</span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-text"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Search Bar for Authenticated Users */}
            {isUserAuthenticated && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Buscar un genio..."
                  className="w-64 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                />
              </div>
            )}

            {/* Navigation Links for Non-Authenticated Users */}
            {!isUserAuthenticated && (
              <>
                <Link to="/" className={`text-text/80 hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary' : ''}`}>
                  Inicio
                </Link>
                <a href="#como-funciona" className="text-text/80 hover:text-primary transition-colors">Cómo funciona</a>
                <Link to="/categories" className={`text-text/80 hover:text-primary transition-colors ${location.pathname === '/categories' ? 'text-primary' : ''}`}>
                  Categorías
                </Link>
                <a href="#historias" className="text-text/80 hover:text-primary transition-colors">Historias</a>
                <a href="#publicar" className="text-text/80 hover:text-primary transition-colors">Publicar servicio</a>
              </>
            )}

            {/* Authenticated User Section */}
            {isUserAuthenticated && currentUser ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative text-text/60 hover:text-primary transition-colors">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative user-dropdown-container">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
                  >
                    <img
                      src={currentUser.profileImage || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}>
                        Hola, {getFirstName(currentUser.name)}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 text-text/80 hover:bg-gray-50 hover:text-primary transition-colors flex items-center"
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                      >
                        <User size={16} className="mr-3" />
                        🧾 Ver mi perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-text/80 hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center"
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                      >
                        <LogOut size={16} className="mr-3" />
                        ❌ Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Non-Authenticated User Actions */
              <>
                <a 
                  href="#login" 
                  onClick={handleLoginClick}
                  className="text-text/80 hover:text-primary transition-colors cursor-pointer"
                >
                  Iniciar sesión
                </a>
                <Link to="/categories" className="bg-primary text-text px-4 py-2 rounded-full hover:bg-primary-dark transition-colors">
                  Buscar un Genio
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white w-full shadow-lg">
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              {/* Search Bar for Mobile Authenticated Users */}
              {isUserAuthenticated && (
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="🔍 Buscar un genio..."
                    className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  />
                </div>
              )}

              {/* Mobile Navigation Links */}
              {!isUserAuthenticated ? (
                <>
                  <Link to="/" className="text-text/80 hover:text-primary transition-colors py-2">Inicio</Link>
                  <a href="#como-funciona" className="text-text/80 hover:text-primary transition-colors py-2">Cómo funciona</a>
                  <Link to="/categories" className="text-text/80 hover:text-primary transition-colors py-2">Categorías</Link>
                  <a href="#historias" className="text-text/80 hover:text-primary transition-colors py-2">Historias</a>
                  <a href="#publicar" className="text-text/80 hover:text-primary transition-colors py-2">Publicar servicio</a>
                  <a 
                    href="#login" 
                    onClick={handleLoginClick}
                    className="text-text/80 hover:text-primary transition-colors py-2 cursor-pointer"
                  >
                    Iniciar sesión
                  </a>
                  <Link to="/categories" className="bg-primary text-text px-4 py-2 rounded-full text-center hover:bg-primary-dark transition-colors">
                    Buscar un Genio
                  </Link>
                </>
              ) : (
                /* Mobile Authenticated User Menu */
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 py-2 border-b border-gray-100">
                    <img
                      src={currentUser?.profileImage || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'}
                      alt={currentUser?.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <p className="font-semibold text-text" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}>
                        Hola, {currentUser ? getFirstName(currentUser.name) : 'Usuario'}
                      </p>
                      <p className="text-xs text-text/60" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        {currentUser?.role === 'genius' ? 'Genio' : 'Cliente'}
                      </p>
                    </div>
                  </div>

                  {/* Mobile User Actions */}
                  <button
                    onClick={handleProfileClick}
                    className="text-text/80 hover:text-primary transition-colors py-2 text-left flex items-center"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  >
                    <User size={16} className="mr-3" />
                    🧾 Ver mi perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-text/80 hover:text-red-500 transition-colors py-2 text-left flex items-center"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  >
                    <LogOut size={16} className="mr-3" />
                    ❌ Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};

export default Header;