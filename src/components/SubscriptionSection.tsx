import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ArrowRight, MessageCircle, QrCode, Tag, Loader2, AlertCircle, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useTrialCode } from '../utils/paymentUtils';
import { supabase } from '../lib/supabase';

const PAYMENT_AMOUNT = 150;

interface PaymentConfig {
  qr_image_url: string;
  payment_phone: string;
  payment_name: string;
  bank_account_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_cci: string;
  bank_account_enabled: boolean;
}

interface SubscriptionSectionProps {
  price?: number;
  currency?: string;
  daysRemaining?: number;
  isActive?: boolean;
  geniusEmail: string;
  geniusId: string;
  geniusName: string;
  onManageSubscription?: () => void;
  onSubscriptionActivated: () => void;
}

export default function SubscriptionSection({
  price,
  currency,
  daysRemaining,
  isActive,
  geniusEmail,
  geniusId,
  geniusName,
  onManageSubscription,
  onSubscriptionActivated,
}: SubscriptionSectionProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [showBank, setShowBank] = useState(false);

  const currencySymbol = currency === 'PEN' ? 'S/' : '$';

  useEffect(() => {
    supabase
      .from('payment_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPaymentConfig(data);
        setConfigLoading(false);
      });
  }, []);

  const whatsappPhone = paymentConfig?.payment_phone
    ? (paymentConfig.payment_phone.startsWith('51') ? paymentConfig.payment_phone : `51${paymentConfig.payment_phone}`)
    : '51952719641';

  const whatsappMessage = encodeURIComponent(
    `Hola acabo de realizar el pago para empezar a recibir clientes en Genios a la Obra.\nMi correo es: ${geniusEmail}`
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`;

  const handleActivatePromo = async () => {
    const trimmed = promoCode.trim();
    if (!trimmed) return;

    setPromoLoading(true);
    setPromoMessage(null);

    await new Promise(r => setTimeout(r, 600));

    const success = useTrialCode(trimmed, geniusId, geniusName);

    setPromoLoading(false);

    if (success) {
      setPromoMessage({ type: 'success', text: '¡Codigo activado! Tu suscripcion esta activa.' });
      setTimeout(() => {
        onSubscriptionActivated();
      }, 1200);
    } else {
      setPromoMessage({ type: 'error', text: 'Codigo invalido, ya usado, o no disponible para tu zona.' });
    }
  };

  // Active subscription view
  if (isActive && price !== undefined && daysRemaining !== undefined) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Suscripcion</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-5">
            <div className="p-3 rounded-xl bg-green-50 shrink-0">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Activa</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Plan Genio</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {currencySymbol}{price} <span className="text-base font-normal text-gray-500">al año</span>
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Te quedan <span className="font-semibold text-blue-600">{daysRemaining} dias</span> de visibilidad
              </p>
              {onManageSubscription && (
                <button
                  onClick={onManageSubscription}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
                >
                  Gestionar suscripcion
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inactive / no subscription view
  return (
    <div className="max-w-lg mx-auto">
      {/* Value proposition header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Mas clientes, un solo pago al año
        </h2>
        <p className="text-blue-600 font-semibold text-lg">
          S/{PAYMENT_AMOUNT} al año — menos de S/0.50 al dia
        </p>
        <p className="text-gray-500 text-sm mt-1.5">
          Tu perfil aparece cuando alguien busca tu oficio. Los clientes te contactan directo, sin intermediarios.
        </p>
      </div>

      {/* Pricing card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* QR */}
          <div className="flex flex-col items-center mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Escanea para pagar</p>

            {configLoading ? (
              <div className="w-48 h-48 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
              </div>
            ) : paymentConfig?.qr_image_url ? (
              <img
                src={paymentConfig.qr_image_url}
                alt="QR de pago"
                className="w-48 h-48 rounded-xl object-contain border border-gray-200"
              />
            ) : (
              <div className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2">
                <QrCode className="w-12 h-12 text-gray-300" />
                <p className="text-xs text-gray-400 text-center px-4">Imagen QR de pago<br/>(proximamente)</p>
              </div>
            )}

            <p className="text-sm font-semibold text-gray-800 mt-3">
              {paymentConfig?.payment_name || 'Genios a la Obra'}
            </p>
            {paymentConfig?.payment_phone && (
              <p className="text-sm text-gray-500">
                {paymentConfig.payment_phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
              </p>
            )}
          </div>

          {/* WhatsApp button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar comprobante por WhatsApp
          </a>

          <p className="text-xs text-gray-400 text-center mt-2">
            Te ayudamos por WhatsApp en todo el proceso
          </p>
        </div>

        {/* Bank transfer option (collapsible, only shown if enabled) */}
        {!configLoading && paymentConfig?.bank_account_enabled && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => setShowBank(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Pagar por transferencia bancaria</span>
              </div>
              {showBank ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showBank && (
              <div className="px-6 pb-5 space-y-2">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                  {paymentConfig.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Banco</span>
                      <span className="font-semibold text-gray-900">{paymentConfig.bank_name}</span>
                    </div>
                  )}
                  {paymentConfig.bank_account_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Titular</span>
                      <span className="font-semibold text-gray-900">{paymentConfig.bank_account_name}</span>
                    </div>
                  )}
                  {paymentConfig.bank_account_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cuenta</span>
                      <span className="font-mono font-semibold text-gray-900">{paymentConfig.bank_account_number}</span>
                    </div>
                  )}
                  {paymentConfig.bank_cci && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">CCI</span>
                      <span className="font-mono font-semibold text-gray-900">{paymentConfig.bank_cci}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Despues de transferir, envia tu voucher por WhatsApp
                </p>
              </div>
            )}
          </div>
        )}

        {/* Promo code section */}
        <div className="border-t border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">¿Tienes un codigo?</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleActivatePromo()}
              placeholder="Ingresa tu codigo"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 font-mono tracking-wider"
              maxLength={20}
            />
            <button
              onClick={handleActivatePromo}
              disabled={promoLoading || !promoCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-1.5"
            >
              {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar'}
            </button>
          </div>

          {promoMessage && (
            <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg text-sm ${
              promoMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            }`}>
              {promoMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {promoMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {promoMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
