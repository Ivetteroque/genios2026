import React, { useState } from 'react';
import { X, Flag, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/authUtils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'profile' | 'comment';
  targetId: string;
  geniusProfileId?: string;
  targetLabel?: string;
}

const PROFILE_REASONS = [
  { value: 'false_info', label: 'Información falsa' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'misconduct', label: 'Mala conducta' },
  { value: 'other', label: 'Otro' },
];

const COMMENT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Lenguaje ofensivo' },
  { value: 'false_info', label: 'Información falsa' },
  { value: 'other', label: 'Otro' },
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  geniusProfileId,
  targetLabel,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = targetType === 'profile' ? PROFILE_REASONS : COMMENT_REASONS;
  const currentUser = getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setSubmitting(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: currentUser?.id ?? null,
        target_type: targetType,
        target_id: targetId,
        genius_profile_id: geniusProfileId ?? (targetType === 'profile' ? targetId : null),
        reason: selectedReason,
        details: details.trim(),
        status: 'pending',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedReason('');
        setDetails('');
        onClose();
      }, 2200);
    } catch {
      // silently fail — report attempt is best-effort
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setSelectedReason('');
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-[#FDFDFD] rounded-2xl shadow-xl w-full max-w-[320px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-250">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-5 py-5 flex flex-col gap-4">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-[#2F2F2F]">Reporte enviado</p>
              <p className="text-xs text-[#2F2F2F]/40 text-center leading-relaxed">
                Gracias, revisaremos este reporte.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-2.5 pt-0.5">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Flag className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#2F2F2F] leading-tight">
                    Reportar {targetType === 'profile' ? 'perfil' : 'comentario'}
                  </h2>
                  {targetLabel && (
                    <p className="text-[11px] text-[#2F2F2F]/35 truncate max-w-[200px]">{targetLabel}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Reason list */}
                <div className="flex flex-col gap-1.5">
                  {reasons.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedReason(value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all duration-100 ${
                        selectedReason === value
                          ? 'border-red-200 bg-red-50/60 text-[#2F2F2F]'
                          : 'border-gray-100 bg-white text-[#2F2F2F]/60 hover:border-gray-200 hover:text-[#2F2F2F]/80'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                            selectedReason === value
                              ? 'border-red-400 bg-red-400'
                              : 'border-gray-300'
                          }`}
                        />
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Optional details */}
                <div>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 300))}
                    placeholder="Cuéntanos más (opcional)"
                    rows={2}
                    className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 resize-none bg-white text-[#2F2F2F] placeholder:text-[#2F2F2F]/30 transition-colors"
                  />
                  {details.length > 0 && (
                    <p className="text-[10px] text-[#2F2F2F]/25 mt-0.5 text-right">{details.length}/300</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!selectedReason || submitting}
                  className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed bg-[#2F2F2F] hover:bg-[#2F2F2F]/85"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar reporte'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
