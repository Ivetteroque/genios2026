import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center bg-background"
      style={{
        backgroundImage: `
          linear-gradient(
            to right,
            rgba(253, 253, 253, 0.8) 0%,
            rgba(253, 253, 253, 0.8) 100%
          ),
          url(https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }}
    >
      

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center relative backdrop-blur-sm bg-background/40 p-8 md:p-12 rounded-2xl">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-8 leading-tight">
            ¡Aquí los genios no salen de las lámparas… 
            <br className="hidden sm:block" />
            salen de tu ciudad!
          </h1>
          <p className="text-xl md:text-2xl text-text/80 mb-10 leading-relaxed max-w-3xl mx-auto">
          El vecino que enseña, la amiga que diseña, o tú con tu habilidad ✨
            <br className="hidden md:block" />
            Aquí encuentras un lugar para crecer, conectar y encontrar empleo en tu ciudad.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
            <Link 
              to="/categories" 
              className="bg-primary text-text font-medium px-8 py-4 rounded-full hover:bg-primary-dark transition-colors shadow-md text-center text-lg backdrop-blur-sm"
            >
              Buscar un Genio 
            </Link>
            <a 
              href="#ser-genio" 
              className="bg-secondary text-text font-medium px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-md text-center text-lg backdrop-blur-sm"
            >
              ¡Quiero ser parte de los genios!
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;