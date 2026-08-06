import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Section, SectionHeader, Reveal } from './Section';

const ContactForm: React.FC = () => {
  const handleWhatsAppClick = () => {
    const whatsappUrl = 'https://wa.me/51952719641?text=Hola%2C%20vengo%20de%20la%20plataforma%20Genios%20a%20la%20Obra%20y%20tengo%20una%20duda%20que%20me%20gustar%C3%ADa%20resolver.';
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Section id="contacto" tone="rose">
      <SectionHeader
        tone="rose"
        eyebrow="Contacto"
        title="¿Te ayudamos?"
        subtitle="Queremos que te sientas acompañado desde el inicio."
      />

      <Reveal className="max-w-xl mx-auto text-center">
        <button
          onClick={handleWhatsAppClick}
          className="inline-flex items-center gap-2.5 bg-secondary hover:bg-secondary-dark text-gray-900 font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-[0.95rem]"
        >
          <MessageCircle className="w-4 h-4 flex-shrink-0" />
          Hablemos por WhatsApp
        </button>

        <p className="mt-4 text-sm text-text/60">
          Normalmente respondemos en pocos minutos.
        </p>
      </Reveal>
    </Section>
  );
};

export default ContactForm;
