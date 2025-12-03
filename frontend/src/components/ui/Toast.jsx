import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

let id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const toast = { id: ++id, title, description, variant };
    setToasts((t) => [...t, toast]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, duration);
    }
  }, []);

  const remove = useCallback((toastId) => {
    setToasts((t) => t.filter((x) => x.id !== toastId));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: notify, remove }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full rounded-lg border p-3 shadow-md flex items-start gap-3 bg-card ${
              t.variant === 'error' ? 'border-red-700/30' : t.variant === 'success' ? 'border-green-700/30' : 'border-slate-700/30'
            }`}
          >
            <div className="flex-1">
              {t.title && <div className="font-semibold text-sm">{t.title}</div>}
              {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
            </div>
            <button className="p-1" onClick={() => remove(t.id)} aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
};

export default ToastProvider;
