import React from 'react';
import { Sparkles, PenTool as Tool, Key, ClipboardCheck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const FinalCTA: React.FC = () => {
  return (
    <section id="ser-genio" className="py-16 md:py-24 bg-gradient-to-r from-primary-light to-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-4 inline-block bg-white p-4 rounded-full">
            <Tool className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-700 mb-4">
            ¿Quieres ser un Genio?
          </h2>
        
          <p className="text-xl text-gray-700 opacity-90 mb-8">
          Por un único pago de S/150 soles al año y 3 pasos sencillos tendrás 365 días de visibilidad y oportunidades 
          </p>
          <p className="text-xl text-gray-700 opacity-90 mb-8">
            Por menos de S/0.50 céntimos al día 🤯
          </p>
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 mb-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-800 font-medium text-lg">
               Regístrate
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-800 font-medium text-lg">
                Elige tu rol
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-800 font-medium text-lg">
                Completa tu perfil
              </p>
            </div>
            
            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-800 font-medium text-lg">
                Activa tu cuenta
              </p>
            </div>
          </div>
          
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
            className="bg-secondary text-gray-800 font-medium px-8 py-4 rounded-full hover:bg-secondary-dark transition-colors shadow-lg inline-flex items-center justify-center text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Quiero ser un Genio
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;