export interface ToastDetail {
  message: string;
  tone?: 'success' | 'error';
}

/** Muestra un aviso breve abajo de la pantalla (lo dibuja ToastHost). */
export const showToast = (message: string, tone: ToastDetail['tone'] = 'success') => {
  window.dispatchEvent(new CustomEvent<ToastDetail>('app-toast', { detail: { message, tone } }));
};
