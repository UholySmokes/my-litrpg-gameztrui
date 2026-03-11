import QuestTracker from "../../components/QuestTracker.jsx";

export default function QuestPanel({ quests, storyHint = "" }) {
  return <QuestTracker quests={quests} storyHint={storyHint} />;
}
