import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Section, SectionHeader, Reveal } from './Section';

const FAQ: React.FC = () => {
  const faqs = [
    {
      id: 1,
      question: "¿Cómo contrato un servicio?",
      answer: "Es sencillo: busca la categoría que necesitas, explora los perfiles de los genios disponibles, y contacta directamente al que mejor se adapte a tus necesidades. Puedes conversar, acordar precios y coordinar todos los detalles directamente."
    },
    {
      id: 2,
      question: "¿Es seguro?",
      answer: "Sí, todos los genios pasan por un proceso de verificación. Además, el sistema de calificaciones y reseñas te permite conocer las experiencias previas de otros clientes. Recomendamos siempre revisar estos comentarios antes de contratar."
    },
    {
      id: 3,
      question: "¿Cobran comisión?",
      answer: "Buscar servicios es gratis. Si eres genio, activa tu visibilidad con un único plan anual de S/150 soles (¡menos de S/0.50 al día!)"
    },
    {
      id: 4,
      question: "¿Puedo calificar al genio?",
      answer: "¡Claro! Una vez completado el servicio, puedes y debes dejar tu calificación y comentario. Esto ayuda a mantener la calidad de nuestra comunidad y orienta a futuros clientes."
    }
  ];

  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <Section id="faq" tone="paper">
      <SectionHeader
        eyebrow="Preguntas"
        title="Todo claro desde el inicio"
        subtitle="Lo importante, explicado de manera simple."
      />

      <Reveal>
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => {
            const isOpen = openItem === faq.id;
            return (
              <div key={faq.id}>
                <button
                  className="w-full text-left py-4 flex justify-between items-center gap-4 group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/40"
                  onClick={() => setOpenItem(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-text text-[0.95rem] leading-snug group-hover:text-ink-blue transition-colors duration-150">
                    {faq.question}
                  </span>
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
                      isOpen
                        ? 'bg-surface-blue text-ink-blue'
                        : 'bg-gray-100 text-text/50 group-hover:bg-surface-blue group-hover:text-ink-blue'
                    }`}
                  >
                    {isOpen
                      ? <Minus className="w-3.5 h-3.5" />
                      : <Plus className="w-3.5 h-3.5" />
                    }
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                    isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-sm text-text/70 leading-relaxed pb-4 pr-8">
                    {faq.answer}
                  </p>
                </div>

                {i < faqs.length - 1 && (
                  <div className="border-t border-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a
            href="#contacto"
            className="text-sm text-ink-blue font-medium hover:underline underline-offset-4 transition-colors"
          >
            Tengo otra duda →
          </a>
        </div>
      </Reveal>
    </Section>
  );
};

export default FAQ;
