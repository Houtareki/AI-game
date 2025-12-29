import React, { useState, useCallback, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import StoryInterface from './components/StoryInterface';
import { GameState, CharacterProfile, NotebookEntry, Quest, CharacterStats, PlayerStatus } from './types';
import { startNewGame, continueStory, generateStorySummary } from './services/geminiService';

const SAVE_KEY = 'infinite_chronicles_save';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
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
  });

  // Helper to merge notebook updates
  const mergeNotebookUpdates = (currentNotebook: NotebookEntry[], updates: NotebookEntry[] | undefined) => {
    if (!updates || updates.length === 0) return currentNotebook;
    
    const newNotebook = [...currentNotebook];
    
    updates.forEach(update => {
      const index = newNotebook.findIndex(entry => entry.id === update.id);
      if (index !== -1) {
        // Update existing entry
        const existing = newNotebook[index];
        const mergedMemories = Array.from(new Set([...existing.keyMemories, ...update.keyMemories]));
        
        newNotebook[index] = {
          ...existing, 
          ...update, 
          keyMemories: mergedMemories
        };
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

    // Clamp values
    newHp = Math.min(newHp, current.maxHp);
    newSanity = Math.min(newSanity, current.maxSanity);

    // Note: We allow values to go below 0 here to trigger Game Over logic later
    return {
      ...current,
      hp: newHp,
      sanity: newSanity
    };
  };

  const handleStartGame = useCallback(async (profile: CharacterProfile, apiKey: string | null) => {
    setGameState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      characterProfile: profile, 
      userApiKey: apiKey,
      summary: "",
      notebook: [],
      quests: [],
      stats: { STR: 5, DEX: 5, INT: 5, CHA: 5, LCK: 5 },
      playerStatus: { hp: 100, maxHp: 100, sanity: 100, maxSanity: 100 },
      currentLocation: "Khởi đầu"
    }));
    
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
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: "Không thể khởi tạo cốt truyện. Vui lòng kiểm tra API Key hoặc kết nối mạng."
      }));
    }
  }, []);

  const handleChoice = useCallback(async (choiceText: string, isCheat: boolean) => {
    // Check if game is already over
    if (gameState.history.length > 0 && gameState.history[gameState.history.length - 1].isGameOver) {
      return;
    }

    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nextSegment = await continueStory(
        gameState.history, 
        choiceText, 
        isCheat, 
        gameState.characterProfile,
        gameState.summary,
        gameState.notebook, 
        gameState.quests, 
        gameState.stats,
        gameState.playerStatus, // Send Current Status
        gameState.currentLocation, 
        gameState.userApiKey
      );
      
      setGameState(prev => {
        const newHistory = [...prev.history, nextSegment];
        const turnCount = newHistory.length;
        
        const updatedNotebook = mergeNotebookUpdates(prev.notebook, nextSegment.notebookUpdates);
        const updatedQuests = mergeQuestUpdates(prev.quests, nextSegment.questUpdates);
        const updatedStats = nextSegment.statsUpdate ? { ...prev.stats, ...nextSegment.statsUpdate } : prev.stats;
        
        // Calculate Status Updates
        const updatedStatus = calculateNewStatus(prev.playerStatus, nextSegment.statusChanges);
        
        // Check Survival Game Over Conditions
        const isDead = updatedStatus.hp <= 0;
        const isInsane = updatedStatus.sanity <= 0;
        const isSurvivalGameOver = isDead || isInsane;

        // Force Game Over if survival failure
        if (isSurvivalGameOver) {
          nextSegment.isGameOver = true;
          // Ensure min value is 0 for display
          updatedStatus.hp = Math.max(0, updatedStatus.hp);
          updatedStatus.sanity = Math.max(0, updatedStatus.sanity);
        }

        const newLocation = nextSegment.currentLocation || prev.currentLocation;

        if (turnCount > 0 && turnCount % 5 === 0) {
           const isGrandSummary = turnCount % 20 === 0;
           generateStorySummary(prev.summary, newHistory.slice(-5), isGrandSummary, prev.userApiKey)
             .then(newSummary => {
               setGameState(s => ({ ...s, summary: newSummary }));
             });
        }

        return {
          ...prev,
          history: newHistory,
          notebook: updatedNotebook,
          quests: updatedQuests,
          stats: updatedStats,
          playerStatus: updatedStatus, // Update Status state
          currentLocation: newLocation,
          isLoading: false
        };
      });
    } catch (err: any) {
      console.error(err);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: "AI bị gián đoạn. Có thể do quá tải hoặc lỗi mạng. Hãy thử lại."
      }));
    }
  }, [gameState.history, gameState.characterProfile, gameState.summary, gameState.notebook, gameState.quests, gameState.stats, gameState.playerStatus, gameState.currentLocation, gameState.userApiKey]);

  const handleUndo = useCallback(() => {
    setGameState(prev => {
      if (prev.history.length <= 1) return prev;
      
      // We need to revert status as well. 
      // This simple undo mechanism is imperfect for complex state, but sufficient for now.
      // Ideally, we'd store snapshots of state in history.
      // For now, let's just reverse the last status change if possible, or accept slight desync.
      // Better approach: Just revert history and location, status desync is acceptable for simple undo.
      // OR: Store full state in history stack (too heavy for this refactor).
      
      // Simple fix: Reverse the last segment's changes if they exist
      const lastSegment = prev.history[prev.history.length - 1];
      let revertedStatus = { ...prev.playerStatus };
      if (lastSegment.statusChanges) {
         revertedStatus.hp -= (lastSegment.statusChanges.hp || 0);
         revertedStatus.sanity -= (lastSegment.statusChanges.sanity || 0);
      }
      
      const previousSegment = prev.history[prev.history.length - 2];

      return {
        ...prev,
        history: prev.history.slice(0, -1),
        currentLocation: previousSegment.currentLocation || prev.currentLocation,
        playerStatus: revertedStatus,
        error: null
      };
    });
  }, []);

  const toggleCheatMode = useCallback(() => {
    setGameState(prev => ({ ...prev, isCheatMode: !prev.isCheatMode }));
  }, []);

  const saveGame = useCallback(() => {
    try {
      const saveData = {
        history: gameState.history,
        characterProfile: gameState.characterProfile,
        summary: gameState.summary,
        notebook: gameState.notebook,
        quests: gameState.quests,
        stats: gameState.stats,
        playerStatus: gameState.playerStatus,
        currentLocation: gameState.currentLocation,
        userApiKey: gameState.userApiKey,
        isCheatMode: gameState.isCheatMode
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      alert("Đã lưu game thành công!");
    } catch (e) {
      alert("Không thể lưu game. Bộ nhớ trình duyệt có thể đã đầy.");
    }
  }, [gameState]);

  const loadGame = useCallback(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        if (window.confirm("Bạn có chắc muốn tải lại game đã lưu? Tiến trình hiện tại sẽ bị mất.")) {
          const parsed = JSON.parse(saved);
          setGameState(prev => ({
            ...prev,
            ...parsed,
            notebook: parsed.notebook || [], 
            quests: parsed.quests || [],
            stats: parsed.stats || { STR: 5, DEX: 5, INT: 5, CHA: 5, LCK: 5 },
            playerStatus: parsed.playerStatus || { hp: 100, maxHp: 100, sanity: 100, maxSanity: 100 },
            currentLocation: parsed.currentLocation || "Không xác định",
            isLoading: false,
            error: null
          }));
        }
      } else {
        alert("Không tìm thấy bản lưu nào.");
      }
    } catch (e) {
      alert("File lưu bị lỗi.");
    }
  }, []);

  const restartGame = useCallback(() => {
    if (window.confirm("Bạn có chắc muốn kết thúc hành trình này và quay lại màn hình chính?")) {
        setGameState({
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
          userApiKey: null
        });
    }
  }, []);

  const currentSegment = gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : null;

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-indigo-500/30">
      
      {gameState.error && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4 z-50">
          <div className="bg-red-900/90 border border-red-500/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 backdrop-blur-md animate-in slide-in-from-top-2">
             <div className="bg-red-800 p-2 rounded-full">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-lg mb-1">Gián đoạn kết nối</h3>
               <p className="text-sm text-red-100/90 leading-relaxed">{gameState.error}</p>
               <div className="mt-3 flex gap-3">
                 <button 
                   onClick={() => setGameState(prev => ({...prev, error: null}))}
                   className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                 >
                   Đã hiểu
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {!currentSegment ? (
        <StartScreen onStart={handleStartGame} isLoading={gameState.isLoading} />
      ) : (
        <StoryInterface 
          segment={currentSegment}
          profile={gameState.characterProfile}
          notebook={gameState.notebook}
          quests={gameState.quests}
          stats={gameState.stats}
          playerStatus={gameState.playerStatus} // Pass Status
          onChoice={handleChoice}
          isLoading={gameState.isLoading}
          isCheatMode={gameState.isCheatMode}
          toggleCheatMode={toggleCheatMode}
          onRestart={restartGame}
          onSave={saveGame}
          onLoad={loadGame}
          onUndo={handleUndo}
          canUndo={gameState.history.length > 1}
        />
      )}
    </div>
  );
};

export default App;