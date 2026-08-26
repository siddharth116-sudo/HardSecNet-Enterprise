import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Usage in App:
 *   const [dialog, setDialog] = useState(null);
 *   const askConfirm = (msg, onOk) => setDialog({ message: msg, onConfirm: onOk });
 *
 *   <ConfirmDialog dialog={dialog} onClose={() => setDialog(null)} />
 */
export default function ConfirmDialog({ dialog, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!dialog) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dialog, onClose]);

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.onConfirm?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md
                   shadow-2xl animate-dialog-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Cancel"
        >
          <X size={16} />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
            <AlertTriangle className="text-red-400" size={20} />
          </div>
          <h3 className="text-white font-semibold text-base">
            {dialog.title ?? 'Confirm Action'}
          </h3>
        </div>

        {/* Message */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {dialog.message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700
                       hover:border-gray-500 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors
                       bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30"
          >
            {dialog.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
