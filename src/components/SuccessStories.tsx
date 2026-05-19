import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

const SuccessStories: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: "Maribel Rodríguez",
      service: "Estilista profesional",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      quote: "Logré ampliar mi clientela en un 40% gracias a la plataforma. Ahora tengo agenda completa todos los días."
    },
    {
      id: 2,
      name: "Pedro Gutiérrez",
      service: "Técnico en refrigeración",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      quote: "Un cliente me contactó un domingo a las 9 AM por una emergencia. Pude solucionar su problema y me recomendó con sus amigos."
    },
    {
      id: 3,
      name: "Carolina Mendoza",
      service: "Organizadora de eventos",
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      quote: "Encontré un nicho para mis servicios de organización de eventos corporativos que no había explorado antes."
    },
    {
      id: 4,
      name: "Rafael Torres",
      service: "Diseñador gráfico",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      quote: "La plataforma me ayudó a conseguir clientes para proyectos de diseño de logos y branding para negocios locales."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) {
      nextTestimonial();
    } else if (touchStart - touchEnd < -50) {
      prevTestimonial();
    }
  };

  const displayTestimonials = () => {
    return testimonials.map((testimonial, index) => (
      <div 
        key={testimonial.id}
        className={`transition-opacity duration-300 ${
          index === activeIndex ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
        }`}
      >
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <img 
              src={testimonial.image} 
              alt={testimonial.name} 
              className="w-16 h-16 rounded-full object-cover mr-4"
            />
            <div>
              <h3 className="font-heading font-bold text-lg text-gray-800">{testimonial.name}</h3>
              <p className="text-primary text-sm">{testimonial.service}</p>
            </div>
          </div>
          <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
        </div>
      </div>
    ));
  };

  return (
    <section id="historias" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            💬 Gente real. Cambios reales. Historias que inspiran
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Conoce cómo Genios ha transformado la vida de profesionales y clientes en nuestra comunidad.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div 
            className="relative h-[250px] md:h-[200px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {displayTestimonials()}
          </div>
          
          <div className="flex justify-center mt-8 space-x-4">
            <button 
              onClick={prevTestimonial}
              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft className="text-gray-700" />
            </button>
            
            {testimonials.map((_, index) => (
              <button 
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-primary' : 'bg-gray-300'
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver testimonio ${index + 1}`}
              />
            ))}
            
            <button 
              onClick={nextTestimonial}
              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
              aria-label="Siguiente testimonio"
            >
              <ChevronRight className="text-gray-700" />
            </button>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <a 
            href="#leer-mas" 
            className="inline-block bg-primary text-white font-medium px-6 py-3 rounded-full hover:bg-primary-dark transition-colors shadow-md mr-4"
          >
            Leer más historias
          </a>
          <a 
            href="#compartir" 
            className="inline-flex items-center text-primary font-medium hover:underline transition-colors"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Contar mi historia
          </a>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;