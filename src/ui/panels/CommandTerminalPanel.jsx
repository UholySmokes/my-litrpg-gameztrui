import styles from './CommandTerminalPanel.module.css';

export default function CommandTerminalPanel({
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  inputRef,
}) {
  return (
    <div className={styles.container}>
      {error ? (
        <div className={styles.errorBanner} role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}
      <form onSubmit={onSubmit} className={styles.commandDeck}>
        <input
          ref={inputRef}
          type="text"
          className={styles.inputField}
          placeholder="Enter command..."
          value={userInput}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={isLoading}
        />
        <button className={styles.submitButton} type="submit" disabled={isLoading}>
          {isLoading ? "..." : "[EXECUTE]"}
        </button>
      </form>
    </div>
  );
}
