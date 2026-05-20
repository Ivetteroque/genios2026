import React from 'react';
import { Sparkles, Check } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section
      id="ser-genio"
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: '640px',
        backgroundImage: 'url(/repoyartesano.png)',
        backgroundSize: '68% auto',
        backgroundPosition: '100% center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#fdf7ee',
      }}
    >
      {/* Feather the photo edges — top, bottom, and the left seam */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right,  #fdf7ee 0%, #fdf7ee 32%, rgba(253,247,238,0.55) 42%, rgba(253,247,238,0.08) 50%, transparent 58%),
            linear-gradient(to bottom, rgba(253,247,238,0.55) 0%, transparent 12%, transparent 88%, rgba(253,247,238,0.55) 100%),
            linear-gradient(to left,   rgba(253,247,238,0.30) 0%, transparent 8%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-8 md:px-14 py-28">
        <div style={{ maxWidth: '36%' }} className="min-w-[280px]">

          <h2 className="font-heading text-3xl md:text-[2.6rem] font-bold text-gray-900 mb-5 leading-tight">
            Tu talento también<br />merece ser descubierto
          </h2>

          <p className="text-sm md:text-base text-gray-700 mb-2 leading-relaxed">
            Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>
          <p className="text-xs md:text-sm text-gray-600 mb-8">
            Todo esto por solo <strong className="text-gray-800">S/150 al año</strong>. Menos de S/0.50 al día.
          </p>

          <div className="flex flex-wrap gap-2 mb-10">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white/90 border border-white text-gray-800 font-medium px-3 py-1.5 rounded-full text-xs shadow-sm"
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
