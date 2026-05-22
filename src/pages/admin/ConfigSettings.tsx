import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Mail,
  Phone,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Image,
  FileText,
  Search,
  QrCode,
  User,
  Building2,
  CreditCard,
  Hash,
  Shield,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformSettings {
  id?: string;
  platform_name: string;
  logo_url: string;
  favicon_url: string;
  support_email: string;
  whatsapp_main: string;
  slogan: string;
  beta_enabled: boolean;
  beta_duration_days: number;
  beta_user_limit: number;
  beta_self_activate: boolean;
  terms_and_conditions: string;
  privacy_policy: string;
  genius_public_consent: string;
  seo_title: string;
  seo_description: string;
  seo_og_image: string;
  seo_keywords: string;
}

interface PaymentSettings {
  id?: string;
  qr_image_url: string;
  payment_phone: string;
  payment_name: string;
  payment_instructions: string;
  annual_price: number;
  payments_enabled: boolean;
  bank_account_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_cci: string;
  bank_account_enabled: boolean;
}

type Tab = 'general' | 'pagos' | 'beta' | 'legal' | 'seo';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultPlatform: PlatformSettings = {
  platform_name: 'Genios a la Obra',
  logo_url: '',
  favicon_url: '',
  support_email: '',
  whatsapp_main: '',
  slogan: '',
  beta_enabled: true,
  beta_duration_days: 30,
  beta_user_limit: 0,
  beta_self_activate: true,
  terms_and_conditions: '',
  privacy_policy: '',
  genius_public_consent: '',
  seo_title: 'Genios a la Obra',
  seo_description: '',
  seo_og_image: '',
  seo_keywords: '',
};

const defaultPayment: PaymentSettings = {
  qr_image_url: '',
  payment_phone: '',
  payment_name: '',
  payment_instructions: '',
  annual_price: 150,
  payments_enabled: true,
  bank_account_name: '',
  bank_name: '',
  bank_account_number: '',
  bank_cci: '',
  bank_account_enabled: false,
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const field = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-text/20 focus:border-text/30 placeholder:text-text/25 text-text transition-colors bg-white';
const fieldIcon = `${field} pl-9`;
const fieldMono = `${field} font-mono tracking-wide`;

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div className="mb-1.5">
    <label className="block text-xs font-medium text-text/50">{children}</label>
    {hint && <p className="text-[11px] text-text/30 mt-0.5">{hint}</p>}
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }> = ({
  value, onChange, label, sub,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm text-text">{label}</p>
      {sub && <p className="text-xs text-text/35 mt-0.5">{sub}</p>}
    </div>
    <button onClick={() => onChange(!value)} className="flex-shrink-0 ml-4">
      {value
        ? <ToggleRight className="w-8 h-8 text-green-500" />
        : <ToggleLeft className="w-8 h-8 text-text/20" />}
    </button>
  </div>
);

const SaveBar: React.FC<{ saving: boolean; status: 'idle' | 'success' | 'error'; onSave: () => void }> = ({
  saving, status, onSave,
}) => (
  <div className="flex items-center gap-4 pt-2 pb-4">
    <button
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-2 bg-text hover:bg-text/85 disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? 'Guardando...' : 'Guardar cambios'}
    </button>
    {status === 'success' && (
      <span className="flex items-center gap-1.5 text-sm text-green-600">
        <CheckCircle className="w-4 h-4" /> Cambios guardados
      </span>
    )}
    {status === 'error' && (
      <span className="flex items-center gap-1.5 text-sm text-red-500">
        <AlertCircle className="w-4 h-4" /> Error al guardar
      </span>
    )}
  </div>
);

const SectionCard: React.FC<{ icon: React.FC<{ className?: string }>; title: string; sub: string; children: React.ReactNode }> = ({
  icon: Icon, title, sub, children,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
      <Icon className="w-4 h-4 text-text/30 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text/35">{sub}</p>
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

// ─── Tab components ───────────────────────────────────────────────────────────

const GeneralTab: React.FC<{
  settings: PlatformSettings;
  onChange: (f: keyof PlatformSettings, v: string | boolean | number) => void;
  saving: boolean;
  status: 'idle' | 'success' | 'error';
  onSave: () => void;
}> = ({ settings, onChange, saving, status, onSave }) => (
  <div className="space-y-5">
    <SectionCard icon={Globe} title="Identidad de la plataforma" sub="Nombre, logo y datos de contacto">
      <div>
        <Label>Nombre de la plataforma</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
          <input type="text" value={settings.platform_name}
            onChange={e => onChange('platform_name', e.target.value)}
            placeholder="Genios a la Obra" className={fieldIcon} />
        </div>
      </div>

      <div>
        <Label hint="Frase corta que aparece en el hero">Slogan</Label>
        <input type="text" value={settings.slogan}
          onChange={e => onChange('slogan', e.target.value)}
          placeholder="Conectamos talento con quienes lo necesitan"
          className={field} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label hint="URL completa de la imagen">Logo</Label>
          <div className="flex gap-2">
            <input type="text" value={settings.logo_url}
              onChange={e => onChange('logo_url', e.target.value)}
              placeholder="https://..." className={`${field} flex-1`} />
            {settings.logo_url && (
              <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={settings.logo_url} alt="logo"
                  className="max-w-full max-h-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>

        <div>
          <Label hint="URL .ico o .png 32x32">Favicon</Label>
          <input type="text" value={settings.favicon_url}
            onChange={e => onChange('favicon_url', e.target.value)}
            placeholder="https://..." className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Correo de soporte</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input type="email" value={settings.support_email}
              onChange={e => onChange('support_email', e.target.value)}
              placeholder="soporte@geniosalaobra.com" className={fieldIcon} />
          </div>
        </div>

        <div>
          <Label hint="Con código de país, ej: 51952719641">WhatsApp principal</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input type="text" value={settings.whatsapp_main}
              onChange={e => onChange('whatsapp_main', e.target.value)}
              placeholder="51952719641" className={fieldIcon} />
          </div>
        </div>
      </div>
    </SectionCard>

    <SaveBar saving={saving} status={status} onSave={onSave} />
  </div>
);

const PagosTab: React.FC<{
  settings: PaymentSettings;
  onChange: (f: keyof PaymentSettings, v: string | boolean | number) => void;
  saving: boolean;
  status: 'idle' | 'success' | 'error';
  onSave: () => void;
}> = ({ settings, onChange, saving, status, onSave }) => (
  <div className="space-y-5">
    <SectionCard icon={Zap} title="Yape / Plin" sub="Datos de pago que el genio ve al activar su plan">
      <div>
        <Label hint="URL pública de la imagen QR">Código QR</Label>
        <div className="flex gap-3">
          <input type="text" value={settings.qr_image_url}
            onChange={e => onChange('qr_image_url', e.target.value)}
            placeholder="https://..." className={`${field} flex-1`} />
          <div className="w-14 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {settings.qr_image_url
              ? <img src={settings.qr_image_url} alt="QR"
                  className="w-full h-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <QrCode className="w-5 h-5 text-text/15" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Nombre del titular</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input type="text" value={settings.payment_name}
              onChange={e => onChange('payment_name', e.target.value)}
              placeholder="Genios a la Obra" className={fieldIcon} />
          </div>
        </div>

        <div>
          <Label hint="Número Yape / Plin">Número de teléfono</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input type="text" value={settings.payment_phone}
              onChange={e => onChange('payment_phone', e.target.value)}
              placeholder="952719641" className={fieldIcon} />
          </div>
        </div>
      </div>

      <div>
        <Label hint="Monto en soles peruanos">Monto membresía anual (S/)</Label>
        <input type="number" min={0} value={settings.annual_price}
          onChange={e => onChange('annual_price', parseFloat(e.target.value) || 0)}
          placeholder="150" className={field} />
      </div>

      <div>
        <Label hint="Instrucciones paso a paso para completar el pago">Instrucciones de pago</Label>
        <textarea value={settings.payment_instructions}
          onChange={e => onChange('payment_instructions', e.target.value)}
          rows={3}
          placeholder="1. Abre Yape o Plin&#10;2. Escanea el QR o ingresa el número&#10;3. Sube el comprobante..."
          className={`${field} resize-none`} />
      </div>

      <Toggle value={settings.payments_enabled} onChange={v => onChange('payments_enabled', v)}
        label="Pagos manuales activos"
        sub="Permitir que los genios envíen comprobantes de pago" />
    </SectionCard>

    <SectionCard icon={Building2} title="Cuenta bancaria" sub="Opción de transferencia bancaria">
      <Toggle value={settings.bank_account_enabled} onChange={v => onChange('bank_account_enabled', v)}
        label="Cuenta bancaria activa"
        sub="Mostrar opción de transferencia a los genios" />

      <div className={`space-y-4 transition-opacity duration-200 ${settings.bank_account_enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Banco</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input type="text" value={settings.bank_name}
                onChange={e => onChange('bank_name', e.target.value)}
                placeholder="BCP, Interbank..." className={fieldIcon} />
            </div>
          </div>
          <div>
            <Label>Titular</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input type="text" value={settings.bank_account_name}
                onChange={e => onChange('bank_account_name', e.target.value)}
                placeholder="Nombre del titular" className={fieldIcon} />
            </div>
          </div>
        </div>
        <div>
          <Label>Número de cuenta</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input type="text" value={settings.bank_account_number}
              onChange={e => onChange('bank_account_number', e.target.value)}
              placeholder="000-0000000-0-00" className={`${fieldIcon} ${fieldMono}`} />
          </div>
        </div>
        <div>
          <Label>CCI</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input type="text" value={settings.bank_cci}
              onChange={e => onChange('bank_cci', e.target.value)}
              placeholder="00200000000000000000" className={`${fieldIcon} ${fieldMono}`} />
          </div>
        </div>
      </div>
    </SectionCard>

    <SaveBar saving={saving} status={status} onSave={onSave} />
  </div>
);

const BetaTab: React.FC<{
  settings: PlatformSettings;
  onChange: (f: keyof PlatformSettings, v: string | boolean | number) => void;
  saving: boolean;
  status: 'idle' | 'success' | 'error';
  onSave: () => void;
}> = ({ settings, onChange, saving, status, onSave }) => (
  <div className="space-y-5">
    <SectionCard icon={Zap} title="Programa beta" sub="Control de acceso al programa de prueba gratuita">
      <Toggle value={settings.beta_enabled} onChange={v => onChange('beta_enabled', v)}
        label="Beta activo"
        sub="Permitir nuevos genios con acceso beta" />

      <Toggle value={settings.beta_self_activate} onChange={v => onChange('beta_self_activate', v)}
        label="Auto-activacion con codigo"
        sub="El genio puede activar su cuenta ingresando un código beta" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <Label hint="Días de acceso gratuito por defecto">Duración beta (días)</Label>
          <input type="number" min={1} max={365} value={settings.beta_duration_days}
            onChange={e => onChange('beta_duration_days', parseInt(e.target.value) || 30)}
            className={field} />
        </div>
        <div>
          <Label hint="0 = sin límite">Límite de usuarios beta</Label>
          <input type="number" min={0} value={settings.beta_user_limit}
            onChange={e => onChange('beta_user_limit', parseInt(e.target.value) || 0)}
            placeholder="0 = ilimitado"
            className={field} />
        </div>
      </div>
    </SectionCard>

    <SaveBar saving={saving} status={status} onSave={onSave} />
  </div>
);

const LegalTab: React.FC<{
  settings: PlatformSettings;
  onChange: (f: keyof PlatformSettings, v: string | boolean | number) => void;
  saving: boolean;
  status: 'idle' | 'success' | 'error';
  onSave: () => void;
}> = ({ settings, onChange, saving, status, onSave }) => (
  <div className="space-y-5">
    <SectionCard icon={FileText} title="Términos y Condiciones"
      sub="Texto que se muestra al registrarse. Acepta Markdown básico.">
      <textarea value={settings.terms_and_conditions}
        onChange={e => onChange('terms_and_conditions', e.target.value)}
        rows={10}
        placeholder="## Términos y Condiciones&#10;&#10;Al usar esta plataforma, el usuario acepta..."
        className={`${field} resize-y font-mono text-xs leading-relaxed`} />
    </SectionCard>

    <SectionCard icon={Shield} title="Política de Privacidad"
      sub="Texto que describe cómo se tratan los datos personales.">
      <textarea value={settings.privacy_policy}
        onChange={e => onChange('privacy_policy', e.target.value)}
        rows={10}
        placeholder="## Política de Privacidad&#10;&#10;Tus datos son tratados con..."
        className={`${field} resize-y font-mono text-xs leading-relaxed`} />
    </SectionCard>

    <SectionCard icon={User} title="Consentimiento perfil público de genio"
      sub="Texto mostrado al genio al publicar su perfil.">
      <textarea value={settings.genius_public_consent}
        onChange={e => onChange('genius_public_consent', e.target.value)}
        rows={5}
        placeholder="Al publicar tu perfil, aceptas que tu nombre, foto y servicios sean visibles públicamente en la plataforma..."
        className={`${field} resize-y text-sm leading-relaxed`} />
    </SectionCard>

    <SaveBar saving={saving} status={status} onSave={onSave} />
  </div>
);

const SeoTab: React.FC<{
  settings: PlatformSettings;
  onChange: (f: keyof PlatformSettings, v: string | boolean | number) => void;
  saving: boolean;
  status: 'idle' | 'success' | 'error';
  onSave: () => void;
}> = ({ settings, onChange, saving, status, onSave }) => (
  <div className="space-y-5">
    <SectionCard icon={Search} title="Metadatos básicos"
      sub="Controla cómo la web aparece en Google y al compartir en redes.">
      <div>
        <Label hint="Aparece en la pestaña del navegador y en Google">Título (title tag)</Label>
        <input type="text" value={settings.seo_title}
          onChange={e => onChange('seo_title', e.target.value)}
          placeholder="Genios a la Obra — Encuentra expertos cerca de ti"
          className={field} />
        <p className={`text-[11px] mt-1 ${settings.seo_title.length > 60 ? 'text-amber-500' : 'text-text/25'}`}>
          {settings.seo_title.length}/60 caracteres recomendados
        </p>
      </div>

      <div>
        <Label hint="Se muestra en los resultados de búsqueda">Descripción (meta description)</Label>
        <textarea value={settings.seo_description}
          onChange={e => onChange('seo_description', e.target.value)}
          rows={3}
          placeholder="Conecta con los mejores profesionales y técnicos de tu ciudad. Plomeros, electricistas, diseñadores y más."
          className={`${field} resize-none`} />
        <p className={`text-[11px] mt-1 ${settings.seo_description.length > 160 ? 'text-amber-500' : 'text-text/25'}`}>
          {settings.seo_description.length}/160 caracteres recomendados
        </p>
      </div>

      <div>
        <Label hint="Imagen al compartir en WhatsApp, Facebook, etc. (1200x630px recomendado)">
          Imagen Open Graph
        </Label>
        <div className="flex gap-3">
          <input type="text" value={settings.seo_og_image}
            onChange={e => onChange('seo_og_image', e.target.value)}
            placeholder="https://..." className={`${field} flex-1`} />
          {settings.seo_og_image && (
            <div className="w-20 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={settings.seo_og_image} alt="OG"
                className="max-w-full max-h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>
      </div>

      <div>
        <Label hint="Separadas por comas">Palabras clave</Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
          <input type="text" value={settings.seo_keywords}
            onChange={e => onChange('seo_keywords', e.target.value)}
            placeholder="genios, servicios del hogar, electricista, plomero, Tacna"
            className={fieldIcon} />
        </div>
      </div>
    </SectionCard>

    {/* Preview card */}
    {(settings.seo_title || settings.seo_description) && (
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-medium text-text/35 uppercase tracking-wide mb-3">Vista previa Google</p>
        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 max-w-lg">
          <p className="text-[13px] font-medium text-blue-700 truncate">
            {settings.seo_title || 'Sin título'}
          </p>
          <p className="text-[11px] text-green-700 mt-0.5">geniosalaobra.com</p>
          <p className="text-[12px] text-text/50 mt-1 leading-relaxed line-clamp-2">
            {settings.seo_description || 'Sin descripción'}
          </p>
        </div>
      </div>
    )}

    <SaveBar saving={saving} status={status} onSave={onSave} />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'general', label: 'General',   icon: Globe },
  { id: 'pagos',   label: 'Pagos',     icon: CreditCard },
  { id: 'beta',    label: 'Beta',      icon: Zap },
  { id: 'legal',   label: 'Legal',     icon: Shield },
  { id: 'seo',     label: 'SEO',       icon: Search },
];

const ConfigSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [platform, setPlatform] = useState<PlatformSettings>(defaultPlatform);
  const [payment, setPayment] = useState<PaymentSettings>(defaultPayment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ps }, { data: pay }] = await Promise.all([
      supabase.from('platform_settings').select('*').maybeSingle(),
      supabase.from('payment_settings').select('*').maybeSingle(),
    ]);
    if (ps) setPlatform(ps);
    if (pay) {
      setPayment({
        ...defaultPayment,
        ...pay,
        annual_price: pay.annual_price ?? defaultPayment.annual_price,
        payment_instructions: pay.payment_instructions ?? '',
        payments_enabled: pay.payments_enabled ?? true,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changePlatform = (f: keyof PlatformSettings, v: string | boolean | number) => {
    setPlatform(prev => ({ ...prev, [f]: v }));
    if (status !== 'idle') setStatus('idle');
  };

  const changePayment = (f: keyof PaymentSettings, v: string | boolean | number) => {
    setPayment(prev => ({ ...prev, [f]: v }));
    if (status !== 'idle') setStatus('idle');
  };

  const savePlatform = async () => {
    setSaving(true);
    setStatus('idle');
    const { id, ...payload } = platform;
    let err;
    if (id) {
      ({ error: err } = await supabase.from('platform_settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id));
    } else {
      ({ error: err } = await supabase.from('platform_settings').insert(payload));
    }
    setSaving(false);
    setStatus(err ? 'error' : 'success');
    if (!err && !id) await load();
    setTimeout(() => setStatus('idle'), 3000);
  };

  const savePayment = async () => {
    setSaving(true);
    setStatus('idle');
    const { id, ...payload } = payment;
    let err;
    if (id) {
      ({ error: err } = await supabase.from('payment_settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id));
    } else {
      ({ error: err } = await supabase.from('payment_settings').insert(payload));
    }
    setSaving(false);
    setStatus(err ? 'error' : 'success');
    if (!err && !id) await load();
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleSave = () => {
    if (activeTab === 'pagos') return savePayment();
    return savePlatform();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-text/25" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-base font-semibold text-text">Configuracion</h1>
        <p className="text-xs text-text/35 mt-0.5">
          Controla los datos esenciales de la plataforma sin tocar codigo.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100/60 p-1 rounded-xl w-full overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setStatus('idle'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
              activeTab === id
                ? 'bg-white text-text shadow-sm'
                : 'text-text/40 hover:text-text/65'
            }`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'general' && (
        <GeneralTab settings={platform} onChange={changePlatform}
          saving={saving} status={status} onSave={handleSave} />
      )}
      {activeTab === 'pagos' && (
        <PagosTab settings={payment} onChange={changePayment}
          saving={saving} status={status} onSave={handleSave} />
      )}
      {activeTab === 'beta' && (
        <BetaTab settings={platform} onChange={changePlatform}
          saving={saving} status={status} onSave={handleSave} />
      )}
      {activeTab === 'legal' && (
        <LegalTab settings={platform} onChange={changePlatform}
          saving={saving} status={status} onSave={handleSave} />
      )}
      {activeTab === 'seo' && (
        <SeoTab settings={platform} onChange={changePlatform}
          saving={saving} status={status} onSave={handleSave} />
      )}
    </div>
  );
};

export default ConfigSettings;
