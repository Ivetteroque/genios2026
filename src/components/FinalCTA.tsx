import React from 'react';
import { Sparkles, Check } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section
      id="ser-genio"
      className="relative overflow-hidden min-h-[580px] flex items-center"
    >
      {/* Full-bleed image — shifted right so faces land in the right 60% */}
      <img
        src="/repoyartesano.png"
        alt="Genios artesanos"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: '65% center',
          filter: 'saturate(1.15) contrast(1.08) brightness(1.03)',
        }}
      />

      {/* Left-only overlay: opaque cream behind text, gone by 42% */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(253,247,238,0.92) 0%, rgba(253,247,238,0.80) 22%, rgba(253,247,238,0.45) 36%, rgba(253,247,238,0.08) 46%, transparent 54%)',
        }}
      />

      {/* Content pinned to the left 38% */}
      <div className="relative z-10 w-full px-8 md:px-14 py-20">
        <div style={{ maxWidth: '38%' }} className="min-w-[280px]">

          <h2 className="font-heading text-3xl md:text-[2.6rem] font-bold text-gray-900 mb-4 leading-tight">
            Tu talento también<br />merece ser descubierto
          </h2>

          <p className="text-sm md:text-base text-gray-700 mb-1.5 leading-relaxed">
            Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>
          <p className="text-xs md:text-sm text-gray-600 mb-7">
            Todo esto por solo <strong className="text-gray-800">S/150 al año</strong>. Menos de S/0.50 al día.
          </p>

          {/* Benefit badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white/80 border border-white/90 text-gray-800 font-medium px-3 py-1.5 rounded-full text-xs backdrop-blur-sm shadow-sm"
              >
                <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
            className="bg-secondary text-gray-900 font-semibold px-7 py-3.5 rounded-full hover:bg-secondary-dark transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2 text-sm md:text-base"
          >
            <Sparkles className="w-4 h-4" />
            Quiero ser un Genio
          </button>

        </div>
      </div>

    </section>
  );
};

export default FinalCTA;
