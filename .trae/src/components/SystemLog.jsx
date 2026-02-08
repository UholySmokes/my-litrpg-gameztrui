import React, { useState, useEffect } from "react";
import { EventBus } from "../core/EventBus.js";

const styles = {
  container: {
    height: "200px",
    overflowY: "auto",
    background: "rgba(0, 0, 0, 0.8)",
    border: "1px solid rgba(0, 243, 255, 0.2)",
    borderRadius: "4px",
    padding: "0.5rem",
    fontFamily: "monospace",
    fontSize: "0.75rem",
    color: "#00F3FF",
  },
  entry: {
    marginBottom: "0.25rem",
    opacity: 0.8,
    transition: "opacity 0.3s ease",
  },
  damage: {
    color: "#FF6B6B",
  },
  heal: {
    color: "#51CF66",
  },
  xp: {
    color: "#FFD700",
  },
  level: {
    color: "#A78BFA",
  },
};

export default function SystemLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const handleEvent = (event) => {
      const timestamp = new Date().toLocaleTimeString();
      let entry = { timestamp, text: "", type: "default" };

      switch (event.type) {
        case "combat:damage":
          entry.text = `⚔️ ${event.attacker} dealt ${event.damage} to ${event.target}`;
          entry.type = "damage";
          break;
        case "combat:heal":
          entry.text = `💚 ${event.target} healed for ${event.amount}`;
          entry.type = "heal";
          break;
        case "xp:gained":
          entry.text = `✨ +${event.amount} XP`;
          entry.type = "xp";
          break;
        case "level:up":
          entry.text = `⬆️ LEVEL UP! Now level ${event.level}`;
          entry.type = "level";
          break;
        default:
          entry.text = `📡 ${event.type}: ${JSON.stringify(event.data)}`;
      }

      setLogs((prev) => [...prev.slice(-50), entry]); // Keep last 50 entries
    };

    EventBus.on("system:log", handleEvent);
    return () => EventBus.off("system:log", handleEvent);
  }, []);

  return (
    <div style={styles.container}>
      {logs.map((log, index) => (
        <div key={index} style={{ ...styles.entry, ...styles[log.type] }}>
          [{log.timestamp}] {log.text}
        </div>
      ))}
    </div>
  );
}
