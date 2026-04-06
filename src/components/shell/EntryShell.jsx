import animeMagicCircle from "../../assets/anime-magic-circle.svg";
import animeHero from "../../assets/anime-hero-silhouette.svg";

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
        <section className="entry-shell__hero anime-slide-up">
          <img src={animeMagicCircle} alt="" className="entry-shell__magic-circle anime-float" aria-hidden="true" />
          <img src={animeHero} alt="" className="entry-shell__hero-silhouette anime-slide-up" aria-hidden="true" />
          <div className="entry-shell__eyebrow anime-shimmer">{eyebrow}</div>
          <h1 className="entry-shell__title anime-dramatic">{title}</h1>
          <p className="entry-shell__description">{description}</p>
          {status ? <div className="entry-shell__status anime-pulse">{status}</div> : null}
        </section>

        <section className="entry-shell__panel anime-slide-right">{children}</section>
      </div>

      {footer ? <div className="entry-shell__footer anime-slide-up">{footer}</div> : null}
    </div>
  );
}
