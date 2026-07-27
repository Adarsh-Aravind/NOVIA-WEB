import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body> so the fixed overlay is measured against the viewport, not
  // a transformed ancestor (the page's .fade-up wrapper), which would otherwise
  // trap it inside the content column and break full-screen centering.
  return createPortal(
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card fade-up" style={{ maxWidth }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 18 }}>
          <h2 className="display" style={{ fontSize: 21 }}>
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
