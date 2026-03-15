export default function ModeTransitionOverlay() {
  return (
    <div className="mode-transition-overlay" aria-hidden="true">
      <div className="mode-transition-overlay__scan" />
      <div className="mode-transition-overlay__glow" />
      <div className="mode-transition-overlay__copy">SYSTEM HANDOFF</div>
      <div className="mode-transition-overlay__subcopy">
        Synchronizing narrative stream...
      </div>
    </div>
  );
}
