import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const VARIANTS = {
  success: {
    Icon: CheckCircle,
    iconCls: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/90',
    bar: 'bg-emerald-500',
  },
  error: {
    Icon: XCircle,
    iconCls: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-950/90',
    bar: 'bg-red-500',
  },
  warning: {
    Icon: AlertTriangle,
    iconCls: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-950/90',
    bar: 'bg-yellow-500',
  },
  info: {
    Icon: Info,
    iconCls: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/90',
    bar: 'bg-cyan-500',
  },
};

const DURATION = 4000;

function Toast({ id, message, type = 'info', onDismiss }) {
  const v = VARIANTS[type] ?? VARIANTS.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), DURATION);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl
                  backdrop-blur-md text-sm text-gray-100 overflow-hidden
                  animate-toast-in ${v.bg} ${v.border}`}
    >
      {/* progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar} animate-toast-bar`}
        style={{ animationDuration: `${DURATION}ms` }}
      />

      <v.Icon size={16} className={`mt-0.5 shrink-0 ${v.iconCls}`} />
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-gray-500 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// Toast state is managed in App.jsx — use addToast / dismissToast props.
// ToastContainer receives { toasts, onDismiss } and renders the stack.
