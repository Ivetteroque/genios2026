import React from 'react';
import { Search, MessageCircle, Handshake } from 'lucide-react';

const steps = [
  {
    icon: Search,
    emoji: '🔍',
    title: 'Busca',
    description: 'Encuentra personas cerca de ti',
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    title: 'Conversa',
    description: 'Habla directo con el genio',
  },
  {
    icon: Handshake,
    emoji: '🤝',
    title: 'Coordinen',
    description: 'Y listo, manos a la obra',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-3">
            Tu ciudad está llena de personas increíbles
          </h2>
          <p className="text-base text-text/60 max-w-xl mx-auto">
            Y aquí puedes encontrarlas fácilmente.
          </p>
        </div>

        {/* Steps row */}
        <div className="relative flex items-start justify-center max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                {/* Step */}
                <div className="flex flex-col items-center text-center w-36">
                  {/* Icon circle */}
                  <div className="relative z-10 w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-6 h-6 text-text/40" strokeWidth={1.5} />
                  </div>
                  <p className="font-heading font-semibold text-sm text-text mb-1">{step.title}</p>
                  <p className="text-xs text-text/50 leading-relaxed">{step.description}</p>
                </div>

                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gray-200 mt-7 mx-1" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
