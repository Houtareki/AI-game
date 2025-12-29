import React, { useEffect, useRef, useState } from 'react';
import { StorySegment, CharacterProfile, NotebookEntry, Quest, CharacterStats, StoryChoice, PlayerStatus } from '../types';
import Button from './Button';
import CheatConsole from './CheatConsole';
import NotebookModal from './NotebookModal';
import Sidebar from './Sidebar';

interface StoryInterfaceProps {
  segment: StorySegment;
  profile: CharacterProfile;
  notebook: NotebookEntry[]; 
  quests: Quest[];
  stats: CharacterStats;
  playerStatus: PlayerStatus;
  onChoice: (choiceText: string, isCheat: boolean) => void;
  isLoading: boolean;
  isCheatMode: boolean;
  toggleCheatMode: () => void;
  onRestart: () => void;
  onSave: () => void;
  onLoad: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const StoryInterface: React.FC<StoryInterfaceProps> = ({ 
  segment, profile, notebook, quests, stats, playerStatus,
  onChoice, isLoading, isCheatMode, toggleCheatMode,
  onRestart, onSave, onLoad, onUndo, canUndo
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [damageEffect, setDamageEffect] = useState<'hp' | 'sanity' | null>(null);
  
  // Rolling State
  const [rollingChoiceId, setRollingChoiceId] = useState<string | null>(null);
  const [rollResult, setRollResult] = useState<{roll: number, total: number, isSuccess: boolean} | null>(null);

  // Scroll to top
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [segment.title]);

  // Handle damage effects
  useEffect(() => {
    if (segment.statusChanges) {
       if ((segment.statusChanges.hp || 0) < 0) {
         setDamageEffect('hp');
         setTimeout(() => setDamageEffect(null), 500);
       } else if ((segment.statusChanges.sanity || 0) < 0) {
         setDamageEffect('sanity');
         setTimeout(() => setDamageEffect(null), 500);
       }
    }
  }, [segment.statusChanges]);

  const handleChoiceClick = (choice: StoryChoice) => {
    if (choice.skillCheck) {
      setRollingChoiceId(choice.id);
      setTimeout(() => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const statVal = stats[choice.skillCheck!.stat] || 0;
        const total = d20 + statVal;
        const isSuccess = total >= choice.skillCheck!.difficulty;
        setRollResult({ roll: d20, total, isSuccess });

        setTimeout(() => {
          const outcomeString = `Người chơi chọn: "${choice.text}".\nCHECK: ${choice.skillCheck!.stat} (DC ${choice.skillCheck!.difficulty}).\nROLL: D20(${d20}) + ${statVal} = ${total}.\nKẾT QUẢ: ${isSuccess ? "[THÀNH CÔNG]" : "[THẤT BẠI]"}.`;
          onChoice(outcomeString, false);
          setRollingChoiceId(null);
          setRollResult(null);
        }, 1500);
      }, 800);
    } else {
      onChoice(choice.text, false);
    }
  };

  const getDifficultyColor = (dc: number) => {
     if (dc <= 10) return "text-green-400";
     if (dc <= 15) return "text-yellow-400";
     if (dc <= 20) return "text-orange-500";
     return "text-red-600";
  };

  return (
    <div className={`h-screen flex flex-col md:flex-row max-w-[1600px] mx-auto overflow-hidden bg-gray-950 shadow-2xl border-x border-gray-900 ${damageEffect === 'hp' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
      
      {/* Damage Overlay */}
      {damageEffect === 'hp' && <div className="absolute inset-0 z-[100] bg-red-500/20 pointer-events-none animate-pulse"></div>}
      {damageEffect === 'sanity' && <div className="absolute inset-0 z-[100] bg-purple-500/20 pointer-events-none animate-pulse filter blur-sm"></div>}

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center z-40 shrink-0">
         <span className="font-bold text-gray-200">Infinite Chronicles</span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 border border-gray-700 p-1.5 rounded">
            {isMobileMenuOpen ? 'Đóng Menu' : 'Menu / NV'}
         </button>
      </div>

      {/* Sidebar Component */}
      <Sidebar 
        segment={segment} notebook={notebook} quests={quests} stats={stats} playerStatus={playerStatus}
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onUndo={onUndo} onSave={onSave} onLoad={onLoad} onRestart={onRestart}
        toggleCheatMode={toggleCheatMode} isCheatMode={isCheatMode} canUndo={canUndo} isLoading={isLoading}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#0B0F19]">
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-4"> 
             <header className="mb-6 border-b border-gray-800/50 pb-4">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-100 font-serif leading-tight tracking-tight drop-shadow-lg">{segment.title}</h1>
             </header>

             <article className="prose-story text-base md:text-lg text-gray-300 leading-relaxed whitespace-pre-line text-justify">
               {segment.content}
             </article>
             
             {segment.isGameOver && (
               <div className="mt-10 p-6 bg-gray-900/80 rounded-xl border border-gray-700 text-center animate-in zoom-in duration-500">
                 <h3 className="text-3xl font-bold text-red-500 mb-2 uppercase">
                   {playerStatus.hp <= 0 ? "BẠN ĐÃ TỬ NẠN" : (playerStatus.sanity <= 0 ? "BẠN ĐÃ HÓA ĐIÊN" : "KẾT THÚC")}
                 </h3>
                 <p className="text-gray-400 mb-6">
                   {playerStatus.hp <= 0 ? "Sức cùng lực kiệt, hành trình của bạn dừng lại tại đây." : (playerStatus.sanity <= 0 ? "Tâm trí bạn vỡ vụn, thực tại chỉ còn là những mảnh ghép méo mó." : "Hành trình đã kết thúc.")}
                 </p>
                 <div className="flex justify-center gap-4"><Button onClick={onLoad} variant="secondary">Tải lại bản lưu</Button><Button onClick={onRestart} variant="danger">Chơi lại từ đầu</Button></div>
               </div>
             )}
          </div>
        </div>

        {/* Choices */}
        <div className="border-t border-gray-800 bg-[#0B0F19]/95 backdrop-blur-xl p-3 md:p-4 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
           <div className="max-w-4xl mx-auto">
             {!segment.isGameOver ? (
                <>
                  {isCheatMode ? <CheatConsole onCheatSubmit={(text) => onChoice(text, true)} isLoading={isLoading} /> : (
                    <div className="grid grid-cols-1 gap-2"> 
                      {segment.choices.map((choice) => (
                        <Button
                          key={choice.id}
                          onClick={() => handleChoiceClick(choice)}
                          variant="secondary"
                          isLoading={isLoading || (rollingChoiceId === choice.id)}
                          disabled={isLoading || (rollingChoiceId !== null && rollingChoiceId !== choice.id)}
                          className={`w-full justify-between text-left h-auto py-3 px-4 hover:border-indigo-500 hover:bg-gray-800/80 group transition-all duration-200 border-gray-700 bg-gray-900 ${choice.skillCheck ? 'border-yellow-600/30' : ''}`} 
                        >
                          <div className="flex items-center">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-600 group-hover:border-indigo-400 group-hover:bg-indigo-500/10 flex items-center justify-center mr-3 text-xs text-gray-500 group-hover:text-indigo-400 transition-colors">➤</span>
                              <span className="text-gray-200 group-hover:text-white text-sm font-medium line-clamp-1 md:line-clamp-2">{choice.text}</span>
                          </div>
                          {choice.skillCheck && (
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                <div className="text-[10px] text-gray-400 bg-black/40 px-2 py-1 rounded border border-gray-700">
                                   <span className="font-bold text-indigo-300">{choice.skillCheck.stat}</span><span className="mx-1">|</span><span className={`${getDifficultyColor(choice.skillCheck.difficulty)} font-bold`}>DC {choice.skillCheck.difficulty}</span>
                                </div>
                            </div>
                          )}
                          {rollingChoiceId === choice.id && (
                             <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-lg z-10 animate-in fade-in zoom-in duration-200">
                                {rollResult ? (
                                    <div className={`text-xl font-bold flex gap-2 items-center ${rollResult.isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                                       <span>{rollResult.isSuccess ? 'SUCCESS' : 'FAILURE'}</span><span className="text-sm text-gray-400">({rollResult.roll}+{stats[choice.skillCheck!.stat]||0}={rollResult.total})</span>
                                    </div>
                                ) : <div className="text-yellow-500 font-mono text-sm animate-pulse">🎲 ROLLING D20...</div>}
                             </div>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-[#0B0F19]/90 flex items-center justify-center backdrop-blur-sm z-50 rounded-t-xl">
                      <div className="flex flex-col items-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div><p className="text-indigo-400 font-medium text-sm animate-pulse">AI đang dệt nên định mệnh...</p></div>
                    </div>
                  )}
                </>
             ) : (
                <div className="flex gap-2"><Button onClick={onRestart} className="flex-1 py-3 text-sm">Chơi lại</Button><Button onClick={onLoad} variant="secondary" className="flex-1 py-3 text-sm">Tải bản lưu</Button></div>
             )}
           </div>
        </div>
      </div>

      {isNotebookOpen && <NotebookModal notebook={notebook} onClose={() => setIsNotebookOpen(false)} />}
    </div>
  );
};

export default StoryInterface;
