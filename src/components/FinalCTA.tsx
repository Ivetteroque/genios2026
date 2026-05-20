import React from 'react';
import { Sparkles, Check, DollarSign, Heart } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section
      id="ser-genio"
      className="relative overflow-hidden flex items-stretch"
      style={{ minHeight: '680px', backgroundColor: '#fdf7ee' }}
    >
      {/* Left content column */}
      <div className="relative z-10 flex items-center w-full md:w-1/2 px-10 md:pl-16 md:pr-10 py-20">
        <div className="w-full max-w-lg">

          {/* Eyebrow label */}
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-secondary-dark" />
            <span className="text-xs font-semibold tracking-widest uppercase text-secondary-dark">
              Haz crecer lo que sabes hacer
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Tu talento<br />también merece<br />ser{' '}
            <span style={{ color: '#E8806A' }}>descubierto.</span>
          </h2>

          {/* Subtext */}
          <p className="text-base md:text-lg text-gray-600 mb-7 leading-relaxed">
            Haz visible lo que sabes hacer y conecta<br className="hidden md:block" />
            con más personas en tu ciudad.
          </p>

          {/* Pricing callout */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-7"
            style={{ backgroundColor: 'rgba(232,128,106,0.10)' }}
          >
            <span
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
              style={{ backgroundColor: 'rgba(232,128,106,0.18)' }}
            >
              <DollarSign className="w-4 h-4" style={{ color: '#E8806A' }} />
            </span>
            <p className="text-sm text-gray-700 leading-snug">
              Todo esto por solo{' '}
              <strong className="text-gray-900">S/150 al año.</strong>
              <br />Menos de S/0.50 al día.
            </p>
          </div>

          {/* Benefit chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-full text-sm shadow-sm"
              >
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E8806A' }} />
                {label}
              </span>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
            className="inline-flex items-center gap-2.5 font-semibold px-9 py-4 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-white text-base mb-8"
            style={{ backgroundColor: '#E8806A' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d96f59')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E8806A')}
          >
            <Sparkles className="w-4 h-4" />
            Quiero ser un Genio
          </button>

          {/* Social proof line */}
          <div className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(232,128,106,0.12)' }}
            >
              <Heart className="w-3.5 h-3.5" style={{ color: '#E8806A' }} />
            </span>
            <p className="text-sm text-gray-500 leading-snug pt-1">
              Personas como tú ya están alcanzando nuevas oportunidades.<br />
              <span className="font-medium text-gray-700">¿Y tú, qué talento quieres compartir?</span>
            </p>
          </div>

        </div>
      </div>

      {/* Right photo column */}
      <div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-[52%] pointer-events-none"
        style={{
          backgroundImage: 'url(/repoyartesano.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Feather left edge */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #fdf7ee 0%, rgba(253,247,238,0.5) 18%, transparent 38%)',
          }}
        />
        {/* Feather top & bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(253,247,238,0.5) 0%, transparent 10%, transparent 90%, rgba(253,247,238,0.5) 100%)',
          }}
        />
      </div>
    </section>
  );
};

export default FinalCTA;
