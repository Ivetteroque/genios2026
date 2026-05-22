import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Phone,
  User,
  Building2,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Image,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentSettingsData {
  id?: string;
  qr_image_url: string;
  payment_phone: string;
  payment_name: string;
  bank_account_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_cci: string;
  bank_account_enabled: boolean;
}

const defaultSettings: PaymentSettingsData = {
  qr_image_url: '',
  payment_phone: '',
  payment_name: '',
  bank_account_name: '',
  bank_name: '',
  bank_account_number: '',
  bank_cci: '',
  bank_account_enabled: false,
};

const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-text/20 focus:border-text/30 placeholder:text-text/25 text-text transition-colors';
const fieldWithIconClass = `${fieldClass} pl-9`;

const PaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('payment_settings')
      .select('*')
      .maybeSingle();

    if (data) setSettings(data);
    setLoading(false);
  };

  const handleChange = (field: keyof PaymentSettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    const { id, ...payload } = settings;

    let error;
    if (id) {
      ({ error } = await supabase
        .from('payment_settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id));
    } else {
      ({ error } = await supabase
        .from('payment_settings')
        .insert(payload));
    }

    setSaving(false);
    setSaveStatus(error ? 'error' : 'success');

    if (!error && !id) await loadSettings();

    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 text-text/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-heading text-lg font-semibold text-text">Configuración de pagos</h1>
        <p className="text-sm text-text/40 mt-1">
          Datos de pago que los genios ven al activar su suscripción.
        </p>
      </div>

      {/* Yape / Plin */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <QrCode className="w-4 h-4 text-text/35 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-text">Yape / Plin</p>
            <p className="text-xs text-text/40">Código QR de pago</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text/45 mb-1.5">URL de imagen QR</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={settings.qr_image_url}
                onChange={e => handleChange('qr_image_url', e.target.value)}
                placeholder="https://..."
                className={`${fieldClass} flex-1`}
              />
              <div className="w-14 h-10 rounded-lg border border-gray-200 shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                {settings.qr_image_url ? (
                  <img
                    src={settings.qr_image_url}
                    alt="QR"
                    className="w-full h-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Image className="w-4 h-4 text-text/20" />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text/45 mb-1.5">Nombre visible</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input
                type="text"
                value={settings.payment_name}
                onChange={e => handleChange('payment_name', e.target.value)}
                placeholder="Genios a la Obra"
                className={fieldWithIconClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text/45 mb-1.5">Número de teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input
                type="text"
                value={settings.payment_phone}
                onChange={e => handleChange('payment_phone', e.target.value)}
                placeholder="952719641"
                className={fieldWithIconClass}
              />
            </div>
            <p className="text-xs text-text/30 mt-1.5">
              También se usa para el botón de WhatsApp. Incluye código de país si es necesario (ej: 51952719641).
            </p>
          </div>
        </div>
      </div>

      {/* Bank account */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-text/35 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">Cuenta Bancaria</p>
              <p className="text-xs text-text/40">Opción de transferencia bancaria</p>
            </div>
          </div>
          <button
            onClick={() => handleChange('bank_account_enabled', !settings.bank_account_enabled)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            {settings.bank_account_enabled ? (
              <>
                <ToggleRight className="w-7 h-7 text-text/70" />
                <span className="text-text/55">Activa</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-7 h-7 text-text/25" />
                <span className="text-text/35">Inactiva</span>
              </>
            )}
          </button>
        </div>

        <div className={`p-5 space-y-4 transition-opacity duration-200 ${settings.bank_account_enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Banco</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={e => handleChange('bank_name', e.target.value)}
                  placeholder="BCP, Interbank..."
                  className={fieldWithIconClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Titular de la cuenta</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
                <input
                  type="text"
                  value={settings.bank_account_name}
                  onChange={e => handleChange('bank_account_name', e.target.value)}
                  placeholder="Nombre del titular"
                  className={fieldWithIconClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text/45 mb-1.5">Número de cuenta</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input
                type="text"
                value={settings.bank_account_number}
                onChange={e => handleChange('bank_account_number', e.target.value)}
                placeholder="000-0000000-0-00"
                className={`${fieldWithIconClass} font-mono tracking-wider`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text/45 mb-1.5">CCI (Código de Cuenta Interbancario)</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input
                type="text"
                value={settings.bank_cci}
                onChange={e => handleChange('bank_cci', e.target.value)}
                placeholder="00200000000000000000"
                className={`${fieldWithIconClass} font-mono tracking-wider`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4 pb-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-text hover:bg-text/85 disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {saveStatus === 'success' && (
          <div className="flex items-center gap-1.5 text-sm text-text/50">
            <CheckCircle className="w-4 h-4" />
            Cambios guardados
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            Error al guardar
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
