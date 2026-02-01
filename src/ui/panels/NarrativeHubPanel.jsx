import { useState } from "react";
import NarrativeLogPanel from "./NarrativeLogPanel.jsx";
import NarrativeMemoryPanel from "./NarrativeMemoryPanel.jsx";

export default function NarrativeHubPanel({
  entries = [],
  summary = "",
  latestEntry = null,
  latestEntryText = "",
  memoryRef,
}) {
  const [activeTab, setActiveTab] = useState("log");

  return (
    <div className="narrative-hub">
      <div className="narrative-hub__tabs">
        <button
          type="button"
          className={`holo-button ${
            activeTab === "log" ? "narrative-hub__tab--active" : ""
          }`}
          onClick={() => setActiveTab("log")}
          aria-pressed={activeTab === "log"}
        >
          Log
        </button>
        <button
          type="button"
          className={`holo-button ${
            activeTab === "memory" ? "narrative-hub__tab--active" : ""
          }`}
          onClick={() => setActiveTab("memory")}
          aria-pressed={activeTab === "memory"}
        >
          Memory
        </button>
      </div>
      <div className="narrative-hub__content">
        {activeTab === "log" ? (
          <NarrativeLogPanel entries={entries} />
        ) : (
          <NarrativeMemoryPanel
            summary={summary}
            entries={entries}
            latestEntry={latestEntry}
            latestEntryText={latestEntryText}
            containerRef={memoryRef}
          />
        )}
      </div>
    </div>
  );
}
