import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
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
          <p className="text-lg md:text-xl text-text/70 mb-10 leading-relaxed">
            El vecino que enseña, la amiga que diseña, o tú con tu habilidad.{' '}
            Conecta con personas de tu ciudad listas para ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#ser-genio"
              className="bg-secondary text-text font-medium px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-md text-center text-lg"
            >
              Quiero ser un Genio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
