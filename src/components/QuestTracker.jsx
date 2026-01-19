import React from "react";

const styles = {
  container: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  quest: {
    marginBottom: "1rem",
    padding: "0.75rem",
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(0, 243, 255, 0.2)",
    borderRadius: "4px",
  },
  questTitle: {
    color: "#FFD700",
    fontFamily: "monospace",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    textShadow: "0 0 3px rgba(255, 215, 0, 0.3)",
  },
  objective: {
    color: "#00F3FF",
    fontFamily: "monospace",
    fontSize: "0.8rem",
    marginLeft: "1rem",
    marginBottom: "0.25rem",
    opacity: 0.8,
  },
  objectiveCompleted: {
    textDecoration: "line-through",
    opacity: 0.4,
  },
  emptyText: {
    color: "rgba(0, 243, 255, 0.5)",
    fontFamily: "monospace",
    fontStyle: "italic",
    textAlign: "center",
    padding: "2rem",
  },
};

export default function QuestTracker({ quests }) {
  const activeQuests = quests?.active || [];

  if (activeQuests.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyText}>[ NO ACTIVE QUESTS ]</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {activeQuests.map((quest) => (
        <div key={quest.id} style={styles.quest}>
          <div style={styles.questTitle}>{quest.name || quest.id}</div>
          {quest.objectives?.map((objective, index) => (
            <div
              key={index}
              style={{
                ...styles.objective,
                ...(objective.completed ? styles.objectiveCompleted : {}),
              }}
            >
              ▸ {objective.description || `Objective ${index + 1}`}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
