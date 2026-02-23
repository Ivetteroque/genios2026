import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ¿Esto es muy bueno para ser verdad? ¡Te lo explicamos!
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Respondemos a las dudas más frecuentes sobre cómo funciona Genios.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                className="w-full text-left p-4 flex justify-between items-center focus:outline-none"
                onClick={() => toggleItem(faq.id)}
                aria-expanded={openItem === faq.id}
              >
                <span className="font-heading font-bold text-lg text-gray-800">{faq.question}</span>
                {openItem === faq.id ? (
                  <ChevronUp className="text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-primary flex-shrink-0" />
                )}
              </button>
              
              <div 
                className={`px-4 pb-4 transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${
                  openItem === faq.id 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <a 
            href="#contacto" 
            className="inline-block text-primary font-medium hover:underline transition-colors"
          >
            Tengo otra duda →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;