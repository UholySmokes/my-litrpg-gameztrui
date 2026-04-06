import { useEffect, useState } from "react";
import styles from './CommandTerminalPanel.module.css';

const NOOP = () => {};

export default function CommandTerminalPanel({
  userInput = "",
  onInputChange = NOOP,
  onSubmit,
  isLoading = false,
  error = null,
  inputRef,
  placeholder = "",
}) {
  const [landscapeMobile, setLandscapeMobile] = useState(false);
  const errorId = error ? "command-terminal-error" : undefined;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 900px) and (orientation: landscape)");
    const onChange = () => setLandscapeMobile(media.matches);
    onChange();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  return (
    <div className={styles.container}>
      {landscapeMobile ? (
        <div className={styles.orientationWarning} role="status" aria-live="polite">
          Rotate to portrait for the most reliable command input layout.
        </div>
      ) : null}
      {error ? (
        <div
          id={errorId}
          className={styles.errorBanner}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      ) : null}
      <form onSubmit={onSubmit} className={styles.commandDeck} aria-label="Command terminal">
        <label className={styles.srOnly} htmlFor="command-terminal-input">
          Command input
        </label>
        <input
          id="command-terminal-input"
          ref={inputRef}
          type="text"
          className={styles.inputField}
          value={userInput}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="send"
          placeholder={placeholder}
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
        />
        <button className={styles.submitButton} type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Execute"}
        </button>
      </form>
    </div>
  );
}
