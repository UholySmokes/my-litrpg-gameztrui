import { useEffect, useRef } from "react";

export default function SurfaceDialog({
  isOpen,
  onClose,
  title,
  subtitle = "",
  size = "lg",
  tone = "azure",
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="surface-dialog" onClick={onClose}>
      <div
        className={`surface-dialog__panel surface-dialog__panel--${size} surface-dialog__panel--tone-${tone}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="surface-dialog__header">
          <div>
            <div className="surface-dialog__title">{title}</div>
            {subtitle ? (
              <div className="surface-dialog__subtitle">{subtitle}</div>
            ) : null}
          </div>
          <button
            type="button"
            className="holo-button holo-button--danger"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="surface-dialog__body">{children}</div>
      </div>
    </div>
  );
}
