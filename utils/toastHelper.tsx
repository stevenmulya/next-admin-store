import toast from 'react-hot-toast';
import React from 'react';
import { X } from 'lucide-react';

export const notifyError = (message: string) => {
    toast.error((t) => (
        <div style={{ width: '100%', minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', lineHeight: '1.4', paddingRight: '10px' }}>
                    {message}
                </span>
                
                <button 
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#737373',
                        cursor: 'pointer',
                        padding: '0',
                        marginTop: '2px',
                        display: 'flex'
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            <div style={{ 
                borderTop: '1px solid #262626',
                paddingTop: '6px',
                marginTop: '4px',
                fontSize: '11px',
                color: '#737373',
                fontFamily: 'sans-serif'
            }}>
                Technical issue?{' '}
                <a 
                    href="https://wa.me/6287773298907" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                        color: '#e5e5e5',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        marginLeft: '2px'
                    }}
                >
                    Contact Support
                </a>
            </div>
        </div>
    ), { 
        id: message, 
        duration: 6000, 
        position: 'bottom-right',
        style: {
            background: '#0a0a0a',
            border: '1px solid #262626',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        },
        iconTheme: {
            primary: '#ffffff',
            secondary: '#000000',
        },
    });
};