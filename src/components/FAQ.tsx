import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

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
    <section id="faq" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Todo claro desde el inicio
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            Lo importante, explicado de manera simple.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => {
            const isOpen = openItem === faq.id;
            return (
              <div key={faq.id}>
                <button
                  className="w-full text-left py-4 flex justify-between items-center gap-4 group focus:outline-none"
                  onClick={() => setOpenItem(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-gray-800 text-[0.95rem] leading-snug group-hover:text-primary transition-colors duration-150">
                    {faq.question}
                  </span>
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors duration-150">
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
                  <p className="text-sm text-gray-500 leading-relaxed pb-4 pr-8">
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
            className="text-sm text-primary font-medium hover:underline transition-colors"
          >
            Tengo otra duda →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
