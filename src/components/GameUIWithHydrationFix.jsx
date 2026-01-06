// GameUI.jsx with Hydration Fix
import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine } from '../hook/usegamestate';
import { useNarrative } from '../hook/useNarrative';
import { renderstatusblock } from '../util/statusrenderer.js';
import { formatNumberCompact } from '../util/numberFormat.js';
import AuthUI from './AuthUI';
import SaveLoadUI from './SaveLoadUI';
import SaveLoadScreen from './SaveLoadScreen';
import CharacterCreation from './CharacterCreation';
import CombatUI from './CombatUI';
import ShopUI from './ShopUI';
import GachaUI from './GachaUI';
import QuestLogUI from './QuestLogUI';
import TitleUI from './TitleUI';
import { playerAttack, processEnemyTurns, escapeCombat, startCombat } from '../systems/combat/CombatSystem.js';
import { addItem } from '../systems/inventory/InventorySystem.js';
import { titleDatabase } from '../data/titleData.js';
import { consumeMana, canAffordSkill } from '../systems/magic/ManaSystem.js';
import { calculateManaCost } from '../systems/magic/ManaBalance.js';

export default function GameUI() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const [isLocalGame] = useState(() => {
    return isMounted ? localStorage.getItem('localGame') === 'true' : false;
  });
  
  const [showSaveLoad, setShowSaveLoad] = useState(() => {
    // Show save/load screen if user is logged in (not local game) and no character data exists
    if (!isMounted) return false;
    
    const hasCharacter = localStorage.getItem('characterCreated') === 'true';
    const saveLoaded = localStorage.getItem('saveLoaded') === 'true';
    const isLocal = localStorage.getItem('localGame') === 'true';
    return !hasCharacter && !saveLoaded && !isLocal;
  });
  
  const [characterCreated, setCharacterCreated] = useState(() => {
    // Check if character was already created or loaded from save
    if (!isMounted) return false;
    
    return localStorage.getItem('characterCreated') === 'true' || 
           localStorage.getItem('saveLoaded') === 'true';
  });
  
  const { 
    state, 
    chatLog, 
    acknowledgeLevelUp,
    addSystemMessage,
    setState,
    saveGame,
    loadGame,
    getSavesList,
    deleteSave,
    isSaving,
    lastSaveTime,
    currentUserId,
    handleAuthChange
  } = useGameEngine();
  
  const { submitInput, generateInitialNarrativeText, isLoading, error } = useNarrative(setState, addSystemMessage);
  
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [userInput, setUserInput] = useState('');
  const [glitchActive, setGlitchActive] = useState(false);
  const previousHp = useRef(state.player?.hp?.current ?? 100);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('animationsEnabled') === 'false' ? false : true } catch { return true }
  });
  const [typingSpeed, setTypingSpeed] = useState(() => {
    if (typeof window === 'undefined') return 40;
    try { const v = parseInt(localStorage.getItem('typingSpeed') || '40', 10); return Math.min(50, Math.max(30, isNaN(v) ? 40 : v)) } catch { return 40 }
  });
  const [skipTyping, setSkipTyping] = useState(false);
  const [currentTypedIndex, setCurrentTypedIndex] = useState(0);
  
  // Modal states
  const [showShop, setShowShop] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showTitleSystem, setShowTitleSystem] = useState(false);
  
  // Action suggestions state
  const [actionSuggestions, setActionSuggestions] = useState([]);
  
  // Mana system state
  const [manaAnimation, setManaAnimation] = useState('');
  const [manaFeedback, setManaFeedback] = useState(null);

  // Check if character data exists in state (from loaded save)
  useEffect(() => {
    if (state.player && state.player.name && state.player.name !== 'User' && 
        state.player.race && state.player.race !== 'Human' &&
        state.player.class && state.player.class !== 'None') {
      // Character data exists, mark as created
      if (isMounted) {
        localStorage.setItem('characterCreated', 'true');
        localStorage.setItem('saveLoaded', 'true');
      }
      setCharacterCreated(true);
      setShowSaveLoad(false);
    }
  }, [state.player, isMounted]);

  // Reset save/load screen state when user logs out or switches to local game
  useEffect(() => {
    if (!isMounted) return;
    
    if (!currentUserId || isLocalGame) {
      // If logged out or in local game, reset save/load screen state
      setShowSaveLoad(false);
    } else if (currentUserId && !characterCreated) {
      // If logged in and no character, show save/load screen
      const saveLoaded = localStorage.getItem('saveLoaded') === 'true';
      if (!saveLoaded) {
        setShowSaveLoad(true);
      }
    }
  }, [currentUserId, isLocalGame, characterCreated, isMounted]);

  // Handle save load completion
  const handleLoadComplete = () => {
    // Save was loaded, game state is already updated by loadGame
    // Check if character data exists in the loaded state
    if (isMounted) {
      localStorage.setItem('saveLoaded', 'true');
      localStorage.setItem('characterCreated', 'true');
    }
    setCharacterCreated(true);
    setShowSaveLoad(false);
  };

  // Handle new game (skip save/load, go to character creation)
  const handleNewGame = () => {
    setShowSaveLoad(false);
    // Character creation will be shown next
  };

  // Handle character creation completion
  const handleCharacterCreationComplete = (characterData) => {
    // Calculate HP and Mana based on attributes (config-driven)
    const cfg = state.config || {};
    const baseHp = cfg.startHp ?? 100;
    const baseMana = cfg.startMana ?? 50;
    const str = characterData.attributes?.str ?? 0;
    const int = characterData.attributes?.int ?? 0;
    const will = characterData.attributes?.will ?? 0;
    const soul = characterData.attributes?.soul ?? 0;

    const calculatedHp = baseHp + (str * (cfg.hpPerStr ?? 0)) + (will * (cfg.hpPerWill ?? 0));
    const calculatedMana = baseMana + (int * (cfg.manaPerInt ?? 0)) + (soul * (cfg.manaPerSoul ?? 0));

    
    // Update game state with character data
    setState(prevState => ({
      ...prevState,
      player: {
        ...prevState.player,
        name: characterData.name,
        gender: characterData.gender,
        race: characterData.race,
        evolutionStage: characterData.evolutionStage,
        class: characterData.class,
        talent: characterData.talent,
        attributes: {
          ...characterData.attributes,
          freePoints: 0 // Ensure freePoints is set
        },
        abilities: (characterData.abilities || []).filter(ability => ability && ability.id), // Filter out invalid abilities
        hp: {
          current: calculatedHp,
          max: calculatedHp
        },
        mana: {
          current: calculatedMana,
          max: calculatedMana
        }
      }
    }));
    
    // Mark character as created
    if (isMounted) {
      localStorage.setItem('characterCreated', 'true');
    }
    setCharacterCreated(true);
    
    // Reset hasGeneratedInitial so initial narrative is generated
    setHasGeneratedInitial(false);
  };

  // Effect to handle level up
  useEffect(() => {
    if (state.player.justLeveledUp) {
      // Generate the ASCII status string
      const statusString = renderstatusblock(state.player);
      
      // Add to chat log as a special message
      addSystemMessage(statusString, 'status-update');
      
      // Reset the level up flag immediately after displaying the message
      acknowledgeLevelUp();
    }
  }, [state.player.justLeveledUp, addSystemMessage, acknowledgeLevelUp, isMounted]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  // Glitch effect on damage
  useEffect(() => {
    if (state.player?.hp?.current && previousHp.current && state.player.hp.current < previousHp.current) {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }
    if (state.player?.hp?.current) {
      previousHp.current = state.player.hp.current;
    }
  }, [state.player?.hp?.current]);

  // Generate initial narrative on mount or after character creation
  useEffect(() => {
    if (!isMounted) return;
    
    if (!hasGeneratedInitial && characterCreated && state.player.name && state.player.name !== 'User' && chatLog.length === 0) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        try {
          generateInitialNarrativeText(state);
          setHasGeneratedInitial(true);
        } catch (error) {
          console.error('Error generating initial narrative:', error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasGeneratedInitial, characterCreated, state.player.name, chatLog.length, generateInitialNarrativeText, state, isMounted]);

  function computeActionSuggestions(gameState) {
    const fixed = ['Explore', 'Analyze'];
    const candidates = [];
    const hpRatio = (gameState.player?.hp?.current || 0) / (gameState.player?.hp?.max || 1);
    const hasPotion = (gameState.player?.inventory || []).some(i => i.type === 'consumable');
    const hasWeaponEquippable = (gameState.player?.inventory || []).some(i => i.type === 'equipment' && i.equipSlot === 'weapon');
    const weaponEquipped = !!gameState.player?.equipment?.weapon;
    const inCombat = gameState.combat?.status === 'active';
    const abilities = gameState.player?.abilities || [];
    if (inCombat) candidates.push({ t: 'Attack', w: 0.9, c: 'combat' });
    if (inCombat && abilities.find(a => a.type === 'active')) candidates.push({ t: 'Use Skill', w: 0.85, c: 'combat' });
    if (inCombat) candidates.push({ t: 'Attempt Escape', w: 0.6, c: 'utility' });
    if (hpRatio < 0.5 && hasPotion) candidates.push({ t: 'Use Health Potion', w: 0.95, c: 'utility' });
    if (!weaponEquipped && hasWeaponEquippable) candidates.push({ t: 'Equip Weapon', w: 0.7, c: 'utility' });
    candidates.push({ t: 'Search Room', w: 0.5, c: 'explore' });
    candidates.push({ t: 'Talk', w: 0.55, c: 'social' });
    const unlocked = gameState.world?.location?.unlockedAreas || [];
    if (unlocked.length > 0) candidates.push({ t: `Go to ${unlocked[0]}`, w: 0.6, c: 'explore' });
    const sorted = candidates.sort((a, b) => b.w - a.w).map(x => x.t);
    const filtered = sorted.filter(s => s.toLowerCase() !== 'check status' && s.toLowerCase() !== 'check inventory');
    const dynamic = filtered.slice(0, 6);
    const out = [...fixed, ...dynamic];
    return out.length > 8 ? out.slice(0, 8) : out;
  }

  useEffect(() => {
    if (!isMounted) return;
    setActionSuggestions(computeActionSuggestions(state));
  }, [state, chatLog, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    function onKeySkip() { setSkipTyping(true); setCurrentTypedIndex(chatLog.length - 1); }
    window.addEventListener('keydown', onKeySkip);
    return () => window.removeEventListener('keydown', onKeySkip);
  }, [chatLog.length, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('animationsEnabled', animationsEnabled ? 'true' : 'false');
      localStorage.setItem('typingSpeed', String(typingSpeed));
    } catch {}
  }, [animationsEnabled, typingSpeed, isMounted]);

  function Typewriter({ text, speed = 40, onDone }) {
    const [display, setDisplay] = useState('');
    const [cursor, setCursor] = useState(true);
    const idxRef = useRef(0);
    useEffect(() => {
      if (!animationsEnabled || skipTyping) { setDisplay(text); onDone && onDone(); return }
      const msPerChar = Math.max(20, Math.round(1000 / Math.min(50, Math.max(30, speed))));
      const timer = setInterval(() => {
        idxRef.current += 1;
        if (idxRef.current >= text.length) {
          clearInterval(timer);
          setDisplay(text);
          onDone && onDone();
        } else {
          setDisplay(text.slice(0, idxRef.current));
        }
      }, msPerChar);
      return () => clearInterval(timer);
    }, [text, speed]);
    useEffect(() => {
      const blink = setInterval(() => setCursor(c => !c), 500);
      return () => clearInterval(blink);
    }, []);
    return (
      <span>
        {display}
        <span style={{ opacity: cursor ? 1 : 0, color: 'var(--holo-cyan)' }}>|</span>
      </span>
    );
  }

  // Show save/load screen if needed (only for logged-in users, not local game)
  if (showSaveLoad && currentUserId && !isLocalGame) {
    return (
      <SaveLoadScreen
        saveGame={saveGame}
        loadGame={loadGame}
        getSavesList={getSavesList}
        deleteSave={deleteSave}
        isSaving={isSaving}
        lastSaveTime={lastSaveTime}
        currentUserId={currentUserId}
        onLoadComplete={handleLoadComplete}
        onNewGame={handleNewGame}
      />
    );
  }

  // Show character creation if character not created
  if (!characterCreated) {
    return <CharacterCreation onComplete={handleCharacterCreationComplete} />;
  }

  
  // Calculate health and mana percentages for bars
  // Add comprehensive safety checks to prevent crashes
  const hpCurrent = state.player?.hp?.current ?? 100;
  const hpMax = state.player?.hp?.max ?? 100;
  const manaCurrent = state.player?.mana?.current ?? 50;
  const manaMax = state.player?.mana?.max ?? 50;
  const healthPercentage = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 100;
  const manaPercentage = manaMax > 0 ? (manaCurrent / manaMax) * 100 : 100;
  const isLowHealth = healthPercentage < 30;
  const isLowMana = manaPercentage < 30;
  

  // Handle skill usage with mana validation
  const handleSkillUsage = async (skill, target = 'enemy') => {
    if (!skill || !state.player) return;
    
    try {
      // Check if player can afford the skill
      const affordability = canAffordSkill(skill, state.player);
      
      if (!affordability.canAfford) {
        // Show insufficient mana feedback
        setManaAnimation('insufficient');
        setManaFeedback(affordability.feedback);
        addSystemMessage(`[MANA] Insufficient mana for ${skill.name}. Need ${affordability.manaCost}, have ${affordability.currentMana}`, 'error');
        
        // Reset animation after delay
        setTimeout(() => setManaAnimation(''), 500);
        return false;
      }
      
      // Consume mana
      const consumption = consumeMana(skill, state.player, {
        showFeedback: true,
        scaleWithLevel: true
      });
      
      if (consumption.success) {
        // Update player state with new mana
        setState(prevState => ({
          ...prevState,
          player: {
            ...prevState.player,
            mana: {
              ...prevState.player.mana,
              current: consumption.remainingMana
            }
          }
        }));
        
        // Show consumption feedback
        setManaAnimation('consuming');
        setManaFeedback(consumption.feedback);
        
        // Add mana usage message
        addSystemMessage(`[MANA] Used ${consumption.manaConsumed} mana for ${skill.name}. ${consumption.remainingMana} remaining.`, 'mana');
        
        // Reset animation after delay
        setTimeout(() => setManaAnimation(''), 500);
        
        return true;
      }
      
    } catch (error) {
      addSystemMessage(`[ERROR] Failed to use ${skill.name}: ${error.message}`, 'error');
      return false;
    }
  };

  // Handle input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    
    const input = userInput.trim();
    setUserInput('');
    
    // Save state for rewind before action
    setState(prevState => ({
      ...prevState,
      previousState: JSON.parse(JSON.stringify(prevState))
    }));
    
    // Add user message to chat
    addSystemMessage(`> ${input}`, 'user');
    
    // Process through narrative hook
    await submitInput(input, state);
    
    // Focus input again
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle action button click
  const handleActionClick = async (actionText) => {
    if (isLoading) return;
    setUserInput(actionText);
    // Trigger submit
    const fakeEvent = { preventDefault: () => {} };
    await handleSubmit(fakeEvent);
  };
  
  // Combat handlers
  const handleCombatAttack = (enemyIndex) => {
    const result = playerAttack(state, enemyIndex);
    if (result.success) {
      // Save state for rewind before combat action
      setState(prevState => {
        const newState = {
          ...result.state,
          previousState: JSON.parse(JSON.stringify(prevState))
        };
        // Process enemy turns after player attack
        setTimeout(() => {
          setState(prevState => {
            // Only process enemy turns if still in combat
            if (prevState.combat?.status === 'active' && prevState.combat?.turn === 'enemy') {
              const newState = processEnemyTurns(prevState);
              return newState;
            }
            return prevState;
          });
        }, 500);
        return newState;
      });
    }
  };
  
  const handleCombatUseSkill = (skillId, enemyIndex) => {
    // Similar to attack but with skill
    const result = playerAttack(state, enemyIndex, skillId);
    if (result.success) {
      // Save state for rewind before combat action
      setState(prevState => {
        const newState = {
          ...result.state,
          previousState: JSON.parse(JSON.stringify(prevState))
        };
        setTimeout(() => {
          setState(prevState => {
            // Only process enemy turns if still in combat
            if (prevState.combat?.status === 'active' && prevState.combat?.turn === 'enemy') {
              return processEnemyTurns(prevState);
            }
            return prevState;
          });
        }, 500);
        return newState;
      });
    }
  };
  
  const handleCombatEscape = () => {
    const result = escapeCombat(state);
    if (result.success) {
      // Save state for rewind before escape
      setState(prevState => ({
        ...result.state,
        previousState: JSON.parse(JSON.stringify(prevState))
      }));
    } else {
      // Escape failed, save state for rewind and process enemy turn
      setState(prevState => {
        const newState = {
          ...result.state,
          previousState: JSON.parse(JSON.stringify(prevState))
        };
        setTimeout(() => {
          setState(prevState => {
            // Only process enemy turns if still in combat
            if (prevState.combat?.status === 'active' && prevState.combat?.turn === 'enemy') {
              return processEnemyTurns(prevState);
            }
            return prevState;
          });
        }, 500);
        return newState;
      });
    }
  };
  
  // Shop handlers
  const handleShopPurchase = (item) => {
    const currency = state.player.currency || { goldCoins: 0, soulpoints: 0 };
    
    // Check if can afford
    if (item.price.goldCoins && currency.goldCoins < item.price.goldCoins) {
      addSystemMessage('Not enough gold coins!', 'system');
      return;
    }
    if (item.price.soulpoints && currency.soulpoints < item.price.soulpoints) {
      addSystemMessage('Not enough soulpoints!', 'system');
      return;
    }
    
    // Save state for rewind before purchase
    setState(prevState => {
      const newState = {
        ...prevState,
        previousState: JSON.parse(JSON.stringify(prevState)),
        player: {
          ...prevState.player,
          currency: {
            goldCoins: currency.goldCoins - (item.price.goldCoins || 0),
            soulpoints: currency.soulpoints - (item.price.soulpoints || 0)
          }
        }
      };
      
      // Add item/skill
      if (item.itemData) {
        return addItem(newState, item.itemData);
      } else if (item.skillData) {
        return {
          ...newState,
          player: {
            ...newState.player,
            abilities: [...(newState.player.abilities || []), item.skillData]
          }
        };
      }
      
      return newState;
    });
    
    addSystemMessage(`Purchased ${item.name}!`, 'system');
  };
  
  // Gacha handlers
  const handleGachaPull = (poolId, results) => {
    const pool = require('../lib/gachaData').gachaPools[poolId];
    const currency = state.player.currency || { goldCoins: 0, soulpoints: 0 };
    
    // Save state for rewind before gacha pull
    setState(prevState => {
      // Deduct currency
      let newState = {
        ...prevState,
        previousState: JSON.parse(JSON.stringify(prevState)),
        player: {
          ...prevState.player,
          currency: {
            goldCoins: currency.goldCoins - (pool.cost.goldCoins || 0),
            soulpoints: currency.soulpoints - (pool.cost.soulpoints || 0)
          }
        }
      };
      
      // Add results
      results.forEach(result => {
        if (result.type === 'equipment' || result.type === 'misc') {
          newState = addItem(newState, result);
        } else if (result.type === 'active' || result.type === 'passive') {
          newState = {
            ...newState,
            player: {
              ...newState.player,
              abilities: [...(newState.player.abilities || []), result]
            }
          };
        }
      });
      
      return newState;
    });
    
    addSystemMessage(`Gacha pull complete! Got ${results.length} item(s)!`, 'system');
  };
  
  // Title handlers
  const handleTitlePurchase = (title) => {
    const currency = state.player.currency || { goldCoins: 0, soulpoints: 0 };
    const price = title.unlockConditions?.purchase;
    
    if (!price) return;
    
    if (price.goldCoins && currency.goldCoins < price.goldCoins) {
      addSystemMessage('Not enough gold coins!', 'system');
      return;
    }
    if (price.soulpoints && currency.soulpoints < price.soulpoints) {
      addSystemMessage('Not enough soulpoints!', 'system');
      return;
    }
    
    setState(prevState => ({
      ...prevState,
      player: {
        ...prevState.player,
        currency: {
          goldCoins: currency.goldCoins - (price.goldCoins || 0),
          soulpoints: currency.soulpoints - (price.soulpoints || 0)
        },
        unlockedTitles: [...(prevState.player.unlockedTitles || []), title.id]
      }
    }));
    
    addSystemMessage(`Unlocked title: ${title.name}!`, 'system');
  };
  
  const handleTitleEquip = (titleId) => {
    setState(prevState => ({
      ...prevState,
      player: {
        ...prevState.player,
        equippedTitle: titleId
      }
    }));
    addSystemMessage('Title equipped!', 'system');
  };
  
  const handleTitleUnequip = () => {
    setState(prevState => ({
      ...prevState,
      player: {
        ...prevState.player,
        equippedTitle: null
      }
    }));
    addSystemMessage('Title unequipped!', 'system');
  };
  
  // Rewind handler
  const handleRewind = () => {
    if (!state.previousState) {
      addSystemMessage('Cannot rewind: No previous state', 'system');
      return;
    }
    
    // Restore previous state and clear it (prevent double rewind)
    const previousState = state.previousState;
    setState({
      ...previousState,
      previousState: null // Clear after rewind
    });
    addSystemMessage('Rewound last choice!', 'system');
  };

  // Exit Local Game Handler
  const handleExitLocalGame = () => {
    if (isMounted) {
      localStorage.removeItem('localGame');
      localStorage.removeItem('characterCreated');
    }
    window.location.reload();
  };

  return (
    <>
      {/* Scanlines Overlay */}
      <div className="scanlines"></div>
      
      {/* Main App Container with Grid Layout */}
      <div className={`app-container ${glitchActive ? 'glitch' : ''}`}>
        {/* Left Sidebar - System Interface (expanded to full sidebar) */}
        <div className="status-hud" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {/* Scrollable System Interface Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', paddingBottom: '0.5rem' }}>
            {/* Authentication UI - Only show if not in local game mode */}
            {!isLocalGame && (
              <div style={{ marginBottom: '1rem' }}>
                <AuthUI onAuthChange={handleAuthChange} />
              </div>
            )}
            
            {/* System Interface Panel */}
            <div className="holo-panel" style={{ marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  [SYSTEM INTERFACE]
                </div>
                <div style={{ color: 'var(--holo-gold)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  [STATUS: {state.player.name || 'Unknown'}]
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {'--------------------------------------------------'}
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Level:  {state.player.level} (XP: {formatNumberCompact(state.player.xp.current)}/{formatNumberCompact(state.player.xp.max)})   Title: {state.player.title || 'None'}
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Race:   {state.player.race}        ({state.player.evolutionStage || 'Mortal'})
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Class:  {state.player.class}
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Talent: {state.player.talent}
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {'--------------------------------------------------'}
                </div>
                
                {/* VITALITY Section */}
                <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  [VITALITY]
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>Health: {hpCurrent}/{hpMax}</span>
                    <span style={{ color: 'var(--text-main)' }}>Mana: {manaCurrent}/{manaMax}</span>
                  </div>
                  {/* Health Bar */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div className="health-bar-container" style={{ marginBottom: '0.25rem' }}>
                      <div className="health-bar">
                        <div 
                          className="health-bar-fill" 
                          style={{ 
                            width: `${healthPercentage}%`,
                            background: isLowHealth 
                              ? 'linear-gradient(90deg, var(--holo-alert), #ff6b9d)' 
                              : 'linear-gradient(90deg, var(--holo-alert), var(--holo-cyan))'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {/* Mana Bar */}
                  <div>
                    <div className="mana-bar-container">
                      <div className="mana-bar">
                        <div 
                          className={`mana-bar-fill ${manaAnimation}`} 
                          style={{ 
                            width: `${manaPercentage}%`,
                            background: isLowMana 
                              ? 'linear-gradient(90deg, #ff6b6b, #ffa500)' 
                              : 'linear-gradient(90deg, var(--holo-blue), var(--holo-cyan))'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ATTRIBUTES Section */}
                <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  [ATTRIBUTES] (Free Points: {state.player.attributes?.freePoints || 0})
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Strength:      {state.player.attributes?.str || 5}  (Physical power)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Agility:       {state.player.attributes?.agi || 5}  (Speed/Dodge)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Dexterity:     {state.player.attributes?.dex || 5}  (Precision/Crafting)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Intelligence:  {state.player.attributes?.int || 5}  (Magic/Learning)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Charisma:      {state.player.attributes?.cha || 5}  (Influence)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Will:          {state.player.attributes?.will || 5}  (Mental Defense/Pressure)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  &gt; Luck:          {state.player.attributes?.luck || 5}  (Drop Rate/Crit)
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  &gt; Soul Strength: {state.player.attributes?.soul || 5}  (Psychic/Focus)
                </div>
                
                {/* ABILITIES Section */}
                <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  [ABILITIES]
                </div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {state.player.abilities && state.player.abilities.length > 0 ? (
                    state.player.abilities.map((ability, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>
                        - {ability.name} (Lvl {ability.level || 1})
                      </div>
                    ))
                  ) : (
                    <div>- None</div>
                  )}
                </div>
                
                {/* INVENTORY Section */}
                <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  [INVENTORY]
                </div>
                <div style={{ color: 'var(--text-main)' }}>
                  {state.player.equipment?.weapon && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      - {state.player.equipment.weapon.name} [Equipped: Weapon]
                    </div>
                  )}
                  {state.player.equipment?.armor && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      - {state.player.equipment.armor.name} [Equipped: Armor]
                    </div>
                  )}
                  {state.player.inventory && state.player.inventory.length > 0 ? (
                    state.player.inventory
                      .filter(item => item.id !== state.player.equipment?.weapon?.id && item.id !== state.player.equipment?.armor?.id)
                      .slice(0, 10)
                      .map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '0.25rem' }}>
                          - {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                        </div>
                      ))
                  ) : (
                    <div>- Empty</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Combat UI */}
            {state.combat?.status === 'active' && (
              <CombatUI
                combat={state.combat}
                onAttack={handleCombatAttack}
                onUseSkill={handleCombatUseSkill}
                onEscape={handleCombatEscape}
                playerAbilities={state.player.abilities}
              />
            )}
            
            {/* New Feature Sections */}
            <div className="holo-panel" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>[SHOP]</div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Gold: {state.player.currency?.goldCoins || 0} | Soulpoints: {state.player.currency?.soulpoints || 0}
              </div>
              <button className="holo-button" onClick={() => setShowShop(true)} style={{ width: '100%' }}>Open Shop</button>
            </div>
            
            <div className="holo-panel" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>[GACHA]</div>
              <button className="holo-button" onClick={() => setShowGacha(true)} style={{ width: '100%' }}>Open Gacha</button>
            </div>
            
            <div className="holo-panel" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>[QUEST LOG]</div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Active: {state.quests?.active?.length || 0} | Completed: {state.quests?.completed?.length || 0}
              </div>
              <button className="holo-button" onClick={() => setShowQuestLog(true)} style={{ width: '100%' }}>View Quests</button>
            </div>
            
            <div className="holo-panel" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>[TITLE SYSTEM]</div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Current: {state.player.equippedTitle ? titleDatabase?.find(t => t.id === state.player.equippedTitle)?.name || 'None' : 'None'}
              </div>
              <button className="holo-button" onClick={() => setShowTitleSystem(true)} style={{ width: '100%' }}>Manage Titles</button>
            </div>
          </div>
          
          {/* Fixed Bottom Section with Buttons */}
          <div style={{ padding: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--holo-cyan)', background: 'var(--bg-deep)' }}>
            {/* Save/Load UI - Compact version */}
            {!isLocalGame && (
              <SaveLoadUI
                saveGame={saveGame}
                loadGame={loadGame}
                getSavesList={getSavesList}
                deleteSave={deleteSave}
                isSaving={isSaving}
                lastSaveTime={lastSaveTime}
                currentUserId={currentUserId}
              />
            )}
            
            {/* Exit Local Game Button */}
            {isLocalGame && (
              <button
                className="holo-button"
                onClick={handleExitLocalGame}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  borderColor: 'var(--holo-alert)',
                  color: 'var(--holo-alert)',
                  fontSize: '0.85rem'
                }}
              >
                Exit Local Game
              </button>
            )}
          </div>
        </div>

        {/* Center Area - Narrative Log (75%) */}
        <div className="narrative-log">
          <div className="holo-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="chat-container" ref={chatContainerRef}>
              {chatLog.length === 0 ? (
                <div className="message system">
                  <p>System initialized. Generating initial narrative...</p>
                </div>
              ) : (
                chatLog.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    {message.type === 'user' ? (
                      <p style={{ color: 'var(--holo-cyan)', fontWeight: 'bold' }}>{message.text}</p>
                    ) : index === currentTypedIndex ? (
                      <p>
                        <Typewriter
                          text={message.text}
                          speed={typingSpeed}
                          onDone={() => setCurrentTypedIndex(i => Math.min(i + 1, chatLog.length - 1))}
                        />
                      </p>
                    ) : index < currentTypedIndex ? (
                      <p>{message.text}</p>
                    ) : (
                      <p style={{ opacity: 0.3 }}>...</p>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="message system">
                  <p style={{ fontStyle: 'italic', opacity: 0.7 }}>Processing...</p>
                </div>
              )}
              {error && (
                <div className="message system" style={{ color: 'var(--holo-alert)' }}>
                  <p>Error: {error}</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons (AI-generated) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
              {actionSuggestions.slice(0, 8).map((suggestion, index) => (
                <button
                  key={index}
                  className="holo-button"
                  onClick={() => handleActionClick(suggestion)}
                  disabled={isLoading}
                  style={{
                    flex: '1 1 auto',
                    minWidth: '150px',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    color: suggestion === 'Explore' ? 'var(--holo-green)' : suggestion === 'Analyze' ? 'var(--holo-cyan)' : suggestion.includes('Attack') || suggestion.includes('Skill') ? 'var(--holo-alert)' : 'var(--text-main)'
                  }}
                >
                  {animationsEnabled && !skipTyping ? (
                    <Typewriter text={suggestion} speed={typingSpeed} />
                  ) : (
                    suggestion
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={animationsEnabled} onChange={(e) => setAnimationsEnabled(e.target.checked)} />
                Animations
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                Speed
                <input type="range" min={30} max={50} value={typingSpeed} onChange={(e) => setTypingSpeed(parseInt(e.target.value, 10))} />
                <span>{typingSpeed}cps</span>
              </label>
            </div>
            
            {/* Rewind Button */}
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <button
                className="holo-button"
                onClick={handleRewind}
                disabled={!state.previousState}
                style={{
                  minWidth: '150px',
                  borderColor: state.previousState ? 'var(--holo-gold)' : 'var(--text-main)',
                  color: state.previousState ? 'var(--holo-gold)' : 'var(--text-main)',
                  opacity: state.previousState ? 1 : 0.5,
                  cursor: state.previousState ? 'pointer' : 'not-allowed'
                }}
              >
                Rewind Last Choice
              </button>
            </div>
            
            {/* Input Field */}
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isLoading ? "Processing..." : "Type your action..."}
                disabled={isLoading}
                className="holo-input"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid var(--holo-cyan)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-text)',
                  fontSize: '1rem',
                  padding: '0.75rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="holo-button"
                style={{
                  minWidth: '100px',
                  opacity: (isLoading || !userInput.trim()) ? 0.5 : 1,
                  cursor: (isLoading || !userInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? '...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Game Over Overlay */}
      {state.player.isDead && (
        <div className="game-over">
          <h2>SYSTEM FAILURE</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            Critical damage sustained. System shutdown initiated.
          </p>
          <button 
            className="holo-button" 
            onClick={() => window.location.reload()}
            style={{ borderColor: 'var(--holo-alert)', color: 'var(--holo-alert)' }}
          >
            Restart System
          </button>
        </div>
      )}
      
      {/* Modal Overlays */}
      <ShopUI
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        gameState={state}
        onPurchase={handleShopPurchase}
      />
      
      <GachaUI
        isOpen={showGacha}
        onClose={() => setShowGacha(false)}
        gameState={state}
        onPull={handleGachaPull}
      />
      
      <QuestLogUI
        isOpen={showQuestLog}
        onClose={() => setShowQuestLog(false)}
        gameState={state}
      />
      
      <TitleUI
        isOpen={showTitleSystem}
        onClose={() => setShowTitleSystem(false)}
        gameState={state}
        onUnlock={() => {}}
        onEquip={handleTitleEquip}
        onUnequip={handleTitleUnequip}
        onPurchase={handleTitlePurchase}
      />
    </>
  );
}
