import { supabase } from '../lib/supabase';
import { compressImage, GALLERY_PRESET } from '../utils/imageCompression';

/**
 * Membresías, códigos beta y pagos del genio.
 *
 * Las reglas viven en la base (migración 20261114120000_business_model.sql):
 * - Un genio aparece en el directorio si está activo y tiene una membresía
 *   vigente (beta o anual).
 * - El canje de códigos, el envío de pagos y su aprobación pasan por RPCs que
 *   validan todo en el servidor; el navegador solo muestra y envía.
 */

export type MembershipType = 'beta' | 'annual';

export interface Membership {
  id: string;
  genius_profile_id: string;
  type: MembershipType;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'suspended';
  beta_code_id: string | null;
}

export interface PaymentRequestSummary {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'observed';
  payment_method: string;
  amount: number;
  internal_notes: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface PaymentSettings {
  qr_image_url: string;
  payment_phone: string;
  payment_name: string;
  bank_account_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_cci: string;
  bank_account_enabled: boolean;
  annual_price: number;
  payment_instructions: string;
  payments_enabled: boolean;
}

export type PaymentMethod = 'yape' | 'plin' | 'transfer';

export const PAYMENT_VOUCHERS_BUCKET = 'payment-vouchers';
export const IDENTITY_DOCUMENTS_BUCKET = 'identity-documents';

const DAY_MS = 24 * 60 * 60 * 1000;
export const EXPIRING_SOON_DAYS = 14;

export const daysUntil = (iso: string): number =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS));

/** Vigente = no suspendida y con fecha de fin en el futuro. */
export const isMembershipActive = (m: Membership | null): m is Membership =>
  !!m && m.status !== 'suspended' && new Date(m.ends_at).getTime() > Date.now();

/** Mensajes en español para los códigos de error de las RPCs. */
const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  no_genius_profile: 'Primero completa tu perfil de genio.',
  genius_suspended: 'Tu cuenta está suspendida. Escríbenos por WhatsApp.',
  invalid_code: 'Ese código no existe o ya no está activo.',
  expired_code: 'Ese código ya venció.',
  code_exhausted: 'Ese código ya alcanzó su límite de usos.',
  out_of_scope: 'Ese código no es válido para tu zona.',
  membership_suspended: 'Tu membresía está suspendida. Escríbenos por WhatsApp.',
  already_redeemed: 'Ya usaste un código beta en tu cuenta.',
  payments_disabled: 'Por ahora el pago anual no está disponible: el acceso es por invitación.',
  invalid_method: 'Elige un método de pago.',
  invalid_voucher: 'No pudimos leer tu comprobante. Súbelo de nuevo.',
  request_already_pending: 'Ya tienes un comprobante en revisión.',
};

export const describeError = (error: unknown): string => {
  const message = (error as { message?: string } | null)?.message ?? '';
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  return code ? ERROR_MESSAGES[code] : 'Algo salió mal. Inténtalo de nuevo en un momento.';
};

export const getMembership = async (geniusProfileId: string): Promise<Membership | null> => {
  const { data, error } = await supabase
    .from('memberships')
    .select('id, genius_profile_id, type, starts_at, ends_at, status, beta_code_id')
    .eq('genius_profile_id', geniusProfileId)
    .maybeSingle();

  if (error) {
    console.error('Error cargando la membresía:', error);
    return null;
  }
  return data as Membership | null;
};

/** La solicitud de pago más reciente del genio, si hay alguna. */
export const getLatestPaymentRequest = async (
  geniusProfileId: string
): Promise<PaymentRequestSummary | null> => {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('id, status, payment_method, amount, internal_notes, created_at, reviewed_at')
    .eq('genius_profile_id', geniusProfileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error cargando la solicitud de pago:', error);
    return null;
  }
  return data as PaymentRequestSummary | null;
};

export const getPaymentSettings = async (): Promise<PaymentSettings | null> => {
  const { data, error } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('Error cargando la configuración de pago:', error);
    return null;
  }
  return data as PaymentSettings | null;
};

export const redeemBetaCode = async (
  code: string
): Promise<{ ok: true; endsAt: string } | { ok: false; message: string }> => {
  const { data, error } = await supabase.rpc('redeem_beta_code', { p_code: code });
  if (error) return { ok: false, message: describeError(error) };
  return { ok: true, endsAt: (data as { ends_at: string }).ends_at };
};

const extensionFor = (type: string): string => {
  if (type === 'application/pdf') return 'pdf';
  return (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
};

/**
 * Sube un archivo a un bucket privado, dentro de la carpeta del usuario
 * (`<auth.uid()>/…`), y devuelve su ruta. Las imágenes se comprimen; los PDF
 * van tal cual.
 */
export const uploadPrivateFile = async (bucket: string, file: File, prefix: string): Promise<string> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('not_authenticated');

  const blob = file.type.startsWith('image/') ? await compressImage(file, GALLERY_PRESET) : file;
  const path = `${userId}/${prefix}-${Date.now()}.${extensionFor(blob.type)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
};

export const submitPaymentRequest = async (
  method: PaymentMethod,
  operationReference: string,
  voucher: File
): Promise<{ ok: true } | { ok: false; message: string }> => {
  try {
    const voucherPath = await uploadPrivateFile(PAYMENT_VOUCHERS_BUCKET, voucher, 'voucher');
    const { error } = await supabase.rpc('submit_payment_request', {
      p_payment_method: method,
      p_operation_reference: operationReference.trim(),
      p_voucher_path: voucherPath,
    });
    if (error) return { ok: false, message: describeError(error) };
    return { ok: true };
  } catch (error) {
    console.error('Error enviando el comprobante:', error);
    return { ok: false, message: describeError(error) };
  }
};

/**
 * URL temporal para ver un archivo privado (voucher o DNI). Acepta también
 * valores heredados: data-URLs base64 o URLs completas, que se devuelven igual.
 */
export const getPrivateFileUrl = async (bucket: string, pathOrUrl: string): Promise<string | null> => {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('data:') || /^https?:\/\//.test(pathOrUrl)) return pathOrUrl;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, 60 * 10);
  if (error) {
    console.error('Error generando el enlace del archivo:', error);
    return null;
  }
  return data.signedUrl;
};
