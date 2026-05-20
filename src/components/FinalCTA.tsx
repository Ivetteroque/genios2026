import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDERS = ['albañil', 'maquilladora', 'DJ', 'gasfitero', 'electricista', 'payaso'];

const FinalCTA: React.FC = () => {
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

  const PILLS = ['Maquilladora', 'Albañil', 'DJ', 'Payaso', 'Electricista', 'Gasfitero'];

  return (
    <section id="ser-genio" className="py-14 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-xl">

          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text leading-tight mb-6">
            Encuentra el genio que{' '}
            <span className="text-secondary-dark">necesitas.</span>
          </h2>

          {/* Search input */}
          <div className="flex items-center border border-text/15 bg-white rounded-full px-4 py-2.5 gap-2 mb-4 focus-within:border-text/30 transition-colors">
            <Search className="w-4 h-4 text-text/35 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayedPlaceholder}
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text/35 outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="flex-shrink-0 bg-secondary hover:bg-secondary-dark disabled:opacity-40 disabled:cursor-default text-gray-900 text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Buscar
            </button>
          </div>

          {/* Popular pills */}
          <div className="flex flex-wrap gap-1.5">
            {PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => handlePill(pill)}
                className="border border-text/12 bg-white text-text/55 hover:text-text hover:border-text/25 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
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

export default FinalCTA;
