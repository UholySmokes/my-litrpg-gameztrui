// useGameEngine.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { initialgamestate } from '../core/GameState.js';
import { addXp } from '../systems/leveling/LevelingManager.js';
import { takeDamage } from '../systems/combat/CombatSystem.js';
import { addItem } from '../systems/inventory/InventorySystem.js';
import { resetLevelUpFlag } from '../core/GameState.js';
import { saveGameState, updateGameState, loadGameState, listSaves, isSupabaseConfigured } from '../core/SupabaseService.js';
import { getCurrentUser } from '../core/AuthService.js';

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
    setState(prevState => {
      const newState = resetLevelUpFlag(prevState);
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
    autoSaveTimerRef.current = setTimeout(async () => {
      // Use ref to get the latest state instead of closure variable
      const currentState = lastStateRef.current;
      if (currentSaveId) {
        // Update existing save
        setIsSaving(true);
        const result = await updateGameState(currentUserId, currentSaveId, currentState);
        if (result.success) {
          setLastSaveTime(new Date());
        }
        setIsSaving(false);
      } else {
        // Create new auto-save
        setIsSaving(true);
        const result = await saveGameState(currentUserId, currentState, 'Auto Save');
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

    const { deleteSave: deleteSaveFunction } = await import('../core/SupabaseService.js');
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
