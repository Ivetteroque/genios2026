import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center bg-background overflow-hidden"
    >
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-0">

          {/* Text column */}
          <div className="flex-1 text-center lg:text-left z-10">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-6 leading-tight">
              ¡Aquí los genios no salen de las lámparas…{' '}
              <br className="hidden sm:block" />
              salen de tu ciudad!
            </h1>
            <p className="text-xl md:text-2xl text-text/70 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              El vecino que enseña, la amiga que diseña, o tú con tu habilidad.{' '}
              Conecta con personas de tu ciudad listas para ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/categories"
                className="bg-primary text-text font-medium px-8 py-4 rounded-full hover:bg-primary-dark transition-colors shadow-md text-center text-lg"
              >
                Buscar un Genio
              </Link>
              <a
                href="#ser-genio"
                className="bg-secondary text-text font-medium px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-md text-center text-lg"
              >
                Quiero ser parte de los genios
              </a>
            </div>
          </div>

          {/* Image column */}
          <div className="flex-1 flex justify-center lg:justify-end relative">
            <img
              src="/genios.png"
              alt="Genios locales de tu ciudad"
              className="w-full max-w-xl lg:max-w-2xl object-contain drop-shadow-xl"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
