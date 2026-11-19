import { useEffect, useState, type FormEvent } from 'react';
import {
  CreditCard, CheckCircle2, MessageCircle, QrCode, Tag, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Building2, Clock, Upload, Sparkles, Ban,
} from 'lucide-react';
import {
  EXPIRING_SOON_DAYS,
  Membership,
  PaymentMethod,
  PaymentRequestSummary,
  PaymentSettings,
  daysUntil,
  getPaymentSettings,
  isMembershipActive,
  redeemBetaCode,
  submitPaymentRequest,
} from '../services/membershipService';
import { clearPendingInviteCode, getPendingInviteCode } from '../utils/onboardingUtils';

const SUPPORT_WHATSAPP = '51952719641';

interface SubscriptionSectionProps {
  geniusEmail: string;
  membership: Membership | null;
  latestRequest: PaymentRequestSummary | null;
  /** Vuelve a cargar membresía y solicitud tras un canje o un envío. */
  onChanged: () => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transfer', label: 'Transferencia' },
];

export default function SubscriptionSection({
  geniusEmail,
  membership,
  latestRequest,
  onChanged,
}: SubscriptionSectionProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    getPaymentSettings().then((data) => {
      setSettings(data);
      setSettingsLoading(false);
    });
  }, []);

  const supportUrl = (text: string) =>
    `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`${text}\nMi correo es: ${geniusEmail}`)}`;

  const active = isMembershipActive(membership);
  const suspended = membership?.status === 'suspended';
  const pending = latestRequest?.status === 'pending';
  const rejected = latestRequest?.status === 'rejected' ? latestRequest : null;
  const paymentsEnabled = !!settings?.payments_enabled;
  const price = settings?.annual_price ?? 150;

  const header = (
    <div className="mb-6 flex items-center gap-3">
      <CreditCard className="w-6 h-6 text-blue-600" />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Suscripción</h2>
    </div>
  );

  // ─── Suspendida ─────────────────────────────────────────────────────────────
  if (suspended) {
    return (
      <div className="max-w-2xl">
        {header}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 sm:p-8 flex gap-4">
          <div className="p-3 rounded-xl bg-red-50 shrink-0 h-fit">
            <Ban className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Tu membresía está suspendida</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mientras esté suspendida, tu perfil no aparece en las búsquedas. Escríbenos y lo revisamos contigo.
            </p>
            <a
              href={supportUrl('Hola, mi membresía de Genios aparece suspendida y quisiera revisarla.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Activa ─────────────────────────────────────────────────────────────────
  if (active && membership) {
    const days = daysUntil(membership.ends_at);
    const isBeta = membership.type === 'beta';
    const expiringSoon = days <= EXPIRING_SOON_DAYS;

    return (
      <div className="max-w-2xl space-y-4">
        {header}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <div className={`p-3 rounded-xl shrink-0 ${isBeta ? 'bg-blue-50' : 'bg-green-50'}`}>
              {isBeta ? <Sparkles className="w-8 h-8 text-blue-500" /> : <CheckCircle2 className="w-8 h-8 text-green-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                expiringSoon ? 'text-amber-700 bg-amber-50' : 'text-green-600 bg-green-50'
              }`}>
                {expiringSoon ? 'Por vencer' : 'Activa'}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-1">
                {isBeta ? 'Acceso beta' : `Plan anual · S/${price}`}
              </h3>
              <p className="text-sm text-gray-600">
                Tu perfil es visible en las búsquedas. Te quedan{' '}
                <span className="font-semibold text-blue-600">{days} {days === 1 ? 'día' : 'días'}</span>{' '}
                (hasta el {fmtDate(membership.ends_at)}).
              </p>
              {isBeta && (
                <p className="text-xs text-gray-400 mt-3">
                  Gracias por ser parte de la beta. Te avisaremos antes de que termine.
                </p>
              )}
            </div>
          </div>
        </div>

        {pending && <PendingNotice />}
        {!pending && paymentsEnabled && (isBeta || expiringSoon) && (
          <PaymentCard
            settings={settings!}
            price={price}
            title={isBeta ? 'Asegura tu lugar con el plan anual' : 'Renueva tu plan anual'}
            subtitle="Los días que te quedan se suman al nuevo año."
            rejected={rejected}
            onSubmitted={onChanged}
          />
        )}
      </div>
    );
  }

  // ─── Sin acceso ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Activa tu perfil</h2>
        <p className="text-gray-500 text-sm">
          Tu perfil aparece en las búsquedas cuando tienes un acceso activo. Los clientes te contactan directo, sin
          intermediarios.
        </p>
      </div>

      {pending && <PendingNotice />}

      <BetaCodeCard onRedeemed={onChanged} />

      {settingsLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      ) : paymentsEnabled && settings ? (
        !pending && (
          <PaymentCard
            settings={settings}
            price={price}
            title={`O activa el plan anual: S/${price}`}
            subtitle={`Menos de S/${(price / 365).toFixed(2)} al día.`}
            rejected={rejected}
            onSubmitted={onChanged}
          />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Durante la beta el acceso es solo por invitación. ¿No tienes código? Pídelo por WhatsApp.
          </p>
          <a
            href={supportUrl('Hola, quiero unirme a la beta de Genios como genio. ¿Me pueden dar un código?')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Pedir mi código
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Piezas ─────────────────────────────────────────────────────────────────

function PendingNotice() {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Recibimos tu comprobante</p>
        <p className="text-sm text-amber-700">Lo estamos revisando. Normalmente lo aprobamos en menos de 24 horas.</p>
      </div>
    </div>
  );
}

function BetaCodeCard({ onRedeemed }: { onRedeemed: () => void }) {
  // Si llegó con un enlace de invitación, el código ya viene escrito.
  const [code, setCode] = useState(getPendingInviteCode() ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setMessage(null);
    const result = await redeemBetaCode(trimmed);
    setLoading(false);

    if (result.ok) {
      clearPendingInviteCode();
      setMessage({ type: 'success', text: `¡Listo! Tu perfil ya es visible hasta el ${fmtDate(result.endsAt)}.` });
      setTimeout(onRedeemed, 1200);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Tag className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-semibold text-gray-900">¿Tienes un código de invitación?</p>
      </div>
      <p className="text-xs text-gray-500 mb-3">Con tu código de la beta tu perfil se activa gratis.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="Ej. TACNA2026"
          aria-label="Código de invitación"
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 font-mono tracking-wider"
          maxLength={30}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar'}
        </button>
      </div>
      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-2 mt-3 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          {message.text}
        </div>
      )}
    </div>
  );
}

function PaymentCard({
  settings,
  price,
  title,
  subtitle,
  rejected,
  onSubmitted,
}: {
  settings: PaymentSettings;
  price: number;
  title: string;
  subtitle: string;
  rejected: PaymentRequestSummary | null;
  onSubmitted: () => void;
}) {
  const [showBank, setShowBank] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('yape');
  const [reference, setReference] = useState('');
  const [voucher, setVoucher] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (file: File | undefined) => {
    setError('');
    if (!file) return setVoucher(null);
    const okType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!okType) return setError('Sube una foto o un PDF del comprobante.');
    if (file.size > 10 * 1024 * 1024) return setError('El archivo debe pesar menos de 10 MB.');
    setVoucher(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!voucher) return setError('Adjunta la captura o el PDF de tu pago.');
    setSending(true);
    setError('');
    const result = await submitPaymentRequest(method, reference, voucher);
    setSending(false);
    if (result.ok) onSubmitted();
    else setError(result.message);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{subtitle}</p>

        {rejected && (
          <div role="alert" className="flex items-start gap-2 mb-5 p-3 rounded-lg text-sm bg-red-50 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              No pudimos aprobar tu comprobante anterior
              {rejected.internal_notes ? `: ${rejected.internal_notes}` : '.'} Puedes enviar uno nuevo.
            </span>
          </div>
        )}

        {/* 1. Pagar */}
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">1. Paga S/{price}</p>
        <div className="flex flex-col items-center mb-5">
          {settings.qr_image_url ? (
            <img src={settings.qr_image_url} alt="QR de pago" className="w-44 h-44 rounded-xl object-contain border border-gray-200" />
          ) : (
            <div className="w-44 h-44 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2">
              <QrCode className="w-10 h-10 text-gray-300" />
              <p className="text-xs text-gray-400 text-center px-4">QR de pago próximamente</p>
            </div>
          )}
          <p className="text-sm font-semibold text-gray-800 mt-3">{settings.payment_name || 'Genios'}</p>
          {settings.payment_phone && (
            <p className="text-sm text-gray-500">{settings.payment_phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</p>
          )}
          {settings.payment_instructions && (
            <p className="text-xs text-gray-500 text-center mt-2 whitespace-pre-line">{settings.payment_instructions}</p>
          )}
        </div>

        {settings.bank_account_enabled && (
          <div className="mb-5 border border-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setShowBank((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded-xl"
              aria-expanded={showBank}
            >
              <span className="flex items-center gap-2 font-medium">
                <Building2 className="w-4 h-4 text-gray-400" />
                Pagar por transferencia bancaria
              </span>
              {showBank ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showBank && (
              <dl className="px-4 pb-4 space-y-2 text-sm">
                {[
                  ['Banco', settings.bank_name],
                  ['Titular', settings.bank_account_name],
                  ['Cuenta', settings.bank_account_number],
                  ['CCI', settings.bank_cci],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-gray-500 shrink-0">{label}</dt>
                    <dd className="font-semibold text-gray-900 text-right break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {/* 2. Enviar comprobante */}
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">2. Envía tu comprobante</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Método de pago">
            {METHOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={method === option.value}
                onClick={() => setMethod(option.value)}
                className={`py-2 rounded-lg border text-sm transition-colors ${
                  method === option.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="N.º de operación (opcional)"
            aria-label="Número de operación"
            maxLength={100}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          />
          <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg px-3 py-4 text-sm text-gray-600 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{voucher ? voucher.name : 'Adjunta la captura o PDF del pago'}</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {sending ? 'Enviando…' : 'Enviar comprobante'}
          </button>
        </form>
      </div>
    </div>
  );
}
