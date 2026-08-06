import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/translations';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  lang: AppLanguage;
  children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
  onClose,
  onConfirm,
  lang,
  children,
}) => {
  const t = translations[lang];
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    if (isSubmitting) return; // Prevent double submit
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#F2E3E1] animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-full ${
                isDanger ? 'bg-red-100 text-red-700' : 'bg-[#FAF0ED] text-[#D87085]'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#3D3835]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-[#3D3835]/40 hover:text-[#3D3835] rounded-full hover:bg-[#FAF0ED] transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-[#3D3835]/80 leading-relaxed">{message}</p>}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#FAF0ED]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-[#3D3835] bg-[#FAF0ED] hover:bg-[#F2E3E1] rounded-full transition disabled:opacity-50"
          >
            {cancelText || t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full shadow-2xs transition disabled:opacity-50 ${
              isDanger
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-[#E88D9F] hover:bg-[#D87085]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'th' ? 'กำลังประมวลผล...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirmText || t.confirm}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
