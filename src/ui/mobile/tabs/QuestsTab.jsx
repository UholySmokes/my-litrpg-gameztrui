import React from "react";
import QuestPanel from "../../panels/QuestPanel.jsx";

export default function QuestsTab({ quests }) {
  return (
    <div className="mobile-quests-tab">
      <QuestPanel quests={quests} />
    </div>
  );
}
