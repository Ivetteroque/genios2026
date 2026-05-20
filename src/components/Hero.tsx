import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDERS = ['albañil', 'maquilladora', 'DJ', 'gasfitero', 'electricista', 'payaso'];
const PILLS = ['Maquilladora', 'Albañil', 'DJ', 'Payaso', 'Electricista', 'Gasfitero'];

const Hero: React.FC = () => {
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const current = PLACEHOLDERS[placeholderIndex];

    if (!isDeleting && displayedPlaceholder.length < current.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length + 1));
      }, 80);
    } else if (!isDeleting && displayedPlaceholder.length === current.length) {
      timeoutRef.current = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayedPlaceholder.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length - 1));
      }, 45);
    } else if (isDeleting && displayedPlaceholder.length === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayedPlaceholder, isDeleting, placeholderIndex]);

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
      className="relative min-h-screen flex items-center bg-background overflow-hidden"
    >
      {/* Right-side image with soft gradient fade */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[58%] pointer-events-none select-none">
        <img
          src="/genios.png"
          alt="Genios locales de tu ciudad"
          className="w-full h-full object-cover object-left"
          style={{ filter: 'drop-shadow(-8px 0 32px rgba(0,0,0,0.08))' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #FDFDFD 0%, #FDFDFD 12%, rgba(253,253,253,0.85) 30%, rgba(253,253,253,0.4) 50%, rgba(253,253,253,0.0) 72%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(253,253,253,0.55) 0%, transparent 18%, transparent 82%, rgba(253,253,253,0.55) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 py-24 z-10">
        <div className="max-w-lg xl:max-w-xl">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-text mb-6 leading-tight">
            ¡Aquí los genios no salen de las lámparas…{' '}
            <span className="text-primary-dark">salen de tu ciudad!</span>
          </h1>
          <p className="text-lg md:text-xl text-text/70 mb-8 leading-relaxed">
            El vecino que enseña, la amiga que diseña, o tú con tu habilidad.{' '}
            Conecta con personas de tu ciudad listas para ayudarte.
          </p>

          {/* Search bar */}
          <div className="flex items-center border border-text/15 bg-white rounded-full px-4 py-3 gap-2 mb-4 focus-within:border-text/30 focus-within:shadow-md transition-all shadow-sm">
            <Search className="w-5 h-5 text-text/35 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayedPlaceholder}
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
    </section>
  );
};

export default Hero;
