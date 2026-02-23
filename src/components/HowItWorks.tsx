import React from 'react';
import { Search, UserCheck, MessageSquare, Check } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 1,
      icon: <Search className="text-primary w-12 h-12 mb-4" />,
      title: "Elige la categoría",
      description: "Busca entre todas nuestras categorías de servicios disponibles."
    },
    {
      id: 2,
      icon: <UserCheck className="text-primary w-12 h-12 mb-4" />,
      title: "Encuentra tu genio",
      description: "Examina perfiles, calificaciones y encuentra el profesional perfecto."
    },
    {
      id: 3,
      icon: <MessageSquare className="text-primary w-12 h-12 mb-4" />,
      title: "Conversa directo",
      description: "Contacta, negocia y coordina directamente con tu genio elegido."
    },
    {
      id: 4,
      icon: <Check className="text-primary w-12 h-12 mb-4" />,
      title: "¡Problema resuelto!",
      description: "Tu servicio se completa y puedes calificar tu experiencia."
    }
  ];

  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            🪄 Tu problema + un genio local = ¡Solucionado!
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Conectarte con el talento local nunca fue tan sencillo. Estos son los pasos para resolver tu problema:
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="flex justify-center mb-2">
                {step.icon}
              </div>
              <h3 className="font-heading font-bold text-xl mb-2 text-gray-800">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a 
            href="#categorias" 
            className="inline-block bg-primary text-white font-medium px-6 py-3 rounded-full hover:bg-primary-dark transition-colors shadow-md"
          >
            Explorar las categorías
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;