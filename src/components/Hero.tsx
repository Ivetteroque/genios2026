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

  /* --- Search handlers --- */
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
      className="relative min-h-screen overflow-hidden bg-background"
    >

      {/* Slides wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 relative overflow-hidden">

          {/* --- Slide 0: Search --- */}
          <div
            className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
              activeSlide === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
            }`}
          >
            <div className="container mx-auto px-6">
              <div className="max-w-lg xl:max-w-xl">
                <h1 className="font-heading text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-text mb-6 leading-tight">
                  Encuentra el genio que{' '}
                  <span className="text-primary-dark">necesitas.</span>
                </h1>
                <p className="text-lg md:text-xl text-text/70 mb-8 leading-relaxed">
                  Busca por habilidad, oficio o nombre y conecta con alguien de tu ciudad hoy mismo.
                </p>

                {/* Search bar */}
                <div className="flex items-center border border-text/15 bg-white rounded-full px-4 py-3 gap-2 mb-4 focus-within:border-text/30 focus-within:shadow-md transition-all shadow-sm">
                  <Search className="w-5 h-5 text-text/35 flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={displayedPlaceholder || 'Busca un genio...'}
                    className="flex-1 bg-transparent text-base text-text placeholder:text-text/35 outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    className="flex-shrink-0 bg-secondary hover:bg-secondary-dark disabled:opacity-40 disabled:cursor-default text-gray-900 text-sm font-semibold px-5 py-2 rounded-full transition-colors"
                  >
                    Buscar
                  </button>
                </div>

                {/* Popular pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-text/40 self-center mr-1">Popular:</span>
                  {PILLS.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handlePill(pill)}
                      className="border border-text/12 bg-white/80 text-text/55 hover:text-text hover:border-text/25 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- Slide 1: Original CTA --- */}
          <div
            className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
              activeSlide === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
            }`}
          >
            <div className="container mx-auto px-6">
              <div className="max-w-lg xl:max-w-xl">
                <h1 className="font-heading text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-text mb-6 leading-tight">
                  ¡Aquí los genios no salen de las lámparas…{' '}
                  <span className="text-primary-dark">salen de tu ciudad!</span>
                </h1>
                <p className="text-lg md:text-xl text-text/70 mb-10 leading-relaxed">
                  El vecino que enseña, la amiga que diseña, o tú con tu habilidad.{' '}
                  Conecta con personas de tu ciudad listas para ayudarte.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="#ser-genio"
                    className="bg-secondary text-text font-medium px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-md text-center text-lg"
                  >
                    Quiero ser un Genio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel controls */}
        <div className="relative z-20 flex items-center justify-center gap-4 pb-10">
          <button
            onClick={() => goTo((activeSlide + 1) % 2)}
            className="p-2 rounded-full bg-white/60 hover:bg-white/90 border border-text/10 transition-colors text-text/50 hover:text-text"
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
                  ? 'w-6 h-2.5 bg-primary-dark'
                  : 'w-2.5 h-2.5 bg-text/20 hover:bg-text/40'
              }`}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}

          <button
            onClick={() => goTo((activeSlide + 1) % 2)}
            className="p-2 rounded-full bg-white/60 hover:bg-white/90 border border-text/10 transition-colors text-text/50 hover:text-text"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
