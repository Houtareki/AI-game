import React from 'react';
import StartScreen from './components/StartScreen';
import StoryInterface from './components/StoryInterface';
import { useGameEngine } from './hooks/useGameEngine';

const App: React.FC = () => {
  const { gameState, actions } = useGameEngine();
  const currentSegment = gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : null;

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-indigo-500/30">
      
      {gameState.error && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4 z-50">
          <div className="bg-red-900/90 border border-red-500/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 backdrop-blur-md animate-in slide-in-from-top-2">
             <div className="bg-red-800 p-2 rounded-full">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-lg mb-1">Gián đoạn kết nối</h3>
               <p className="text-sm text-red-100/90 leading-relaxed">{gameState.error}</p>
               <div className="mt-3 flex gap-3"><button onClick={actions.clearError} className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors">Đã hiểu</button></div>
             </div>
          </div>
        </div>
      )}

      {!currentSegment ? (
        <StartScreen onStart={actions.startGame} isLoading={gameState.isLoading} />
      ) : (
        <StoryInterface 
          segment={currentSegment}
          profile={gameState.characterProfile}
          notebook={gameState.notebook}
          quests={gameState.quests}
          stats={gameState.stats}
          playerStatus={gameState.playerStatus}
          onChoice={actions.makeChoice}
          isLoading={gameState.isLoading}
          isCheatMode={gameState.isCheatMode}
          toggleCheatMode={actions.toggleCheat}
          onRestart={actions.restartGame}
          onSave={actions.saveGame}
          onLoad={actions.loadGame}
          onUndo={actions.undo}
          canUndo={gameState.history.length > 1}
        />
      )}
    </div>
  );
};

export default App;
