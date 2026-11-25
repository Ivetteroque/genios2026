import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, X, ChevronDown, User, LogOut, Search } from 'lucide-react';
import { getFirstName } from '../utils/commonUtils';
import LoginModal from './LoginModal';
import { getCurrentUser, logout, isAuthenticated, setActiveMode } from '../utils/authUtils';
import type { LoginIntent } from '../utils/onboardingUtils';

/** Buscador del menú: lleva a la página de resultados con lo escrito. */
const HeaderSearch: React.FC<{ className?: string; onDone?: () => void }> = ({ className = '', onDone }) => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        navigate(term ? `/categories?q=${encodeURIComponent(term)}` : '/categories');
        setQ('');
        onDone?.();
      }}
    >
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar un genio…"
        aria-label="Buscar un genio"
        className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      />
    </form>
  );
};

/** Foto de la persona o, si no tiene, su inicial (nunca la foto de un desconocido). */
const HeaderAvatar: React.FC<{ name: string; image?: string; size?: string }> = ({ name, image, size = 'w-8 h-8' }) =>
  image ? (
    <img src={image} alt="" className={`${size} rounded-full object-cover border-2 border-primary/20`} />
  ) : (
    <span className={`${size} rounded-full bg-primary/30 text-ink-blue text-sm font-semibold flex items-center justify-center`}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginIntent, setLoginIntent] = useState<LoginIntent>({});
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
    // Otras pantallas abren el login con un contexto (adónde volver, qué texto
    // mostrar) mediante openLogin() de onboardingUtils.
    const handleOpenLoginModal = (event: Event) => {
      setLoginIntent((event as CustomEvent<LoginIntent>).detail ?? {});
      setShowLoginModal(true);
      setMobileMenuOpen(false);
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
    setLoginIntent({});
    setShowLoginModal(true);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  const handleProfileClick = () => {
    setShowUserDropdown(false);
    setMobileMenuOpen(false);

    // Navigate to user profile based on active view mode
    if (currentUser?.role === 'genius') {
      navigate('/genius-profile');
    } else {
      navigate('/client-profile');
    }
  };

  // Toggle the active view for users who are both client and genio.
  const handleSwitchMode = (mode: 'client' | 'genius') => {
    setActiveMode(mode);
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    setCurrentUser(getCurrentUser());
    navigate(mode === 'genius' ? '/genius-profile' : '/client-profile');
  };

  // A plain client opts in to becoming a genio; the genio panel opens the wizard
  // automatically when there's no genius_profile yet.
  const handleBecomeGenius = () => {
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    navigate('/genius-profile');
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
            className="md:hidden text-text p-2 -mr-2 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Search Bar for Authenticated Users */}
            {isUserAuthenticated && (
              <HeaderSearch className="w-64" />
            )}

            {/* Navigation Links for Non-Authenticated Users */}
            {!isUserAuthenticated && (
              <>
                <Link to="/" className={`text-text/80 hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary' : ''}`}>
                  Inicio
                </Link>
                <a href="/#como-funciona" className="text-text/80 hover:text-primary transition-colors">Cómo funciona</a>
                <Link to="/categories" className={`text-text/80 hover:text-primary transition-colors ${location.pathname === '/categories' ? 'text-primary' : ''}`}>
                  Buscar genios
                </Link>
                <a href="/#historias" className="text-text/80 hover:text-primary transition-colors">Historias</a>
              </>
            )}

            {/* Authenticated User Section */}
            {isUserAuthenticated && currentUser ? (
              <div className="flex items-center space-x-4">
                {/* User Profile Dropdown */}
                <div className="relative user-dropdown-container">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    aria-expanded={showUserDropdown}
                    aria-haspopup="menu"
                    className="flex items-center space-x-2 text-text hover:text-ink-blue transition-colors"
                  >
                    <HeaderAvatar name={currentUser.name} image={currentUser.profileImage} />
                    <div className="text-left">
                      <p className="text-sm font-semibold">
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
                        Mi cuenta
                      </button>

                      {/* Dual users: switch view. Plain clients: opt in to Genio. */}
                      <div className="my-1 border-t border-gray-100" />
                      {currentUser.isGenius ? (
                        <>
                          <p className="px-4 pt-1 pb-0.5 text-xs text-text/50" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                            Ver como
                          </p>
                          <button
                            onClick={() => handleSwitchMode('client')}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center ${currentUser.role === 'client' ? 'text-primary font-semibold' : 'text-text/80 hover:text-primary'}`}
                            style={{ fontFamily: 'Open Sans, sans-serif' }}
                          >
                            <User size={16} className="mr-3" />
                            Cliente {currentUser.role === 'client' && '✓'}
                          </button>
                          <button
                            onClick={() => handleSwitchMode('genius')}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center ${currentUser.role === 'genius' ? 'text-primary font-semibold' : 'text-text/80 hover:text-primary'}`}
                            style={{ fontFamily: 'Open Sans, sans-serif' }}
                          >
                            <Briefcase size={16} className="mr-3" />
                            Genio {currentUser.role === 'genius' && '✓'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleBecomeGenius}
                          className="w-full text-left px-4 py-2 text-text/80 hover:bg-gray-50 hover:text-primary transition-colors flex items-center"
                          style={{ fontFamily: 'Open Sans, sans-serif' }}
                        >
                          <Briefcase size={16} className="mr-3" />
                          Ofrece tus servicios
                        </button>
                      )}
                      <div className="my-1 border-t border-gray-100" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-text/80 hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center"
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                      >
                        <LogOut size={16} className="mr-3" />
                        Cerrar sesión
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
                <Link to="/ser-genio" className="bg-secondary text-text px-4 py-2 rounded-full hover:bg-secondary-dark transition-colors font-medium">
                  Ofrece tus servicios
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
                <HeaderSearch className="mb-3" onDone={() => setMobileMenuOpen(false)} />
              )}

              {/* Mobile Navigation Links */}
              {!isUserAuthenticated ? (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-text/80 hover:text-primary transition-colors py-2">Inicio</Link>
                  <a href="/#como-funciona" onClick={() => setMobileMenuOpen(false)} className="text-text/80 hover:text-primary transition-colors py-2">Cómo funciona</a>
                  <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="text-text/80 hover:text-primary transition-colors py-2">Buscar genios</Link>
                  <a href="/#historias" onClick={() => setMobileMenuOpen(false)} className="text-text/80 hover:text-primary transition-colors py-2">Historias</a>
                  <a
                    href="#login" 
                    onClick={handleLoginClick}
                    className="text-text/80 hover:text-primary transition-colors py-2 cursor-pointer"
                  >
                    Iniciar sesión
                  </a>
                  <Link to="/ser-genio" onClick={() => setMobileMenuOpen(false)} className="bg-secondary text-text px-4 py-3 rounded-full text-center hover:bg-secondary-dark transition-colors font-medium">
                    Ofrece tus servicios
                  </Link>
                </>
              ) : (
                /* Mobile Authenticated User Menu */
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 py-2 border-b border-gray-100">
                    <HeaderAvatar name={currentUser?.name ?? ''} image={currentUser?.profileImage} size="w-10 h-10" />
                    <div>
                      <p className="font-semibold text-text">
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
                    Mi cuenta
                  </button>

                  {/* Dual users: switch view. Plain clients: opt in to Genio. */}
                  {currentUser?.isGenius ? (
                    <div className="flex items-center gap-2 py-2">
                      <span className="text-xs text-text/40" style={{ fontFamily: 'Open Sans, sans-serif' }}>Ver como:</span>
                      <button
                        onClick={() => handleSwitchMode('client')}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${currentUser.role === 'client' ? 'bg-primary text-text' : 'bg-gray-100 text-text/70'}`}
                      >
                        Cliente
                      </button>
                      <button
                        onClick={() => handleSwitchMode('genius')}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${currentUser.role === 'genius' ? 'bg-primary text-text' : 'bg-gray-100 text-text/70'}`}
                      >
                        Genio
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleBecomeGenius}
                      className="text-text/80 hover:text-primary transition-colors py-2 text-left flex items-center"
                      style={{ fontFamily: 'Open Sans, sans-serif' }}
                    >
                      <Briefcase size={16} className="mr-3" />
                      Ofrece tus servicios
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-text/80 hover:text-red-500 transition-colors py-2 text-left flex items-center"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  >
                    <LogOut size={16} className="mr-3" />
                    Cerrar sesión
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
        title={loginIntent.title}
        subtitle={loginIntent.subtitle}
        redirectTo={loginIntent.redirectTo}
      />
    </>
  );
};

export default Header;