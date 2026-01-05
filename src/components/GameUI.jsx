// GameUI.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine } from '../hook/usegamestate';
import { useNarrative } from '../hook/useNarrative';
import { renderstatusblock } from '../util/statusrenderer';
import { formatNumberCompact } from '../lib/numberFormat';
import AuthUI from './AuthUI';
import SaveLoadUI from './SaveLoadUI';
import SaveLoadScreen from './SaveLoadScreen';
import CharacterCreation from './CharacterCreation';
import CombatUI from './CombatUI';
import ShopUI from './ShopUI';
import GachaUI from './GachaUI';
import QuestLogUI from './QuestLogUI';
import TitleUI from './TitleUI';
import { playerAttack, processEnemyTurns, escapeCombat, startCombat, addItem } from '../lib/gamelogic';
import { titleDatabase } from '../lib/titleData';

export default function GameUI() {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:18',message:'GameUI component render start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
  } catch (e) {}
  // #endregion
  const [isLocalGame] = useState(() => {
    return localStorage.getItem('localGame') === 'true';
  });
  const [showSaveLoad, setShowSaveLoad] = useState(() => {
    // Show save/load screen if user is logged in (not local game) and no character data exists
    const hasCharacter = localStorage.getItem('characterCreated') === 'true';
    const saveLoaded = localStorage.getItem('saveLoaded') === 'true';
    const isLocal = localStorage.getItem('localGame') === 'true';
    return !hasCharacter && !saveLoaded && !isLocal;
  });
  const [characterCreated, setCharacterCreated] = useState(() => {
    // Check if character was already created or loaded from save
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
  
  // Modal states
  const [showShop, setShowShop] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showTitleSystem, setShowTitleSystem] = useState(false);
  
  // Action suggestions state
  const [actionSuggestions, setActionSuggestions] = useState([]);

  // Check if character data exists in state (from loaded save)
  useEffect(() => {
    if (state.player && state.player.name && state.player.name !== 'User' && 
        state.player.race && state.player.race !== 'Human' &&
        state.player.class && state.player.class !== 'None') {
      // Character data exists, mark as created
      localStorage.setItem('characterCreated', 'true');
      localStorage.setItem('saveLoaded', 'true');
      setCharacterCreated(true);
      setShowSaveLoad(false);
    }
  }, [state.player]);

  // Reset save/load screen state when user logs out or switches to local game
  useEffect(() => {
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
  }, [currentUserId, isLocalGame, characterCreated]);

  // Handle save load completion
  const handleLoadComplete = () => {
    // Save was loaded, game state is already updated by loadGame
    // Check if character data exists in the loaded state
    localStorage.setItem('saveLoaded', 'true');
    localStorage.setItem('characterCreated', 'true');
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:112',message:'handleCharacterCreationComplete entry',data:{hasAttributes:!!characterData.attributes,str:characterData.attributes?.str,int:characterData.attributes?.int,will:characterData.attributes?.will,soul:characterData.attributes?.soul},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Calculate HP and Mana based on attributes (config-driven)
    const cfg = state.config || {};
    const baseHp = cfg.startHp ?? 100;
    const baseMana = cfg.startMana ?? 50;
    const str = characterData.attributes?.str ?? 0;
    const int = characterData.attributes?.int ?? 0;
    const will = characterData.attributes?.will ?? 0;
    const soul = characterData.attributes?.soul ?? 0;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:118',message:'attribute values before calculation',data:{str,int,will,soul},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const calculatedHp = baseHp + (str * (cfg.hpPerStr ?? 0)) + (will * (cfg.hpPerWill ?? 0));
    const calculatedMana = baseMana + (int * (cfg.manaPerInt ?? 0)) + (soul * (cfg.manaPerSoul ?? 0));
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:119',message:'calculated HP and Mana',data:{calculatedHp,calculatedMana,isNaN_Hp:isNaN(calculatedHp),isNaN_Mana:isNaN(calculatedMana)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:160',message:'marking character as created',data:{characterName:characterData.name,abilitiesCount:characterData.abilities?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    localStorage.setItem('characterCreated', 'true');
    setCharacterCreated(true);
    
    // Reset hasGeneratedInitial so initial narrative is generated
    setHasGeneratedInitial(false);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:165',message:'character creation complete, hasGeneratedInitial reset',data:{characterCreated:true,hasGeneratedInitial:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
  };

  // Effect to handle level up
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:157',message:'level up effect check',data:{justLeveledUp:state.player.justLeveledUp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (state.player.justLeveledUp) {
      // Generate the ASCII status string
      const statusString = renderstatusblock(state.player);
      
      // Add to chat log as a special message
      addSystemMessage(statusString, 'status-update');
      
      // Reset the level up flag immediately after displaying the message
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:166',message:'calling acknowledgeLevelUp',data:{justLeveledUp:state.player.justLeveledUp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      acknowledgeLevelUp();
    }
  }, [state.player.justLeveledUp, addSystemMessage, acknowledgeLevelUp]);

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:187',message:'initial narrative effect check',data:{hasGeneratedInitial,characterCreated,playerName:state.player.name,chatLogLength:chatLog.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    if (!hasGeneratedInitial && characterCreated && state.player.name && state.player.name !== 'User' && chatLog.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:189',message:'scheduling initial narrative generation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:192',message:'calling generateInitialNarrativeText',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        try {
          generateInitialNarrativeText(state);
          setHasGeneratedInitial(true);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:195',message:'generateInitialNarrativeText completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:197',message:'generateInitialNarrativeText error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
          console.error('Error generating initial narrative:', error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasGeneratedInitial, characterCreated, state.player.name, chatLog.length, generateInitialNarrativeText, state]);

  // Generate action suggestions (placeholder - would use AI in production)
  useEffect(() => {
    const suggestions = [
      'Look around',
      'Check inventory',
      'Go north',
      'Use item',
      'Check status',
      'Explore'
    ];
    setActionSuggestions(suggestions);
  }, [state, chatLog]);

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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:220',message:'rendering main game UI',data:{characterCreated,playerName:state.player.name,hasHp:!!state.player.hp,hasMana:!!state.player.mana,hpCurrent:state.player.hp?.current,hpMax:state.player.hp?.max},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
  // #endregion

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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:228',message:'calculated percentages',data:{hpCurrent,hpMax,manaCurrent,manaMax,healthPercentage,manaPercentage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
  // #endregion

  // Handle input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    
    const input = userInput.trim();
    setUserInput('');
    
    // Save state for rewind before action
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:234',message:'saving previousState for rewind',data:{hasPreviousState:!!state.previousState,currentLevel:state.player.level},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:262',message:'handleCombatAttack entry',data:{enemyIndex,combatStatus:state.combat?.status,combatTurn:state.combat?.turn,enemiesCount:state.combat?.enemies?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const result = playerAttack(state, enemyIndex);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:264',message:'playerAttack result',data:{success:result.success,newCombatStatus:result.state?.combat?.status,newCombatTurn:result.state?.combat?.turn},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (result.success) {
      // Save state for rewind before combat action
      setState(prevState => {
        const newState = {
          ...result.state,
          previousState: JSON.parse(JSON.stringify(prevState))
        };
        // Process enemy turns after player attack
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:267',message:'setTimeout scheduled',data:{stateBeforeTimeout:newState.combat?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:268',message:'setTimeout executed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          setState(prevState => {
            // Only process enemy turns if still in combat
            if (prevState.combat?.status === 'active' && prevState.combat?.turn === 'enemy') {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:269',message:'processEnemyTurns called',data:{prevStateCombatStatus:prevState.combat?.status,prevStateCombatTurn:prevState.combat?.turn},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              const newState = processEnemyTurns(prevState);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:269',message:'processEnemyTurns result',data:{newStateCombatStatus:newState.combat?.status,newStateCombatTurn:newState.combat?.turn},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:297',message:'handleShopPurchase entry',data:{itemName:item.name,hasPreviousState:!!state.previousState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
    addSystemMessage('Rewound last action!', 'system');
  };

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameUI.jsx:457',message:'GameUI about to return JSX',data:{characterCreated,hasState:!!state,hasPlayer:!!state.player},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
  // #endregion
  
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
                    <div className="health-bar-container">
                      <div className="health-bar">
                        <div 
                          className="health-bar-fill" 
                          style={{ 
                            width: `${manaPercentage}%`,
                            background: isLowMana 
                              ? 'linear-gradient(90deg, #6b9dff, #9db5ff)' 
                              : 'linear-gradient(90deg, var(--holo-cyan), #00d4ff)'
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
                onClick={() => {
                  localStorage.removeItem('localGame');
                  localStorage.removeItem('characterCreated');
                  window.location.reload();
                }}
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
                    {message.type === 'status-update' ? (
                      <pre className="status-terminal">{message.text}</pre>
                    ) : message.type === 'user' ? (
                      <p style={{ color: 'var(--holo-cyan)', fontWeight: 'bold' }}>{message.text}</p>
                    ) : (
                      <p>{message.text}</p>
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
              {actionSuggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={index}
                  className="holo-button"
                  onClick={() => handleActionClick(suggestion)}
                  disabled={isLoading}
                  style={{
                    flex: '1 1 auto',
                    minWidth: '150px',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {suggestion}
                </button>
              ))}
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
