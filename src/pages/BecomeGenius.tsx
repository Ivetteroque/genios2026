import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Camera, Gift, LogIn, MessageCircle, ShieldCheck, Sparkles, UserRound, Wallet,
} from 'lucide-react';
import { Section, SectionHeader } from '../components/Section';
import { getCurrentUser } from '../utils/authUtils';
import { getPendingInviteCode, openLogin, savePendingInviteCode } from '../utils/onboardingUtils';

/**
 * Página "Para genios": explica cómo unirse y lleva al formulario de perfil.
 *
 * Acepta un enlace de invitación: /ser-genio?codigo=TACNA2026. El código se
 * guarda en el navegador y se canjea solo cuando el genio termina su perfil,
 * así no tiene que escribirlo.
 */

const SUPPORT_WHATSAPP = '51952719641';

const STEPS = [
  {
    icon: LogIn,
    title: 'Entra con Google',
    text: 'Un toque con tu cuenta de Gmail. Sin contraseñas nuevas.',
  },
  {
    icon: UserRound,
    title: 'Arma tu perfil',
    text: 'Tu foto, a qué te dedicas y en qué zona trabajas. Unos 10 minutos; se guarda solo.',
  },
  {
    icon: Sparkles,
    title: 'Activa tu perfil',
    text: 'Con tu código de invitación apareces en las búsquedas y los clientes te escriben.',
  },
];

const BENEFITS = [
  { icon: MessageCircle, title: 'Te escriben directo', text: 'Los clientes te contactan por WhatsApp. Sin intermediarios.' },
  { icon: Wallet, title: 'Tú pones tus precios', text: 'No cobramos comisión por tus trabajos.' },
  { icon: Camera, title: 'Muestra tu trabajo', text: 'Fotos de lo que haces y reseñas de clientes reales.' },
  { icon: BadgeCheck, title: 'Genera confianza', text: 'Verificamos tu DNI y te damos la insignia de verificado.' },
];

const FAQS = [
  {
    q: '¿Cuánto cuesta?',
    a: 'Durante la beta es gratis con un código de invitación. Más adelante habrá un plan anual y te avisaremos con tiempo, antes de que termine tu acceso.',
  },
  {
    q: '¿Qué necesito?',
    a: 'Una cuenta de Google (Gmail), un celular con WhatsApp y tu DNI. Si tienes fotos de tus trabajos, mejor, pero puedes agregarlas después.',
  },
  {
    q: '¿Cómo me contactan los clientes?',
    a: 'Desde tu perfil tocan "Contactar por WhatsApp" y te llega un mensaje a tu número. Ustedes acuerdan el precio y los detalles.',
  },
  {
    q: '¿Por qué me piden el DNI?',
    a: 'Solo para verificar que eres tú. Nunca se muestra en tu perfil: lo ve únicamente nuestro equipo.',
  },
];

const BecomeGenius: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState<string | null>(getPendingInviteCode());
  const user = getCurrentUser();

  // Guardar el código del enlace de invitación para canjearlo al final.
  useEffect(() => {
    const fromLink = params.get('codigo');
    if (fromLink) {
      savePendingInviteCode(fromLink);
      setInviteCode(getPendingInviteCode());
    }
  }, [params]);

  const start = () => {
    if (user) {
      navigate('/genius-profile');
      return;
    }
    openLogin({
      redirectTo: '/genius-profile',
      title: 'Crea tu perfil de genio',
      subtitle: 'Entra con tu cuenta de Google. Es gratis y toma unos minutos.',
    });
  };

  const ctaLabel = user?.isGenius ? 'Ir a mi panel de genio' : 'Crear mi perfil gratis';
  const supportUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    'Hola, quiero unirme a Genios como genio. ¿Me pueden dar un código de invitación?'
  )}`;

  return (
    <div className="pt-24">
      {/* Portada */}
      <Section tone="rose" className="!pt-10">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-medium uppercase tracking-wide text-ink-rose border border-ink-rose/20 rounded-full px-3 py-1 mb-5">
            Para genios
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text leading-tight mb-4">
            Haz que te encuentren <span className="text-ink-blue">en Tacna</span>
          </h1>
          <p className="text-base md:text-lg text-text/65 mb-8 max-w-xl mx-auto">
            Crea tu perfil gratis y recibe clientes por WhatsApp. Sin comisiones y sin intermediarios.
          </p>

          {inviteCode && !user?.isGenius && (
            <div
              role="status"
              className="flex items-start sm:items-center justify-center gap-2 bg-white border border-green-200 text-green-800 rounded-2xl px-4 py-3 mb-6 text-sm text-left sm:text-center"
            >
              <Gift className="w-5 h-5 shrink-0 text-green-600" />
              <span>
                Tienes una invitación (<strong className="font-mono">{inviteCode}</strong>). Se aplicará sola cuando
                termines tu perfil.
              </span>
            </div>
          )}

          <button
            onClick={start}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-text hover:bg-text/85 text-white font-semibold px-8 py-4 rounded-full transition-colors shadow-sm"
          >
            {ctaLabel}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-text/45 mt-3">Solo necesitas tu cuenta de Google · unos 10 minutos</p>
        </div>
      </Section>

      {/* Cómo funciona */}
      <Section>
        <SectionHeader eyebrow="Cómo funciona" title="Tres pasos y listo" />
        <ol className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto mt-10">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full bg-primary/40 text-ink-blue font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <Icon className="w-5 h-5 text-text/40" aria-hidden="true" />
              </div>
              <h3 className="font-heading font-semibold text-text mb-1">{title}</h3>
              <p className="text-sm text-text/65 leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Beneficios */}
      <Section tone="mint">
        <SectionHeader eyebrow="Por qué Genios" title="Tu trabajo, más visible" tone="mint" />
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto mt-10">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-5">
              <Icon className="w-6 h-6 text-ink-mint shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-text">{title}</h3>
                <p className="text-sm text-text/65">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Beta */}
      <Section>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-5 md:items-center">
          <ShieldCheck className="w-10 h-10 text-ink-blue shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold text-text mb-1">Estamos en beta</h2>
            <p className="text-sm text-text/65">
              Por ahora el acceso es gratis y por invitación, para cuidar la calidad de la comunidad. ¿No tienes
              código? Escríbenos y te ayudamos.
            </p>
          </div>
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Pedir mi código
          </a>
        </div>
      </Section>

      {/* Preguntas */}
      <Section tone="blue">
        <SectionHeader eyebrow="Preguntas" title="Lo que suelen preguntarnos" tone="blue" />
        <div className="max-w-2xl mx-auto mt-10 space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-text">
                {q}
                <span className="text-text/40 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
              </summary>
              <p className="text-sm text-text/65 mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={start}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-text hover:bg-text/85 text-white font-semibold px-8 py-4 rounded-full transition-colors"
          >
            {ctaLabel}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-text/50 mt-4">
            ¿Buscas a alguien?{' '}
            <Link to="/categories" className="text-ink-blue underline underline-offset-4">Ver genios</Link>
          </p>
        </div>
      </Section>
    </div>
  );
};

export default BecomeGenius;
