import toast from 'react-hot-toast';

const toastBase = {
  borderRadius: '2px',
  fontSize: 'var(--font-sm)',
  padding: '10px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  border: '1px solid var(--border-color)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

export const notifyError = (error: any) => {
  let displayMessage = 'SYSTEM ERROR';

  if (typeof error === 'string') {
    displayMessage = error;
  } else if (error?.message) {
    displayMessage = Array.isArray(error.message) ? error.message[0] : error.message;
  } else if (error?.error) {
    displayMessage = error.error;
  }

  toast.error(displayMessage, {
    id: displayMessage,
    position: 'bottom-right',
    style: {
      ...toastBase,
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      borderLeft: '3px solid var(--danger)',
    },
    duration: 4000,
  });
};

export const notifySuccess = (message: string) => {
  toast.success(message, {
    id: message,
    position: 'bottom-right',
    style: {
      ...toastBase,
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      borderLeft: '3px solid var(--success)',
    },
    duration: 3000,
  });
};