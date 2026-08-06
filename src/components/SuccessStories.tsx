import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Section, SectionHeader, Reveal } from './Section';

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
    <Section id="historias" tone="mint">
      <SectionHeader
        tone="mint"
        eyebrow="Historias"
        title="Historias reales de tu ciudad"
        subtitle="Cada genio tiene una historia que merece ser contada."
      />

      <Reveal>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-7 flex flex-col gap-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
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
                  <p className="text-xs text-ink-mint mt-0.5">{t.service}</p>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm text-text/70 italic leading-relaxed flex-1">
                "{t.quote}"
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#leer-mas"
            className="inline-flex items-center gap-1.5 text-sm text-ink-mint hover:text-text transition-colors duration-200"
          >
            Ver más historias
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </Reveal>
    </Section>
  );
};

export default SuccessStories;
