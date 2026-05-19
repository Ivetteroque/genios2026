import React from 'react';
import { Sparkles, PenTool as Tool, Check } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <section id="ser-genio" className="py-16 md:py-24 bg-gradient-to-r from-primary-light to-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-4 inline-block bg-white p-4 rounded-full">
            <Tool className="w-8 h-8 text-primary" />
          </div>

          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-700 mb-4">
           ✨ Tu talento también merece ser descubierto
          </h2>

          <p className="text-xl text-gray-700 opacity-90 mb-4">
          Haz visible lo que sabes hacer y conecta con más personas en tu ciudad.
          </p>
          <p className="text-xl text-gray-700 opacity-90 mb-8">
            Pago anual de S/150 soles y tu perfil estará activo durante 1 año.
          </p>

          {/* Benefit badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['Más visibilidad', 'Más oportunidades', 'Clientes reales'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 bg-white/25 border border-white/40 text-gray-800 font-medium px-5 py-2 rounded-full text-sm backdrop-blur-sm"
              >
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
            className="bg-secondary text-gray-800 font-medium px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-lg inline-flex items-center justify-center text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Quiero ser un Genio
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
