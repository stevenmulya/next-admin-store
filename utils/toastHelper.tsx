import toast from 'react-hot-toast';

const toastBase = {
  borderRadius: '0px',
  fontSize: '9px',
  padding: '12px 16px',
  letterSpacing: '0.08em',
  maxWidth: '350px',
};

export const notifyError = (message: any) => {
  const displayMessage = typeof message === 'string' ? message : 'System Error';
  
  toast.error((t) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontWeight: 800 }}>[ ERROR ]</div>
      <div style={{ opacity: 0.9 }}>{displayMessage.toUpperCase()}</div>
      <div style={{ 
        marginTop: '6px', 
        paddingTop: '8px', 
        borderTop: '1px solid rgba(255,255,255,0.2)', 
        fontSize: '8px'
      }}>
        PLEASE CONTACT{' '}
        <a 
          href="https://wa.me/6287773298907" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: '#fff', fontWeight: 700 }}
        >
          SUPPORT
        </a>
        {' '}IF THE ISSUE PERSISTS.
      </div>
    </div>
  ), {
    id: displayMessage,
    position: 'bottom-right',
    icon: null,
    style: {
      ...toastBase,
      background: '#991b1b',
      color: '#ffffff',
      border: '1px solid #7f1d1d',
    },
    duration: 6000,
  });
};

export const notifySuccess = (message: string) => {
  toast.success((t) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontWeight: 800 }}>[ SUCCESS ]</div>
      <div style={{ opacity: 0.9 }}>{message.toUpperCase()}</div>
    </div>
  ), {
    id: message,
    position: 'bottom-right',
    icon: null,
    style: {
      ...toastBase,
      background: '#064e3b',
      color: '#ffffff',
      border: '1px solid #065f46',
    },
    duration: 3000,
  });
};