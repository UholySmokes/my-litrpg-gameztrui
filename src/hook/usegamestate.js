// useGameEngine.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { initialgamestate } from '../lib/gamestate';
import { addXp, takeDamage, addItem, resetLevelUpFlag } from '../lib/gamelogic';
import { saveGameState, updateGameState, loadGameState, listSaves, isSupabaseConfigured } from '../lib/supabaseService';
import { getCurrentUser } from '../lib/authService';

export function useGameEngine() {
  const [state, setState] = useState(initialgamestate);
  const [chatLog, setChatLog] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentSaveId, setCurrentSaveId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const autoSaveTimerRef = useRef(null);
  const lastStateRef = useRef(state);
  
  // Update ref whenever state changes
  useEffect(() => {
    lastStateRef.current = state;
  }, [state]);

  // Handle combat/quest rewards
  const handleReward = useCallback((xpAmount, dropItems) => {
    setState(prevState => {
      let newState = addXp(prevState, xpAmount);
      
      if (dropItems && dropItems.length > 0) {
        dropItems.forEach(item => {
          newState = addItem(newState, item);
        });
      }
      
      // Add feedback message
      setChatLog(prev => [...prev, {
        sender: "SYSTEM",
        text: `Gained ${xpAmount} XP!`,
        type: 'system',
        timestamp: Date.now()
      }]);
      
      return newState;
    });
  }, []);

  // Handle combat damage
  const handleCombatHit = useCallback((damageAmount) => {
    setState(prevState => {
      const newState = takeDamage(prevState, damageAmount);
      
      // Add feedback message
      setChatLog(prev => [...prev, {
        sender: "SYSTEM",
        text: `Took ${damageAmount} damage! HP: ${newState.player.hp.current}/${newState.player.hp.max}`,
        type: 'system',
        timestamp: Date.now()
      }]);
      
      return newState;
    });
  }, []);

  // Reset level up flag after displaying status page
  const acknowledgeLevelUp = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:59',message:'acknowledgeLevelUp called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    setState(prevState => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:60',message:'resetLevelUpFlag before',data:{justLeveledUp:prevState.player.justLeveledUp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const newState = resetLevelUpFlag(prevState);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:61',message:'resetLevelUpFlag after',data:{justLeveledUp:newState.player.justLeveledUp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return newState;
    });
  }, []);

  // Add system message to chat log
  const addSystemMessage = useCallback((message, type = 'system') => {
    setChatLog(prev => [...prev, { 
      sender: "SYSTEM", 
      text: message, 
      type,
      timestamp: Date.now()
    }]);
  }, []);

  // Initialize user on mount
  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  // Auto-save functionality (debounced, saves 30 seconds after last state change)
  useEffect(() => {
    if (!isSupabaseConfigured() || !currentUserId) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:94',message:'auto-save timer scheduled',data:{stateLevel:state.player.level,stateHp:state.player.hp.current,lastStateRefLevel:lastStateRef.current?.player?.level},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    autoSaveTimerRef.current = setTimeout(async () => {
      // Use ref to get the latest state instead of closure variable
      const currentState = lastStateRef.current;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:95',message:'auto-save timer executed',data:{stateLevel:currentState.player.level,stateHp:currentState.player.hp.current,lastStateRefLevel:lastStateRef.current?.player?.level},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (currentSaveId) {
        // Update existing save
        setIsSaving(true);
        const result = await updateGameState(currentUserId, currentSaveId, currentState);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:98',message:'auto-save update result',data:{success:result.success,savedLevel:currentState.player.level},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (result.success) {
          setLastSaveTime(new Date());
        }
        setIsSaving(false);
      } else {
        // Create new auto-save
        setIsSaving(true);
        const result = await saveGameState(currentUserId, currentState, 'Auto Save');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usegamestate.js:106',message:'auto-save create result',data:{success:result.success,savedLevel:currentState.player.level},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (result.success) {
          setCurrentSaveId(result.saveId);
          setLastSaveTime(new Date());
        }
        setIsSaving(false);
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [state, currentUserId, currentSaveId]);

  // Manual save function
  const saveGame = useCallback(async (saveName = 'Manual Save') => {
    if (!isSupabaseConfigured() || !currentUserId) {
      return {
        success: false,
        error: 'Not logged in or Supabase not configured'
      };
    }

    setIsSaving(true);
    try {
      let result;
      if (currentSaveId) {
        // Update existing save
        result = await updateGameState(currentUserId, currentSaveId, state);
      } else {
        // Create new save
        result = await saveGameState(currentUserId, state, saveName);
        if (result.success) {
          setCurrentSaveId(result.saveId);
        }
      }

      if (result.success) {
        setLastSaveTime(new Date());
        addSystemMessage(`Game saved: ${saveName}`, 'system');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to save game'
      };
    } finally {
      setIsSaving(false);
    }
  }, [state, currentUserId, currentSaveId, addSystemMessage]);

  // Load game function
  const loadGame = useCallback(async (saveId) => {
    if (!isSupabaseConfigured() || !currentUserId) {
      return {
        success: false,
        error: 'Not logged in or Supabase not configured'
      };
    }

    try {
      const result = await loadGameState(currentUserId, saveId);
      if (result.success) {
        setState(result.gameState);
        setCurrentSaveId(saveId);
        setLastSaveTime(new Date(result.updatedAt));
        addSystemMessage(`Game loaded: ${result.saveName}`, 'system');
        // Clear chat log and reset it
        setChatLog([]);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to load game'
      };
    }
  }, [currentUserId, addSystemMessage]);

  // List saves function
  const getSavesList = useCallback(async () => {
    if (!isSupabaseConfigured() || !currentUserId) {
      return {
        success: false,
        saves: [],
        error: 'Not logged in or Supabase not configured'
      };
    }

    return await listSaves(currentUserId);
  }, [currentUserId]);

  // Delete save function
  const deleteSave = useCallback(async (saveId) => {
    if (!isSupabaseConfigured() || !currentUserId) {
      return {
        success: false,
        error: 'Not logged in or Supabase not configured'
      };
    }

    const { deleteSave: deleteSaveFunction } = await import('../lib/supabaseService');
    return await deleteSaveFunction(currentUserId, saveId);
  }, [currentUserId]);

  // Handle user authentication changes
  const handleAuthChange = useCallback((user) => {
    if (user) {
      setCurrentUserId(user.id);
      // Try to load most recent save
      listSaves(user.id).then(result => {
        if (result.success && result.saves.length > 0) {
          // Optionally auto-load most recent save
          // loadGame(result.saves[0].id);
        }
      });
    } else {
      setCurrentUserId(null);
      setCurrentSaveId(null);
      setLastSaveTime(null);
    }
  }, []);

  return { 
    state, 
    chatLog,
    setState,
    handleReward, 
    handleCombatHit,
    acknowledgeLevelUp,
    addSystemMessage,
    saveGame,
    loadGame,
    getSavesList,
    deleteSave,
    isSaving,
    lastSaveTime,
    currentUserId,
    handleAuthChange
  };
}