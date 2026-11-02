import React from 'react';
import { AlertTriangle, Trash2, ShieldCheck, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  confirmVariant?: 'danger' | 'warning' | 'yellow';
  onConfirm: () => void;
  onCancel: () => void;
  lang?: 'vi' | 'en';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDangerous = true,
  confirmVariant,
  onConfirm,
  onCancel,
  lang = 'vi'
}) => {
  if (!isOpen) return null;

  const defaultConfirm = confirmLabel || (lang === 'vi' ? 'Xác nhận' : 'Confirm');
  const defaultCancel = cancelLabel || (lang === 'vi' ? 'Hủy' : 'Cancel');
  const variant = confirmVariant || (isDangerous ? 'danger' : 'yellow');

  const isYellow = variant === 'yellow';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className={`w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col bg-slate-900 border rounded-2xl shadow-2xl text-slate-100 relative ${
          isYellow ? 'border-amber-500/60 shadow-amber-950/40' : 'border-slate-700/80 shadow-rose-950/40'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle accent glow - clipped strictly inside container */}
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
            isYellow ? 'bg-amber-500/15' : 'bg-rose-500/10'
          }`}
        />

        <div className="p-6 overflow-y-auto overflow-x-hidden relative z-10">

        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isYellow
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
          >
            {isYellow ? (
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>{title}</span>
              <button
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons: Cancel (Gray) & Confirm (Yellow or Red) */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-700/90 text-slate-300 border border-slate-700 transition cursor-pointer shadow-sm"
          >
            {defaultCancel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 ${
              isYellow
                ? 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 border border-amber-300 shadow-amber-500/25 ring-2 ring-amber-400/20'
                : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border border-rose-500/40 shadow-rose-950/40'
            }`}
          >
            {!isYellow && isDangerous && <Trash2 className="w-3.5 h-3.5" />}
            {isYellow && <span className="text-sm">👮</span>}
            <span>{defaultConfirm}</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
