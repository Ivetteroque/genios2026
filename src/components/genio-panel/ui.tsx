import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';

/**
 * Piezas visuales del panel del genio, con los colores de la marca Genios
 * (celeste pastel, rosado, menta; tinta azul para acciones). La idea: pocas
 * cosas por pantalla, campos grandes y suaves, y errores solo cuando hacen falta.
 */

/** Botón principal (una sola acción fuerte por pantalla). */
export const btnPrimary =
  'h-12 rounded-xl bg-ink-blue hover:bg-[#355f9c] disabled:bg-gray-300 text-white font-semibold transition-colors';

/** Botón secundario. */
export const btnSecondary =
  'h-12 rounded-xl border border-gray-200 bg-white hover:bg-surface-blue text-text font-medium transition-colors';

/** Estilo único de cajas de texto: borde fino, alto cómodo para el dedo. */
export const inputClass = (invalid = false) =>
  `w-full h-12 px-4 rounded-xl border bg-white text-[16px] text-text placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 ${
    invalid ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary/40'
  }`;

export const textareaClass = (invalid = false) =>
  inputClass(invalid).replace('h-12', 'min-h-[140px] py-3 leading-relaxed resize-none');

/** Título de pantalla, con la tipografía de la marca. */
export const PageTitle: React.FC<{ title: string; subtitle?: React.ReactNode }> = ({ title, subtitle }) => (
  <div>
    <h2 className="font-heading text-2xl font-semibold text-text">{title}</h2>
    {subtitle && <p className="text-text/65 mt-1">{subtitle}</p>}
  </div>
);

/** Etiqueta + campo + ayuda o error. */
export const Field: React.FC<{
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, error, optional, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-text/85 mb-1.5">
      {label}
      {optional && <span className="font-normal text-gray-400"> (opcional)</span>}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-sm text-red-600 mt-1.5">{error}</p>
    ) : hint ? (
      <p className="text-sm text-text/55 mt-1.5">{hint}</p>
    ) : null}
  </div>
);

/** Aviso de privacidad para datos que no ve nadie más. */
export const PrivateNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="flex items-start gap-2 text-sm text-text/70 bg-surface-blue rounded-xl px-3 py-2.5">
    <Lock className="w-4 h-4 mt-0.5 shrink-0 text-ink-blue" />
    <span>{children}</span>
  </p>
);

/** Barra de acciones fija abajo (sobre la navegación inferior en el celular). */
export const BottomBar: React.FC<{ children: React.ReactNode; withPanelNav?: boolean }> = ({ children, withPanelNav = true }) => (
  <div className={`fixed inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100 ${
    withPanelNav ? 'bottom-16 lg:bottom-0 lg:left-56' : 'bottom-0'
  }`} style={withPanelNav ? undefined : { paddingBottom: 'env(safe-area-inset-bottom)' }}>
    <div className="max-w-xl mx-auto lg:mx-0 px-4 sm:px-6 lg:px-8 py-3 flex gap-3">{children}</div>
  </div>
);

/**
 * Pantalla de edición de una parte del perfil: volver, título, una frase de
 * ayuda, los campos, y la barra de guardar fija abajo (sin tapar nada).
 */
export const EditorShell: React.FC<{
  title: string;
  subtitle?: string;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, saving, onSave, onCancel, children }) => (
  <form className="max-w-xl" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
    <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-4 -ml-1 px-1 py-1">
      <ArrowLeft className="w-4 h-4" /> Mi perfil
    </button>
    <PageTitle title={title} subtitle={subtitle} />
    <div className="mt-6 space-y-6 pb-32 lg:pb-24">{children}</div>
    <BottomBar>
      <button type="button" onClick={onCancel} className={`flex-1 sm:flex-none sm:px-6 ${btnSecondary}`}>Cancelar</button>
      <button type="submit" disabled={saving} className={`flex-1 sm:flex-none sm:px-8 ${btnPrimary}`}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </BottomBar>
  </form>
);
