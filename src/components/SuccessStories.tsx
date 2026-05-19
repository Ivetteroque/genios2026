import React from 'react';
import { ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Maribel Rodríguez',
    service: 'Estilista',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    quote: 'Ahora tengo agenda completa todos los días. Nunca imaginé que fuera tan fácil.',
  },
  {
    id: 2,
    name: 'Pedro Gutiérrez',
    service: 'Técnico',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    quote: 'Un cliente de emergencia se convirtió en mi mejor referido. Eso no tiene precio.',
  },
  {
    id: 3,
    name: 'Carolina Mendoza',
    service: 'Organizadora de eventos',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    quote: 'Descubrí un nicho que cambió mi negocio por completo. Me siento libre.',
  },
];

const SuccessStories: React.FC = () => {
  return (
    <section id="historias" className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-3">
            Historias reales de tu ciudad
          </h2>
          <p className="text-base text-text/55 max-w-md mx-auto">
            Cada genio tiene una historia que merece ser contada.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-7 flex flex-col gap-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <p className="font-heading font-semibold text-sm text-text leading-tight">{t.name}</p>
                  <p className="text-xs text-text/40 mt-0.5">{t.service}</p>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm text-text/65 italic leading-relaxed flex-1">
                "{t.quote}"
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#leer-mas"
            className="inline-flex items-center gap-1.5 text-sm text-text/40 hover:text-primary transition-colors duration-200"
          >
            Ver más historias
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
