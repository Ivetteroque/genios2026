import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ToastDetail } from '../utils/toast';

/**
 * Avisos breves ("Guardado", "Enlace copiado") que aparecen abajo y se van
 * solos. Reemplazan a los alert() del navegador, que frenan todo y asustan.
 */
const ToastHost: React.FC = () => {
  const [toast, setToast] = useState<(ToastDetail & { id: number }) | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      setToast({ ...detail, id: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), detail.tone === 'error' ? 5000 : 2800);
    };
    window.addEventListener('app-toast', onToast);
    return () => {
      window.removeEventListener('app-toast', onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 bottom-24 lg:bottom-8 z-[60] flex justify-center px-4 pointer-events-none"
    >
      {toast && (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          {toast.tone === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ToastHost;
