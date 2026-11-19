import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, MessageCircle, PartyPopper, Sparkles, Tag } from 'lucide-react';
import { getMembership, isMembershipActive, redeemBetaCode } from '../services/membershipService';
import { clearPendingInviteCode, getPendingInviteCode, normalizeInviteCode } from '../utils/onboardingUtils';

/**
 * Pantalla final del formulario del genio. Responde la única pregunta que
 * importa en ese momento: "¿ya me pueden encontrar?".
 *
 * - Si ya tiene acceso vigente → "¡Listo, ya apareces!".
 * - Si llegó con un enlace de invitación → canjea el código solo.
 * - Si no → le pide el código ahí mismo (o pedirlo por WhatsApp).
 */

const SUPPORT_WHATSAPP = '51952719641';

interface MissingField { field: string; step: number; required: boolean }

interface WizardSuccessProps {
  geniusProfileId: string;
  missingFields: MissingField[];
  onGoToPanel: () => void;
}

type State =
  | { kind: 'checking' }
  | { kind: 'visible'; endsAt?: string }
  | { kind: 'needs_code'; error?: string };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

const WizardSuccess: React.FC<WizardSuccessProps> = ({ geniusProfileId, missingFields, onGoToPanel }) => {
  const [state, setState] = useState<State>({ kind: 'checking' });
  const [code, setCode] = useState(getPendingInviteCode() ?? '');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const membership = await getMembership(geniusProfileId);
      if (!active) return;
      if (isMembershipActive(membership)) {
        setState({ kind: 'visible', endsAt: membership.ends_at });
        return;
      }

      const pending = getPendingInviteCode();
      if (!pending) {
        setState({ kind: 'needs_code' });
        return;
      }

      // Venía con enlace de invitación: se canjea sin que tenga que escribir nada.
      const result = await redeemBetaCode(pending);
      if (!active) return;
      clearPendingInviteCode();
      if (result.ok) setState({ kind: 'visible', endsAt: result.endsAt });
      else setState({ kind: 'needs_code', error: result.message });
    })();
    return () => { active = false; };
  }, [geniusProfileId]);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = normalizeInviteCode(code);
    if (!trimmed || redeeming) return;
    setRedeeming(true);
    const result = await redeemBetaCode(trimmed);
    setRedeeming(false);
    if (result.ok) {
      clearPendingInviteCode();
      setState({ kind: 'visible', endsAt: result.endsAt });
    } else {
      setState({ kind: 'needs_code', error: result.message });
    }
  };

  const optional = missingFields.filter((f) => !f.required);
  const supportUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    'Hola, ya creé mi perfil de genio en Genios y necesito un código de invitación para activarlo.'
  )}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 max-w-xl mx-auto">
      {state.kind === 'checking' && (
        <div className="flex flex-col items-center py-10 text-center" role="status">
          <Loader2 className="w-8 h-8 text-ink-blue animate-spin mb-3" />
          <p className="text-sm text-text/65">Guardamos tu perfil. Revisando tu acceso…</p>
        </div>
      )}

      {state.kind === 'visible' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/35 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-ink-blue" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-text mb-2">¡Listo! Ya apareces en las búsquedas</h2>
          <p className="text-text/65 mb-6">
            Los clientes de tu zona ya pueden encontrarte y escribirte por WhatsApp
            {state.endsAt ? `. Tu acceso está activo hasta el ${fmtDate(state.endsAt)}.` : '.'}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/profile/${geniusProfileId}`}
              className="w-full py-3 rounded-xl bg-ink-blue hover:bg-[#355f9c] text-white font-semibold transition-colors"
            >
              Ver mi perfil como lo ven los clientes
            </Link>
            <button
              onClick={onGoToPanel}
              className="w-full py-3 rounded-xl border border-gray-200 hover:bg-surface-blue text-text/80 font-medium transition-colors"
            >
              Ir a mi panel
            </button>
          </div>
        </div>
      )}

      {state.kind === 'needs_code' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/25 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-ink-blue" />
            </div>
            <h2 className="font-heading text-2xl font-semibold text-text mb-2">Tu perfil está guardado</h2>
            <p className="text-text/65">
              Último paso: actívalo con tu código de invitación para aparecer en las búsquedas.
            </p>
          </div>

          <form onSubmit={redeem} className="bg-blue-50/60 border border-primary/40 rounded-xl p-4">
            <label htmlFor="invite-code" className="flex items-center gap-2 text-sm font-semibold text-text mb-2">
              <Tag className="w-4 h-4 text-ink-blue" />
              Código de invitación
            </label>
            <div className="flex gap-2">
              <input
                id="invite-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. TACNA2026"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={30}
                className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-3 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={redeeming || !code.trim()}
                className="bg-ink-blue hover:bg-[#355f9c] disabled:bg-gray-300 text-white font-medium px-5 rounded-lg text-sm transition-colors flex items-center"
              >
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar'}
              </button>
            </div>
            {state.error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-red-600 mt-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {state.error}
              </p>
            )}
          </form>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              No tengo código: pedirlo
            </a>
            <button
              onClick={onGoToPanel}
              className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-surface-blue text-text/80 text-sm font-medium transition-colors"
            >
              Hacerlo después
            </button>
          </div>
        </div>
      )}

      {state.kind !== 'checking' && optional.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="flex items-center gap-2 text-sm font-semibold text-text mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Para recibir más consultas, agrega:
          </p>
          <ul className="text-sm text-text/65 list-disc pl-6 space-y-1">
            {optional.slice(0, 4).map((f) => <li key={f.field}>{f.field}</li>)}
          </ul>
          <p className="text-xs text-gray-400 mt-2">Puedes hacerlo cuando quieras desde tu panel.</p>
        </div>
      )}
    </div>
  );
};

export default WizardSuccess;
