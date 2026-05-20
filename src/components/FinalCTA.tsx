import React from 'react';
import { Sparkles, Check, DollarSign, Heart } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section id="ser-genio" className="py-14 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-lg">

          {/* Eyebrow */}
          <div className="flex items-center gap-1.5 mb-4">
            <Sparkles className="w-3 h-3 text-secondary-dark" />
            <span className="text-xs font-semibold tracking-widest uppercase text-secondary-dark">
              Haz crecer lo que sabes hacer
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text leading-tight mb-3">
            Tu talento también merece ser{' '}
            <span className="text-secondary-dark">descubierto.</span>
          </h2>

          {/* Subtext */}
          <p className="text-sm text-text/55 mb-5 leading-relaxed max-w-sm">
            Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>

          {/* Pricing callout */}
          <div className="flex items-center gap-2.5 mb-5">
            <DollarSign className="w-3.5 h-3.5 text-secondary-dark flex-shrink-0" />
            <p className="text-sm text-text/60">
              Todo esto por solo{' '}
              <strong className="text-text font-semibold">S/150 al año.</strong>
              {' '}Menos de S/0.50 al día.
            </p>
          </div>

          {/* Benefit pills */}
          <div className="flex flex-wrap gap-2 mb-7">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 border border-gray-200 bg-white text-text/60 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                <Check className="w-3 h-3 text-secondary-dark flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-gray-900 font-semibold px-7 py-3 rounded-full transition-all duration-200 text-sm mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Quiero ser un Genio
          </button>

          {/* Social proof */}
          <div className="flex items-start gap-2.5">
            <Heart className="w-3.5 h-3.5 text-secondary-dark flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text/45 leading-snug">
              Personas como tú ya están alcanzando nuevas oportunidades.{' '}
              <span className="text-text/60 font-medium">¿Y tú, qué talento quieres compartir?</span>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
