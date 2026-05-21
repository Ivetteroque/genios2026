import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDERS = ['albañil', 'maquilladora', 'DJ', 'gasfitero', 'electricista', 'payaso'];
const PILLS = ['Maquilladora', 'Albañil', 'DJ', 'Payaso', 'Electricista', 'Gasfitero'];
const SLIDE_DURATION = 6000;

const Hero: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  /* --- Typewriter effect (only runs on slide 0) --- */
  useEffect(() => {
    if (activeSlide !== 0) return;
    const current = PLACEHOLDERS[placeholderIndex];

    if (!isDeleting && displayedPlaceholder.length < current.length) {
      typeTimeoutRef.current = setTimeout(() => {
        setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length + 1));
      }, 80);
    } else if (!isDeleting && displayedPlaceholder.length === current.length) {
      typeTimeoutRef.current = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayedPlaceholder.length > 0) {
      typeTimeoutRef.current = setTimeout(() => {
        setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length - 1));
      }, 45);
    } else if (isDeleting && displayedPlaceholder.length === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }

    return () => {
      if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
    };
  }, [displayedPlaceholder, isDeleting, placeholderIndex, activeSlide]);

  /* --- Auto-play carousel --- */
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveSlide((s) => (s + 1) % 2);
    }, SLIDE_DURATION);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [startAutoPlay]);

  const goTo = (index: number) => {
    setActiveSlide(index);
    startAutoPlay();
  };

  const handleSearch = () => {
    const term = query.trim();
    if (!term) return;
    navigate(`/categories?q=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePill = (term: string) => {
    navigate(`/categories?q=${encodeURIComponent(term)}`);
  };

  return (
    <section
      id="inicio"
      className="relative h-screen bg-background overflow-hidden flex flex-col"
    >
      {/* Slides area */}
      <div className="flex-1 relative overflow-hidden">

        {/* --- Slide 0: Search --- */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
            activeSlide === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
          }`}
        >
          <div className="container mx-auto px-4 pt-16">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4 leading-tight">
                Encuentra el genio que{' '}
                <span className="text-primary-dark">necesitas.</span>
              </h1>
              <p className="text-base md:text-lg text-text/60 mb-10 max-w-md mx-auto leading-relaxed">
                Busca por habilidad, oficio o nombre y conecta con alguien de tu ciudad hoy mismo.
              </p>

              {/* Search bar */}
              <div className="flex items-center border border-gray-200 bg-white rounded-full px-4 py-3 gap-2 mb-5 max-w-lg mx-auto shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all duration-200">
                <Search className="w-4 h-4 text-text/35 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={displayedPlaceholder || 'Busca un genio...'}
                  className="flex-1 bg-transparent text-sm text-text placeholder:text-text/35 outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim()}
                  className="flex-shrink-0 bg-secondary hover:bg-secondary-dark disabled:opacity-40 disabled:cursor-default text-gray-900 text-xs font-semibold px-5 py-2 rounded-full transition-colors duration-200"
                >
                  Buscar
                </button>
              </div>

              {/* Popular pills */}
              <div className="flex flex-wrap gap-2 justify-center items-center">
                <span className="text-xs text-text/40 mr-1">Popular:</span>
                {PILLS.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handlePill(pill)}
                    className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-white text-text/70 text-xs font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- Slide 1: CTA --- */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
            activeSlide === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
          }`}
        >
          <div className="container mx-auto px-4 pt-16">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4 leading-tight">
                Los genios no salen de lámparas…{' '}
                <span className="text-primary-dark">salen de tu ciudad.</span>
              </h1>
              <p className="text-base md:text-lg text-text/60 mb-10 max-w-md mx-auto leading-relaxed">
                El vecino que enseña, la amiga que diseña, o tú con tu habilidad.
                Conecta con personas reales listas para ayudarte.
              </p>
              <a
                href="#ser-genio"
                className="inline-flex items-center bg-secondary hover:bg-secondary-dark text-gray-900 font-semibold px-8 py-3.5 rounded-full transition-colors duration-200 shadow-sm hover:shadow text-sm"
              >
                Quiero ser un Genio
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      <div className="flex items-center justify-center gap-3 pb-10">
        <button
          onClick={() => goTo((activeSlide + 1) % 2)}
          className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-text/40 hover:text-text/70 shadow-sm"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              activeSlide === i
                ? 'w-6 h-2 bg-primary-dark'
                : 'w-2 h-2 bg-text/15 hover:bg-text/30'
            }`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}

        <button
          onClick={() => goTo((activeSlide + 1) % 2)}
          className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-text/40 hover:text-text/70 shadow-sm"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
