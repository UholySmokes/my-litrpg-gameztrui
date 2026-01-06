// =================================================================
// USE NARRATIVE HOOK
// Manages AI narrative flow: parse -> validate -> execute -> generate narrative
// =================================================================

import { useState, useCallback } from 'react';
import { parseAction } from '../core/InputParser.js';
import { validateActionComprehensive } from '../core/InputValidator.js';
import { executeAction } from '../core/ActionDispatcher.js';
import { assemblePrompt, buildInitialPrompt } from '../core/PromptAssembler.js';
import { generateNarrative, generateInitialNarrative } from '../core/AIService.js';

/**
 * Custom hook for managing AI narrative and user actions
 * @param {function} setState - Function to update game state
 * @param {function} addSystemMessage - Function to add messages to chat log
 * @returns {object} Hook interface with submitInput function and loading state
 */
export function useNarrative(setState, addSystemMessage) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Processes user input through the full narrative pipeline
   */
  const submitInput = useCallback(async (userInput, currentState) => {
    if (!userInput || !userInput.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Parse the user input into an action
      const action = parseAction(userInput, currentState);
      
      // Step 2: Validate the action
      const validation = validateActionComprehensive(action, currentState);
      
      if (!validation.valid) {
        // Action failed validation - add error message and generate narrative about failure
        addSystemMessage(`Action failed: ${validation.reason}`, 'system');
        
        // Generate AI narrative about the failure
        try {
          const failurePrompt = assemblePrompt(
            currentState,
            userInput,
            {
              success: false,
              reason: validation.reason,
              description: `Attempted: ${userInput}`
            }
          );
          
          const aiResponse = await generateNarrative(failurePrompt);
          addSystemMessage(aiResponse.narrative, 'narrative');
        } catch (aiError) {
          console.error('AI narrative generation failed:', aiError);
          addSystemMessage(`You cannot do that. ${validation.reason}`, 'system');
        }
        
        setIsLoading(false);
        return;
      }

      // Step 3: Execute the action (if it changes state)
      let actionResult;
      let newState = currentState;
      
      if (action.type === 'narrative' || action.readOnly) {
        // Read-only actions don't change state
        actionResult = {
          success: true,
          description: `Player said: "${userInput}"`,
          state: currentState,
          readOnly: true
        };
      } else {
        // Execute state-changing action
        actionResult = executeAction(currentState, action);
        newState = actionResult.state;
      }

      // Step 4: Update game state if action succeeded
      if (actionResult.success && !actionResult.readOnly) {
        setState(newState);
      }

      // Step 5: Handle special actions (like status display)
      if (actionResult.showStatus) {
        const { renderstatusblock } = await import('../util/statusrenderer');
        const statusString = renderstatusblock(newState.player);
        addSystemMessage(statusString, 'status-update');
        setIsLoading(false);
        return;
      }

      // Step 6: Generate AI narrative response
      try {
        const prompt = assemblePrompt(currentState, userInput, actionResult);
        const aiResponse = await generateNarrative(prompt);
        
        // Add AI narrative to chat log
        addSystemMessage(aiResponse.narrative, 'narrative');
        
        // Update narrative history in state
        setState(prevState => ({
          ...prevState,
          narrative: {
            ...prevState.narrative,
            chatLog: [
              ...(prevState.narrative.chatLog || []),
              {
                type: 'narrative',
                text: aiResponse.narrative,
                timestamp: Date.now()
              }
            ].slice(-50) // Keep last 50 messages for history
          }
        }));
        
      } catch (aiError) {
        console.error('AI narrative generation failed:', aiError);
        // Fallback message if AI fails
        if (actionResult.success) {
          addSystemMessage(
            actionResult.description || 'Action completed successfully.',
            'system'
          );
        } else {
          addSystemMessage(
            actionResult.reason || 'Action could not be completed.',
            'system'
          );
        }
      }

    } catch (err) {
      console.error('Error processing input:', err);
      setError(err.message || 'An error occurred processing your input.');
      addSystemMessage(
        `Error: ${err.message || 'Something went wrong.'}`,
        'system'
      );
    } finally {
      setIsLoading(false);
    }
  }, [setState, addSystemMessage]);

  /**
   * Generates initial narrative when game starts
   */
  const generateInitialNarrativeText = useCallback(async (currentState) => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = buildInitialPrompt();
      const aiResponse = await generateInitialNarrative(prompt);
      
      addSystemMessage(aiResponse.narrative, 'narrative');
      
      // Update narrative history
      setState(prevState => ({
        ...prevState,
        narrative: {
          ...prevState.narrative,
          summary: aiResponse.narrative,
          chatLog: [
            {
              type: 'narrative',
              text: aiResponse.narrative,
              timestamp: Date.now()
            }
          ]
        }
      }));
      
    } catch (err) {
      console.error('Error generating initial narrative:', err);
      setError(err.message || 'Failed to generate initial narrative.');
      addSystemMessage(
        'Welcome to your LitRPG adventure! Type your actions to begin.',
        'system'
      );
    } finally {
      setIsLoading(false);
    }
  }, [setState, addSystemMessage]);

  return {
    submitInput,
    generateInitialNarrativeText,
    isLoading,
    error
  };
}
