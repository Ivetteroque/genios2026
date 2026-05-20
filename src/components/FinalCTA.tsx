import React from 'react';
import { Sparkles, Check, DollarSign, Heart } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section id="ser-genio" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-3 h-3 text-secondary-dark" />
            <span className="text-xs font-semibold tracking-widest uppercase text-secondary-dark">
              Haz crecer lo que sabes hacer
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-text leading-tight mb-5">
            Tu talento también merece ser{' '}
            <span className="text-secondary-dark">descubierto.</span>
          </h2>

          {/* Subtext */}
          <p className="text-base text-text/60 mb-8 leading-relaxed">
            Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>

          {/* Pricing callout */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3.5 mb-8 shadow-sm">
            <span className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-secondary-dark" />
            </span>
            <p className="text-sm text-text/70 text-left leading-snug">
              Todo esto por solo{' '}
              <strong className="text-text">S/150 al año.</strong>
              {' '}Menos de S/0.50 al día.
            </p>
          </div>

          {/* Benefit chips */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-9">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-text/70 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-secondary-dark flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA button */}
          <div className="mb-8">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
              className="inline-flex items-center gap-2.5 bg-secondary hover:bg-secondary-dark text-gray-900 font-semibold px-10 py-4 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-base"
            >
              <Sparkles className="w-4 h-4" />
              Quiero ser un Genio
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-start justify-center gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center mt-0.5">
              <Heart className="w-3.5 h-3.5 text-secondary-dark" />
            </span>
            <p className="text-sm text-text/50 text-left leading-snug pt-1">
              Personas como tú ya están alcanzando nuevas oportunidades.<br />
              <span className="font-medium text-text/70">¿Y tú, qué talento quieres compartir?</span>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
