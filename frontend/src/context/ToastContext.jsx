import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000); // auto dismiss after 4s
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map(toast => {
          const bg = toast.type === 'error' ? 'var(--accent-red)' : toast.type === 'success' ? 'var(--accent-green)' : 'var(--primary)';
          return (
            <div key={toast.id} style={{
              background: 'var(--surface)',
              borderLeft: `4px solid ${bg}`,
              padding: '16px 20px',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: '280px',
              animation: 'slideInRight 0.3s ease-out forwards'
            }}>
              {toast.message}
              <button 
                onClick={() => removeToast(toast.id)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
