import {useCallback, useEffect, useRef} from "react";

export default function SurfaceDialog({
  isOpen,
  onClose,
  title,
  subtitle = "",
  size = "lg",
  tone = "azure",
  fullscreen = false,
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const stableClose = useCallback(() => onCloseRef.current?.(), []);

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
      stableClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, stableClose]);

  if (!isOpen) return null;

  return (
    <div
      className={["surface-dialog", fullscreen ? "surface-dialog--fullscreen" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClose}
    >
      <div
        className={[
          "surface-dialog__panel",
          `surface-dialog__panel--${size}`,
          `surface-dialog__panel--tone-${tone}`,
          fullscreen ? "surface-dialog__panel--fullscreen" : "",
        ]
          .filter(Boolean)
          .join(" ")}
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
