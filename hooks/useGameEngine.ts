import { useState, useCallback } from 'react';
import { GameState, CharacterProfile, NotebookEntry, Quest, PlayerStatus } from '../types';
import { startNewGame, continueStory, generateStorySummary } from '../services/geminiService';

const INITIAL_STATE: GameState = {
  history: [],
  characterProfile: {
    name: "",
    personality: "",
    appearance: "",
    companion: "",
    genre: "",
    customSetting: ""
  },
  summary: "",
  notebook: [],
  quests: [],
  stats: { STR: 5, DEX: 5, INT: 5, CHA: 5, LCK: 5 },
  playerStatus: { hp: 100, maxHp: 100, sanity: 100, maxSanity: 100 },
  currentLocation: "Khởi đầu",
  isCheatMode: false,
  isLoading: false,
  error: null,
  userApiKey: null,
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  // --- Helpers ---
  const mergeNotebookUpdates = (currentNotebook: NotebookEntry[], updates: NotebookEntry[] | undefined) => {
    if (!updates || updates.length === 0) return currentNotebook;
    const newNotebook = [...currentNotebook];
    updates.forEach(update => {
      const index = newNotebook.findIndex(entry => entry.id === update.id);
      if (index !== -1) {
        const existing = newNotebook[index];
        const mergedMemories = Array.from(new Set([...existing.keyMemories, ...update.keyMemories]));
        newNotebook[index] = { ...existing, ...update, keyMemories: mergedMemories };
      } else {
        newNotebook.push(update);
      }
    });
    return newNotebook;
  };

  const mergeQuestUpdates = (currentQuests: Quest[], updates: Quest[] | undefined) => {
    if (!updates || updates.length === 0) return currentQuests;
    const newQuests = [...currentQuests];
    updates.forEach(update => {
      const index = newQuests.findIndex(q => q.id === update.id);
      if (index !== -1) newQuests[index] = update;
      else newQuests.push(update);
    });
    return newQuests;
  };

  const calculateNewStatus = (current: PlayerStatus, changes?: { hp?: number, sanity?: number }): PlayerStatus => {
    if (!changes) return current;
    let newHp = current.hp + (changes.hp || 0);
    let newSanity = current.sanity + (changes.sanity || 0);
    newHp = Math.min(newHp, current.maxHp);
    newSanity = Math.min(newSanity, current.maxSanity);
    return { ...current, hp: newHp, sanity: newSanity };
  };

  // --- Actions ---

  const startGame = useCallback(async (profile: CharacterProfile, apiKey: string | null) => {
    setGameState(prev => ({ ...INITIAL_STATE, characterProfile: profile, userApiKey: apiKey, isLoading: true }));
    
    try {
      const firstSegment = await startNewGame(profile, apiKey);
      setGameState(prev => ({
        ...prev,
        history: [firstSegment],
        notebook: mergeNotebookUpdates(prev.notebook, firstSegment.notebookUpdates),
        quests: mergeQuestUpdates(prev.quests, firstSegment.questUpdates),
        stats: firstSegment.statsUpdate ? { ...prev.stats, ...firstSegment.statsUpdate } : prev.stats,
        currentLocation: firstSegment.currentLocation || "Không xác định",
        isLoading: false
      }));
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Không thể khởi tạo cốt truyện. ";
      if (err.message && (err.message.includes("JSON") || err.message.includes("Unexpected token"))) {
        errorMessage += "Lỗi dữ liệu từ AI (JSON Parsing). Hãy thử lại.";
      } else {
        errorMessage += "Vui lòng kiểm tra API Key hoặc kết nối mạng.";
      }
      setGameState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, []);

  const makeChoice = useCallback(async (choiceText: string, isCheat: boolean) => {
    if (gameState.history.length > 0 && gameState.history[gameState.history.length - 1].isGameOver) return;

    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nextSegment = await continueStory(
        gameState.history, choiceText, isCheat, gameState.characterProfile,
        gameState.summary, gameState.notebook, gameState.quests, 
        gameState.stats, gameState.playerStatus, gameState.currentLocation, gameState.userApiKey
      );
      
      setGameState(prev => {
        const newHistory = [...prev.history, nextSegment];
        const updatedStatus = calculateNewStatus(prev.playerStatus, nextSegment.statusChanges);
        
        // Game Over Check
        if (updatedStatus.hp <= 0 || updatedStatus.sanity <= 0) {
          nextSegment.isGameOver = true;
          updatedStatus.hp = Math.max(0, updatedStatus.hp);
          updatedStatus.sanity = Math.max(0, updatedStatus.sanity);
        }

        // Summary Logic
        if (newHistory.length > 0 && newHistory.length % 5 === 0) {
           const isGrandSummary = newHistory.length % 20 === 0;
           generateStorySummary(prev.summary, newHistory.slice(-5), isGrandSummary, prev.userApiKey)
             .then(newSummary => setGameState(s => ({ ...s, summary: newSummary })));
        }

        return {
          ...prev,
          history: newHistory,
          notebook: mergeNotebookUpdates(prev.notebook, nextSegment.notebookUpdates),
          quests: mergeQuestUpdates(prev.quests, nextSegment.questUpdates),
          stats: nextSegment.statsUpdate ? { ...prev.stats, ...nextSegment.statsUpdate } : prev.stats,
          playerStatus: updatedStatus,
          currentLocation: nextSegment.currentLocation || prev.currentLocation,
          isLoading: false
        };
      });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "AI bị gián đoạn. ";
      if (err.message && (err.message.includes("JSON") || err.message.includes("Unexpected token"))) {
        errorMessage += "Dữ liệu trả về bị lỗi. Hãy thử lại.";
      } else {
        errorMessage += "Có thể do lỗi mạng hoặc API Key.";
      }
      setGameState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, [gameState]);

  const undo = useCallback(() => {
    setGameState(prev => {
      if (prev.history.length <= 1) return prev;
      const lastSegment = prev.history[prev.history.length - 1];
      let revertedStatus = { ...prev.playerStatus };
      if (lastSegment.statusChanges) {
         revertedStatus.hp -= (lastSegment.statusChanges.hp || 0);
         revertedStatus.sanity -= (lastSegment.statusChanges.sanity || 0);
      }
      return {
        ...prev,
        history: prev.history.slice(0, -1),
        currentLocation: prev.history[prev.history.length - 2].currentLocation || prev.currentLocation,
        playerStatus: revertedStatus,
        error: null
      };
    });
  }, []);

  const loadGameFromData = useCallback((data: GameState) => {
    setGameState({ ...data, isLoading: false, error: null });
  }, []);

  const restartGame = useCallback(() => {
    if (window.confirm("Chơi lại từ đầu?")) setGameState(INITIAL_STATE);
  }, []);

  const toggleCheat = useCallback(() => {
    setGameState(prev => ({ ...prev, isCheatMode: !prev.isCheatMode }));
  }, []);

  const clearError = useCallback(() => {
      setGameState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    gameState,
    actions: { startGame, makeChoice, undo, loadGameFromData, restartGame, toggleCheat, clearError }
  };
};
