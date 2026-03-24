export default function EntryShell({
  eyebrow = "Void-Verse // Browser Runtime",
  title,
  description,
  status = "",
  children = null,
  footer = null,
}) {
  return (
    <div className="entry-shell">
      <div className="entry-shell__backdrop" />
      <div className="entry-shell__grid">
        <section className="entry-shell__hero">
          <div className="entry-shell__eyebrow">{eyebrow}</div>
          <h1 className="entry-shell__title">{title}</h1>
          <p className="entry-shell__description">{description}</p>
          {status ? <div className="entry-shell__status">{status}</div> : null}
        </section>

        <section className="entry-shell__panel">{children}</section>
      </div>

      {footer ? <div className="entry-shell__footer">{footer}</div> : null}
    </div>
  );
}
