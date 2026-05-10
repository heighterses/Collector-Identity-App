import { useEffect, useRef } from 'react';

/**
 * ConfirmModal — reusable themed confirmation dialog.
 *
 * Props:
 *   isOpen      {boolean}  — controls visibility
 *   title       {string}   — modal heading
 *   message     {string}   — body copy
 *   confirmLabel {string}  — confirm button text (default: "Confirm")
 *   cancelLabel  {string}  — cancel button text  (default: "Cancel")
 *   onConfirm   {fn}       — called when user confirms
 *   onCancel    {fn}       — called when user cancels or dismisses
 *   danger      {boolean}  — when true, confirm button uses btn-danger style
 */
const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) => {
  const cancelBtnRef  = useRef(null);
  const confirmBtnRef = useRef(null);

  // Focus the cancel button when the modal opens (safe default)
  useEffect(() => {
    if (isOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [isOpen]);

  // ESC key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
      // Basic focus trap: Tab cycles only between the two buttons
      if (e.key === 'Tab') {
        const els = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean);
        if (!els.length) return;
        const first = els[0];
        const last  = els[els.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
      style={{ zIndex: 600 }}
    >
      {/* Stop clicks inside the modal from bubbling to the backdrop */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3 className="modal-title" id="confirm-modal-title">{title}</h3>
        </div>

        <div className="modal-body">
          <p className="modal-message" id="confirm-modal-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            ref={cancelBtnRef}
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
