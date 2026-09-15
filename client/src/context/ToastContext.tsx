import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Check, Info, X } from 'lucide-react';
import { cx } from '../lib/utils';

type ToastType = 'success' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              'pointer-events-auto flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg animate-toast-in',
              t.type === 'success' ? 'border-emerald-200' : 'border-slate-200',
            )}
          >
            <span
              className={cx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                t.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
              )}
            >
              {t.type === 'success' ? <Check size={14} /> : <Info size={14} />}
            </span>
            <p className="flex-1 text-sm font-medium text-slate-800">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
