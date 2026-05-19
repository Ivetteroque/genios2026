import React from 'react';
import { Sparkles, Check } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section
      id="ser-genio"
      className="relative overflow-hidden bg-gradient-to-r from-primary-light to-primary"
    >
      <div className="flex flex-col md:flex-row min-h-[520px]">

        {/* LEFT — content */}
        <div className="relative z-10 flex flex-col justify-center px-8 md:px-16 py-16 md:py-20 w-full md:w-[58%]">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-4 leading-tight">
            Tu talento también merece<br className="hidden md:block" /> ser descubierto
          </h2>

          <p className="text-base md:text-lg text-gray-700/90 mb-2 max-w-md">
            Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>
          <p className="text-sm text-gray-600/80 mb-8">
            Todo esto por solo <strong>S/150 al año</strong>. Menos de S/0.50 al día.
          </p>

          {/* Benefit badges */}
          <div className="flex flex-wrap gap-3 mb-10">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 bg-white/30 border border-white/50 text-gray-800 font-medium px-4 py-2 rounded-full text-sm backdrop-blur-sm"
              >
                <Check className="w-3.5 h-3.5 text-green-700 flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>

          <div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
              className="bg-secondary text-gray-800 font-semibold px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-lg inline-flex items-center gap-2 text-base"
            >
              <Sparkles className="w-4 h-4" />
              Quiero ser un Genio
            </button>
          </div>
        </div>

        {/* RIGHT — image with left-side gradient overlay */}
        <div className="relative w-full md:w-[42%] min-h-[300px] md:min-h-0 flex-shrink-0">
          {/* fade from section bg into image */}
          <div
            className="absolute inset-y-0 left-0 w-40 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, #B8D4FF, transparent)',
            }}
          />
          <img
            src="/repoyartesano.png"
            alt="Genios artesanos"
            className="w-full h-full object-cover object-center"
          />
        </div>

      </div>
    </section>
  );
};

export default FinalCTA;
