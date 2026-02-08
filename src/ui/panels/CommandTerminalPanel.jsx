import styles from './CommandTerminalPanel.module.css';

export default function CommandTerminalPanel({
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  inputRef,
}) {
  return (
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
  );
}
