import React from 'react';
import { Search, MessageCircle, Handshake } from 'lucide-react';
import { Section, SectionHeader, Reveal } from './Section';

const steps = [
  {
    icon: Search,
    title: 'Busca',
    description: 'Encuentra personas cerca de ti',
    circle: 'bg-surface-blue',
    iconColor: 'text-ink-blue',
  },
  {
    icon: MessageCircle,
    title: 'Conversa',
    description: 'Habla directo con el genio',
    circle: 'bg-surface-mint',
    iconColor: 'text-ink-mint',
  },
  {
    icon: Handshake,
    title: 'Coordinen',
    description: 'Y listo, manos a la obra',
    circle: 'bg-surface-rose',
    iconColor: 'text-ink-rose',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <Section id="como-funciona" tone="paper">
      <SectionHeader
        eyebrow="Cómo funciona"
        title="Tu ciudad está llena de personas increíbles"
        subtitle="Y aquí puedes encontrarlas fácilmente."
      />

      {/* Steps row */}
      <Reveal>
        <div className="relative flex items-start justify-center max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                {/* Step */}
                <div className="flex flex-col items-center text-center w-32 sm:w-36">
                  {/* Icon circle */}
                  <div
                    className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm ${step.circle}`}
                  >
                    <Icon className={`w-6 h-6 ${step.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <p className="font-heading font-semibold text-sm text-text mb-1">{step.title}</p>
                  <p className="text-xs text-text/60 leading-relaxed">{step.description}</p>
                </div>

                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-gray-200 to-primary/30 mt-7 mx-1" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
};

export default HowItWorks;
