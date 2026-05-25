import { X } from "lucide-react";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  const handleEsc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${widths[size]} bg-white rounded-lg shadow-lg`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
