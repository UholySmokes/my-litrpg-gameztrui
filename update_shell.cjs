const fs = require('fs');
const file = 'src/components/shell/AdventureShell.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetLines = `  const topMeters = [
    { label: "HP", value: formatMeter(player?.hp?.current, player?.hp?.max) },
    { label: "MP", value: formatMeter(player?.mana?.current, player?.mana?.max) },
    { label: "XP", value: formatMeter(player?.xp?.current, player?.xp?.max) },
    { label: "Gold", value: String(player?.currency?.goldCoins ?? player?.gold ?? 0) },
  ];`.replace(/\n/g, '\r\n');

const replaceLines = `  const archetypeView = useMemo(() => buildArchetypeSystemViewModel(player), [player]);
  const topMeters = useMemo(() => {
    const meters = [
      { label: "HP", value: formatMeter(player?.hp?.current, player?.hp?.max) },
      { label: "MP", value: formatMeter(player?.mana?.current, player?.mana?.max) },
      { label: "XP", value: formatMeter(player?.xp?.current, player?.xp?.max) },
      { label: "Gold", value: String(player?.currency?.goldCoins ?? player?.gold ?? 0) },
    ];
    if (archetypeView?.resource) {
      meters.push({
        label: archetypeView.resource.name,
        value: formatMeter(archetypeView.resource.current, archetypeView.resource.max)
      });
    }
    return meters;
  }, [player, archetypeView]);`.replace(/\n/g, '\r\n');

content = content.replace(targetLines, replaceLines);

// If it didn't find the \r\n version, try just \n
if (!content.includes('archetypeView')) {
  const normTarget = targetLines.replace(/\r\n/g, '\n');
  const normReplace = replaceLines.replace(/\r\n/g, '\n');
  content = content.replace(normTarget, normReplace);
}

fs.writeFileSync(file, content);
