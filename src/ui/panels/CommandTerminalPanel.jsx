export default function CommandTerminalPanel({
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  inputRef,
}) {
  return (
    <form onSubmit={onSubmit} className="command-deck__input">
      <input
        ref={inputRef}
        type="text"
        className="command-deck__input-field"
        placeholder="Enter command..."
        value={userInput}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={isLoading}
      />
      <button className="holo-button" type="submit" disabled={isLoading}>
        {isLoading ? "..." : "[EXECUTE]"}
      </button>
    </form>
  );
}
