import React from 'react';
import useReveal from '../hooks/useReveal';

/**
 * Tonos de sección:
 * - paper: el fondo crema de la página.
 * - blue: un celeste muy suave para alternar con el crema.
 * - deep: azul profundo, para cierres y llamados importantes (texto blanco).
 */
export type SectionTone = 'paper' | 'blue' | 'deep';

/* Fondos sólidos: cada sección se lee como un bloque claro, sin degradados. */
const TONE_BG: Record<SectionTone, string> = {
  paper: '',
  blue: 'bg-surface-blue',
  deep: 'bg-brand-deep text-white',
};

const TONE_EYEBROW: Record<SectionTone, string> = {
  paper: 'text-brand',
  blue: 'text-brand',
  deep: 'text-primary',
};

const TONE_TITLE: Record<SectionTone, string> = {
  paper: 'text-text',
  blue: 'text-text',
  deep: 'text-white',
};

const TONE_SUBTITLE: Record<SectionTone, string> = {
  paper: 'text-text/75',
  blue: 'text-text/75',
  deep: 'text-white/75',
};

interface SectionProps {
  id?: string;
  tone?: SectionTone;
  children: React.ReactNode;
  className?: string;
}

/** Banda de sección con fondo sólido. */
export const Section: React.FC<SectionProps> = ({
  id,
  tone = 'paper',
  children,
  className = '',
}) => (
  <section
    id={id}
    className={`relative py-16 md:py-24 ${TONE_BG[tone]} ${className}`}
  >
    <div className="container mx-auto px-4">{children}</div>
  </section>
);

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: SectionTone;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  tone = 'paper',
  className = '',
}) => {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={`reveal text-center mb-10 md:mb-12 ${className}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] mb-3 ${TONE_EYEBROW[tone]}`}>
        {eyebrow}
      </p>
      <h2 className={`font-heading text-3xl md:text-4xl font-semibold mb-3 ${TONE_TITLE[tone]}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base max-w-xl mx-auto ${TONE_SUBTITLE[tone]}`}>{subtitle}</p>
      )}
    </div>
  );
};

/** Envuelve contenido para que aparezca al entrar en pantalla. */
export const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
};

export default Section;
