import styles from './CommandTerminalPanel.module.css';

export default function CommandTerminalPanel({
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  inputRef,
}) {
  const errorId = error ? "command-terminal-error" : undefined;

  return (
    <div className={styles.container}>
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
          placeholder="Enter command..."
          value={userInput}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
        />
        <button className={styles.submitButton} type="submit" disabled={isLoading}>
          {isLoading ? "..." : "[EXECUTE]"}
        </button>
      </form>
    </div>
  );
}
