/**
 * @experimental
 * This module is not yet wired into the runtime reducer/engine loop.
 * Keep it isolated until integration criteria in docs/EXPERIMENTAL_SYSTEMS.md
 * are satisfied.
 */
export interface PrestigeStats {
  prestigeLevel: number;
  soulShards: number; // Currency earned on reset
  xpMultiplier: number;
  upgrades: { [key: string]: number }; // Store upgrade levels e.g. { 'damage': 1, 'gold': 2 }
}

export class PrestigeSystem {
  // Calculate shards earned based on current level
  calculateShards(currentLevel: number): number {
    if (currentLevel < 50) return 0; // Minimum level to prestige
    return Math.floor(Math.pow(currentLevel, 1.5) / 100);
  }

  // Perform the prestige reset
  performPrestige(player: any): void {
    const shardsEarned = this.calculateShards(player.level);
    
    if (shardsEarned === 0) {
      console.log("Not high enough level to prestige.");
      return;
    }

    // 1. Update Prestige Stats
    player.prestige.prestigeLevel += 1;
    player.prestige.soulShards += shardsEarned;
    
    if (!player.prestige.upgrades) {
      player.prestige.upgrades = { damage: 0, gold: 0 };
    }
    
    // 2. Apply Multipliers (10% XP boost per prestige level)
    player.prestige.xpMultiplier = 1 + (player.prestige.prestigeLevel * 0.10);

    // 3. Reset Player State
    console.log(`Prestiged! Earned ${shardsEarned} Soul Shards.`);
    this.resetPlayer(player);
  }

  private resetPlayer(player: any): void {
    player.level = 1;
    player.xp = 0;
    player.maxHp = 100; // Base HP
    // Keep inventory? Optional based on game design
    // player.inventory = []; 
    
    // Force recalculate stats based on new prestige multipliers
    player.recalculateStats();
  }

  // New: Spend shards to buy permanent upgrades
  buyUpgrade(player: any, type: 'damage' | 'gold' | 'mana' | 'health'): boolean {
    const currentLevel = player.prestige.upgrades[type] || 0;
    const cost = 10 * (currentLevel + 1); // Cost scales: 10, 20, 30...

    if (player.prestige.soulShards >= cost) {
      player.prestige.soulShards -= cost;
      player.prestige.upgrades[type] = currentLevel + 1;
      console.log(`Upgraded ${type} to level ${currentLevel + 1}`);
      return true;
    }
    console.log("Not enough Soul Shards.");
    return false;
  }
}
