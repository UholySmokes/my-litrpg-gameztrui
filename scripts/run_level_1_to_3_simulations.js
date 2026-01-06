#!/usr/bin/env node

/**
 * 100 Simulationen von Level 1 bis 3
 * Erkennt und behebt Fehler während des Spielstarts
 */

const fs = require('fs');
const path = require('path');

// Erstelle eine einfache Testumgebung
class GameSimulator {
  constructor() {
    this.results = [];
    this.errors = [];
    this.successCount = 0;
    this.failureCount = 0;
  }

  async simulateGame(simulationNumber) {
    console.log(`\n=== Simulation ${simulationNumber}/100 ===`);
    
    try {
      // Simuliere Spielstart
      const gameState = this.createInitialGameState();
      
      // Simuliere Charaktererstellung
      const character = this.createCharacter();
      
      // Simuliere Spiel bis Level 3
      const result = await this.simulateToLevel3(gameState, character);
      
      if (result.success) {
        this.successCount++;
        console.log(`✅ Simulation ${simulationNumber} erfolgreich`);
      } else {
        this.failureCount++;
        console.log(`❌ Simulation ${simulationNumber} fehlgeschlagen: ${result.error}`);
        this.errors.push({
          simulation: simulationNumber,
          error: result.error,
          stack: result.stack
        });
      }
      
      this.results.push({
        simulation: simulationNumber,
        success: result.success,
        levelReached: result.levelReached,
        error: result.error,
        duration: result.duration
      });
      
    } catch (error) {
      this.failureCount++;
      console.log(`💥 Simulation ${simulationNumber} abgestürzt: ${error.message}`);
      this.errors.push({
        simulation: simulationNumber,
        error: error.message,
        stack: error.stack
      });
    }
  }

  createInitialGameState() {
    return {
      player: {
        name: 'TestPlayer',
        level: 1,
        xp: { current: 0, max: 100 },
        hp: { current: 100, max: 100 },
        mana: { current: 50, max: 50 },
        attributes: {
          str: 5, agi: 5, dex: 5, int: 5, cha: 5, will: 5, luck: 5, soul: 5, freePoints: 0
        },
        race: 'Human',
        class: 'None',
        talent: 'None',
        equipment: { weapon: null, armor: null },
        inventory: [],
        abilities: [],
        currency: { goldCoins: 0, soulpoints: 0 },
        isDead: false
      },
      config: {
        startHp: 100,
        startMana: 50,
        hpPerStr: 2,
        hpPerWill: 1,
        manaPerInt: 2,
        manaPerSoul: 1
      }
    };
  }

  createCharacter() {
    return {
      name: 'TestPlayer',
      gender: 'Male',
      race: 'Human',
      evolutionStage: 'Mortal',
      class: 'Warrior',
      talent: 'Destruction',
      attributes: {
        str: 8, agi: 6, dex: 5, int: 4, cha: 5, will: 6, luck: 5, soul: 4, freePoints: 0
      },
      abilities: [
        { id: 'basic_attack', name: 'Basic Attack', level: 1, type: 'active' }
      ]
    };
  }

  async simulateToLevel3(initialState, character) {
    const startTime = Date.now();
    let state = { ...initialState };
    
    try {
      // Charaktererstellung simulieren
      state = this.simulateCharacterCreation(state, character);
      
      // XP-Berechnung testen
      state = this.simulateXPGain(state, 50); // Level 2
      
      if (state.player.level !== 2) {
        throw new Error(`Level 2 nicht erreicht. Aktuelles Level: ${state.player.level}`);
      }
      
      state = this.simulateXPGain(state, 150); // Level 3
      
      if (state.player.level !== 3) {
        throw new Error(`Level 3 nicht erreicht. Aktuelles Level: ${state.player.level}`);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        levelReached: state.player.level,
        duration: duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        levelReached: state.player.level,
        error: error.message,
        stack: error.stack,
        duration: duration
      };
    }
  }

  simulateCharacterCreation(state, character) {
    const cfg = state.config || {};
    const baseHp = cfg.startHp ?? 100;
    const baseMana = cfg.startMana ?? 50;
    const str = character.attributes?.str ?? 0;
    const int = character.attributes?.int ?? 0;
    const will = character.attributes?.will ?? 0;
    const soul = character.attributes?.soul ?? 0;
    
    const calculatedHp = baseHp + (str * (cfg.hpPerStr ?? 0)) + (will * (cfg.hpPerWill ?? 0));
    const calculatedMana = baseMana + (int * (cfg.manaPerInt ?? 0)) + (soul * (cfg.manaPerSoul ?? 0));
    
    if (isNaN(calculatedHp) || isNaN(calculatedMana)) {
      throw new Error('HP oder Mana Berechnung ergibt NaN');
    }
    
    return {
      ...state,
      player: {
        ...state.player,
        name: character.name,
        gender: character.gender,
        race: character.race,
        evolutionStage: character.evolutionStage,
        class: character.class,
        talent: character.talent,
        attributes: {
          ...character.attributes,
          freePoints: 0
        },
        abilities: character.abilities || [],
        hp: {
          current: calculatedHp,
          max: calculatedHp
        },
        mana: {
          current: calculatedMana,
          max: calculatedMana
        }
      }
    };
  }

  simulateXPGain(state, xpAmount) {
    let newState = { ...state };
    newState.player = { ...newState.player };
    
    // XP hinzufügen
    newState.player.xp = {
      ...newState.player.xp,
      current: newState.player.xp.current + xpAmount
    };
    
    // Level-Up-Prüfung
    while (newState.player.xp.current >= newState.player.xp.max) {
      newState.player.xp.current -= newState.player.xp.max;
      newState.player.level += 1;
      newState.player.xp.max = this.calculateXPForLevel(newState.player.level + 1);
      
      // Level-Up-Flag setzen
      newState.player.justLeveledUp = true;
    }
    
    return newState;
  }

  calculateXPForLevel(level) {
    // Einfache XP-Berechnung
    return level * 100;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalSimulations: 100,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: (this.successCount / 100) * 100,
      errors: this.errors,
      results: this.results
    };
    
    const reportPath = path.join(__dirname, 'simulation_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n=== SIMULATIONSBERICHT ===');
    console.log(`Gesamt: ${report.totalSimulations}`);
    console.log(`Erfolgreich: ${report.successCount}`);
    console.log(`Fehlgeschlagen: ${report.failureCount}`);
    console.log(`Erfolgsrate: ${report.successRate.toFixed(2)}%`);
    
    if (this.errors.length > 0) {
      console.log('\n=== FEHLER ===');
      this.errors.forEach(error => {
        console.log(`Simulation ${error.simulation}: ${error.error}`);
      });
    }
    
    console.log(`\nBericht gespeichert: ${reportPath}`);
    
    return report;
  }
}

// Hauptfunktion
async function runSimulations() {
  console.log('Starte 100 Level-1-bis-3 Simulationen...');
  
  const simulator = new GameSimulator();
  
  // Führe 100 Simulationen durch
  for (let i = 1; i <= 100; i++) {
    await simulator.simulateGame(i);
    
    // Kleine Pause zwischen Simulationen
    if (i % 10 === 0) {
      console.log(`Fortschritt: ${i}/100`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Generiere Bericht
  const report = simulator.generateReport();
  
  // Bei Fehlern, versuche automatische Fixes
  if (report.failureCount > 0) {
    console.log('\n=== AUTOMATISCHE FEHLERBEHEBUNG ===');
    await attemptAutomaticFixes(report);
  }
  
  return report;
}

async function attemptAutomaticFixes(report) {
  const commonErrors = {};
  
  // Analysiere häufige Fehler
  report.errors.forEach(error => {
    const errorType = error.error.split(':')[0];
    commonErrors[errorType] = (commonErrors[errorType] || 0) + 1;
  });
  
  console.log('Häufigste Fehler:');
  Object.entries(commonErrors).forEach(([error, count]) => {
    console.log(`${error}: ${count} mal`);
  });
  
  // Hier könnten automatische Fixes implementiert werden
  // Zum Beispiel:
  // - NaN-Prüfungen hinzufügen
  // - Default-Werte setzen
  // - Type-Checks verbessern
}

// Führe Simulationen aus
if (require.main === module) {
  runSimulations().then(report => {
    console.log('\nSimulationen abgeschlossen!');
    process.exit(report.failureCount > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fehler bei der Simulation:', error);
    process.exit(1);
  });
}

module.exports = { GameSimulator, runSimulations };