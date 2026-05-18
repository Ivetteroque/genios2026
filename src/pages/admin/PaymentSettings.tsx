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

    if (data) {
      setSettings(data);
    }
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

    if (!error && !id) {
      await loadSettings();
    }

    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion de Pagos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Actualiza los datos de pago que los genios ven al activar su suscripcion.
        </p>
      </div>

      {/* Yape / Plin section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Yape / Plin</h2>
            <p className="text-xs text-gray-500">Codigo QR de pago</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* QR image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL de imagen QR
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={settings.qr_image_url}
                  onChange={e => handleChange('qr_image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
              {settings.qr_image_url && (
                <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                  <img
                    src={settings.qr_image_url}
                    alt="QR preview"
                    className="w-full h-full object-contain"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              {!settings.qr_image_url && (
                <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 shrink-0 bg-gray-50 flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre visible
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={settings.payment_name}
                onChange={e => handleChange('payment_name', e.target.value)}
                placeholder="Genios a la Obra"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numero de telefono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={settings.payment_phone}
                onChange={e => handleChange('payment_phone', e.target.value)}
                placeholder="952719641"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Este numero tambien se usa para el boton de WhatsApp. Incluye codigo de pais si es necesario (ej: 51952719641).
            </p>
          </div>
        </div>
      </div>

      {/* Bank account section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Cuenta Bancaria</h2>
              <p className="text-xs text-gray-500">Opcion de transferencia bancaria</p>
            </div>
          </div>
          <button
            onClick={() => handleChange('bank_account_enabled', !settings.bank_account_enabled)}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {settings.bank_account_enabled ? (
              <>
                <ToggleRight className="w-8 h-8 text-green-500" />
                <span className="text-green-600">Activa</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-8 h-8 text-gray-400" />
                <span className="text-gray-500">Inactiva</span>
              </>
            )}
          </button>
        </div>

        <div className={`p-6 space-y-5 transition-opacity ${settings.bank_account_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Banco
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={e => handleChange('bank_name', e.target.value)}
                  placeholder="BCP, Interbank..."
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Account holder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titular de la cuenta
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={settings.bank_account_name}
                  onChange={e => handleChange('bank_account_name', e.target.value)}
                  placeholder="Nombre del titular"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Account number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numero de cuenta
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={settings.bank_account_number}
                onChange={e => handleChange('bank_account_number', e.target.value)}
                placeholder="000-0000000-0-00"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 font-mono tracking-wider"
              />
            </div>
          </div>

          {/* CCI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CCI (Codigo de Cuenta Interbancario)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={settings.bank_cci}
                onChange={e => handleChange('bank_cci', e.target.value)}
                placeholder="00200000000000000000"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 font-mono tracking-wider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Cambios guardados correctamente
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Error al guardar. Intenta de nuevo.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
