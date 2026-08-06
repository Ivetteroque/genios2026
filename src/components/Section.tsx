import React from 'react';
import useReveal from '../hooks/useReveal';

export type SectionTone = 'paper' | 'blue' | 'mint' | 'rose';

/* Cada banda se desvanece en sus bordes: el color entra y sale con un
   degradado en lugar de cortar en seco contra la sección vecina. */
const TONE_BG: Record<SectionTone, string> = {
  paper: '',
  blue: 'bg-[linear-gradient(to_bottom,transparent_0%,#F1F6FF_18%,#F1F6FF_82%,transparent_100%)]',
  mint: 'bg-[linear-gradient(to_bottom,transparent_0%,#EDFAF9_18%,#EDFAF9_82%,transparent_100%)]',
  rose: 'bg-[linear-gradient(to_bottom,transparent_0%,#FFF4F2_18%,#FFF4F2_82%,transparent_100%)]',
};

const TONE_EYEBROW: Record<SectionTone, string> = {
  paper: 'text-text/60 border-gray-200',
  blue: 'text-ink-blue border-ink-blue/20',
  mint: 'text-ink-mint border-ink-mint/20',
  rose: 'text-ink-rose border-ink-rose/20',
};

interface SectionProps {
  id?: string;
  tone?: SectionTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * Banda de sección. El color identifica la sección sin bordes duros: entra y
 * sale con un degradado sobre el fondo papel de la página.
 */
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
      <span
        className={`inline-flex items-center rounded-full border bg-white/70 px-3.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] mb-4 ${TONE_EYEBROW[tone]}`}
      >
        {eyebrow}
      </span>
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base text-text/60 max-w-xl mx-auto">{subtitle}</p>
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
