export interface PrestigeStats {
  prestigeLevel: number;
  soulShards: number; // Currency earned on reset
  xpMultiplier: number;
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
}