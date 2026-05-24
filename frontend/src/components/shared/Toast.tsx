import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Lightweight top-right toast system.
 *
 * Wrap the app (or any subtree) in <ToastProvider>. Anywhere underneath, call
 * useToast().push({ title, body, tone }) to emit a notification. Toasts stack,
 * auto-dismiss, and can be dismissed manually. No external animation library.
 */

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastInput {
  title: string;
  body?: ReactNode;
  tone?: ToastTone;
  /** Override default lifetime in ms. 0 = sticky. Default depends on tone. */
  duration?: number;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastContextValue {
  push: (t: ToastInput) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastTone, number> = {
  info: 5000,
  success: 4000,
  warning: 7000,
  error: 0, // sticky — user must dismiss
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback(
    (t: ToastInput): number => {
      const id = nextId.current++;
      const tone = t.tone ?? 'info';
      setToasts(prev => [...prev, { ...t, id, tone }]);
      const duration = t.duration ?? DEFAULT_DURATION[tone];
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() must be used inside <ToastProvider>.');
  }
  return ctx;
}

// ─── Container + card ─────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}>
          <ToastCard toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}

const TONE_STYLES: Record<
  ToastTone,
  { container: string; icon: ReactNode; title: string; body: string }
> = {
  info: {
    container: 'bg-white border-gray-200',
    icon: <Info className="w-4 h-4 text-indigo-500" />,
    title: 'text-gray-900',
    body: 'text-gray-600',
  },
  success: {
    container: 'bg-white border-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    title: 'text-emerald-800',
    body: 'text-emerald-700',
  },
  warning: {
    container: 'bg-white border-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    title: 'text-amber-800',
    body: 'text-amber-700',
  },
  error: {
    container: 'bg-white border-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
    title: 'text-red-800',
    body: 'text-red-700',
  },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  // Slide in on mount
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, []);

  const tone = toast.tone ?? 'info';
  const styles = TONE_STYLES[tone];

  return (
    <div
      role="status"
      className={[
        'pointer-events-auto rounded-lg border shadow-lg shadow-gray-900/5 px-4 py-3 flex items-start gap-3',
        'transition-all duration-200 ease-out',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
        styles.container,
      ].join(' ')}
    >
      <div className="shrink-0 mt-0.5">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.title}`}>{toast.title}</p>
        {toast.body && (
          <div className={`text-xs mt-1 leading-relaxed break-words ${styles.body}`}>
            {toast.body}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 -mr-1 -mt-1 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
