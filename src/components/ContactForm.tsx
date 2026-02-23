import React from 'react';
import { MessageSquare } from 'lucide-react';

const ContactForm: React.FC = () => {
  const handleWhatsAppClick = () => {
    const whatsappUrl = 'https://wa.me/51952719641?text=Hola%20👋%2C%20vengo%20de%20la%20plataforma%20Genios%20a%20la%20Obra%20y%20tengo%20una%20duda%20que%20me%20gustar%C3%ADa%20resolver%20🙂';
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="contacto" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              📩 ¿Tienes una duda o propuesta? Escríbenos
            </h2>
            <p className="text-lg text-gray-600">
              Estamos aquí para ayudarte con cualquier consulta que tengas sobre nuestra plataforma.
            </p>
          </div>
          
          {/* WhatsApp Block */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <div className="text-center space-y-6">
              {/* WhatsApp Button */}
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3 text-lg"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                <MessageSquare className="w-6 h-6" />
                <span>Hablemos ahora</span>
              </button>

              {/* Phone Number */}
              <div className="text-center">
                <p className="text-gray-700 font-medium text-lg">
                  📞 51952719641
                </p>
              </div>

              {/* Fun Line */}
              <div className="text-center">
                <p className="text-gray-600 font-medium">
                  ✨ Prometemos responder más rápido que un rayo ⚡
                </p>
              </div>

              {/* Legal Notice */}
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  Al contactarnos por WhatsApp aceptas recibir respuesta por ese medio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;