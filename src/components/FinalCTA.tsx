import React from 'react';
import { Sparkles, Check } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section id="ser-genio" className="relative overflow-hidden min-h-[580px] flex items-center">

      {/* Full-bleed background image — warm, vivid, high-contrast */}
      <img
        src="/repoyartesano.png"
        alt="Genios artesanos"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ filter: 'saturate(1.12) contrast(1.06) brightness(1.02)' }}
      />

      {/* Narrow left-side overlay ONLY behind the text — right side stays clean */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(253,248,240,0.78) 0%, rgba(253,248,240,0.60) 28%, rgba(253,248,240,0.18) 48%, transparent 62%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full container mx-auto px-8 md:px-16 py-20">
        <div className="max-w-lg">

          <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Tu talento también<br />merece ser descubierto
          </h2>

          <p className="text-base md:text-lg text-gray-700 mb-2 leading-relaxed">
            Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>
          <p className="text-sm text-gray-600 mb-8">
            Todo esto por solo <strong className="text-gray-800">S/150 al año</strong>. Menos de S/0.50 al día.
          </p>

          {/* Benefit badges */}
          <div className="flex flex-wrap gap-3 mb-10">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 bg-white/70 border border-white/80 text-gray-800 font-medium px-4 py-2 rounded-full text-sm backdrop-blur-sm shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
            className="bg-secondary text-gray-900 font-semibold px-9 py-4 rounded-full hover:bg-secondary-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2 text-base"
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
