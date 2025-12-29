import React, { useEffect, useRef, useState } from 'react';
import { StorySegment, CharacterProfile, NotebookEntry, Quest, CharacterStats, StoryChoice, PlayerStatus, StatusChange } from '../types';
import Button from './Button';
import CheatConsole from './CheatConsole';
import NotebookModal from './NotebookModal';

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
  segment, 
  profile,
  notebook,
  quests,
  stats,
  playerStatus,
  onChoice, 
  isLoading, 
  isCheatMode, 
  toggleCheatMode,
  onRestart,
  onSave,
  onLoad,
  onUndo,
  canUndo
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'info' | 'quests'>('info');
  const [damageEffect, setDamageEffect] = useState<'hp' | 'sanity' | null>(null);
  
  // Rolling State
  const [rollingChoiceId, setRollingChoiceId] = useState<string | null>(null);
  const [rollResult, setRollResult] = useState<{roll: number, total: number, isSuccess: boolean} | null>(null);

  // Scroll to top
  useEffect(() => {
    if (contentRef.current) {
        contentRef.current.scrollTop = 0;
    }
  }, [segment.title]);

  // Handle damage effects when status changes
  useEffect(() => {
    if (segment.statusChanges) {
       if (segment.statusChanges.hp && segment.statusChanges.hp < 0) {
         setDamageEffect('hp');
         setTimeout(() => setDamageEffect(null), 500);
       } else if (segment.statusChanges.sanity && segment.statusChanges.sanity < 0) {
         setDamageEffect('sanity');
         setTimeout(() => setDamageEffect(null), 500);
       }
    }
  }, [segment.statusChanges]);

  const activeQuests = quests.filter(q => q.status === 'active' || q.status === 'new');
  const completedQuests = quests.filter(q => q.status === 'completed' || q.status === 'failed');

  const handleChoiceClick = (choice: StoryChoice) => {
    if (choice.skillCheck) {
      // PERFORM DICE ROLL
      setRollingChoiceId(choice.id);
      
      setTimeout(() => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const statVal = stats[choice.skillCheck!.stat] || 0;
        const total = d20 + statVal;
        const isSuccess = total >= choice.skillCheck!.difficulty;
        
        setRollResult({ roll: d20, total, isSuccess });

        // Delay to show result before sending to AI
        setTimeout(() => {
          const outcomeString = `Người chơi chọn hành động: "${choice.text}".\n` + 
            `YÊU CẦU KIỂM TRA KỸ NĂNG: ${choice.skillCheck!.stat} (Độ khó ${choice.skillCheck!.difficulty}).\n` +
            `KẾT QUẢ GIEO XÚC XẮC: D20(${d20}) + Stat(${statVal}) = TỔNG ${total}.\n` +
            `KẾT LUẬN: ${isSuccess ? "[THÀNH CÔNG - SUCCESS]" : "[THẤT BẠI - FAILURE]"}.`;
            
          onChoice(outcomeString, false);
          setRollingChoiceId(null);
          setRollResult(null);
        }, 1500);
      }, 800); // Fake roll animation time
    } else {
      // Normal choice
      onChoice(choice.text, false);
    }
  };

  const getDifficultyColor = (dc: number) => {
     if (dc <= 10) return "text-green-400";
     if (dc <= 15) return "text-yellow-400";
     if (dc <= 20) return "text-orange-500";
     return "text-red-600";
  };

  const getDifficultyLabel = (dc: number) => {
    if (dc <= 10) return "Dễ";
    if (dc <= 15) return "Vừa";
    if (dc <= 20) return "Khó";
    return "Tử địa";
  };

  return (
    <div className={`h-screen flex flex-col md:flex-row max-w-[1600px] mx-auto overflow-hidden bg-gray-950 shadow-2xl border-x border-gray-900 ${damageEffect === 'hp' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
      
      {/* Damage Overlay */}
      {damageEffect === 'hp' && <div className="absolute inset-0 z-[100] bg-red-500/20 pointer-events-none animate-pulse"></div>}
      {damageEffect === 'sanity' && <div className="absolute inset-0 z-[100] bg-purple-500/20 pointer-events-none animate-pulse filter blur-sm"></div>}

      {/* Mobile Header / Menu Toggle */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center z-40 shrink-0">
         <span className="font-bold text-gray-200">Infinite Chronicles</span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 border border-gray-700 p-1.5 rounded">
            {isMobileMenuOpen ? 'Đóng Menu' : 'Menu / NV'}
         </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-0 bg-gray-950 z-50 md:relative md:inset-auto md:w-80 md:bg-gray-900 md:border-r md:border-gray-800 md:flex md:flex-col md:shrink-0 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0 flex flex-col' : '-translate-x-full md:translate-x-0 hidden'}
      `}>
         {/* Mobile Close Button */}
         <div className="md:hidden p-4 border-b border-gray-800 flex justify-end">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">✕ Đóng</button>
         </div>

         {/* Sidebar Tabs */}
         <div className="p-2 border-b border-gray-800 flex gap-1 bg-gray-900/50">
           <button 
             onClick={() => setSidebarTab('info')}
             className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${
               sidebarTab === 'info' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
             }`}
           >
             Hồ sơ & Túi
           </button>
           <button 
             onClick={() => setSidebarTab('quests')}
             className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors relative ${
               sidebarTab === 'quests' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
             }`}
           >
             Nhiệm vụ
             {activeQuests.length > 0 && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white items-center justify-center">{activeQuests.length}</span>
               </span>
             )}
           </button>
         </div>

        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {sidebarTab === 'info' ? (
              <>
                {/* --- SURVIVAL STATUS BARS --- */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-inner">
                   <h2 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-3 flex justify-between">
                     Trạng Thái Sinh Tồn
                   </h2>
                   
                   {/* HP BAR */}
                   <div className="mb-3">
                     <div className="flex justify-between text-[10px] uppercase mb-1 font-bold">
                       <span className="text-red-400">HP (Sức Khỏe)</span>
                       <span className="text-gray-300">{playerStatus.hp}/{playerStatus.maxHp}</span>
                     </div>
                     <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                        <div 
                          className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500 ease-out" 
                          style={{ width: `${Math.max(0, (playerStatus.hp / playerStatus.maxHp) * 100)}%` }}
                        ></div>
                     </div>
                   </div>

                   {/* SANITY BAR */}
                   <div>
                     <div className="flex justify-between text-[10px] uppercase mb-1 font-bold">
                       <span className="text-purple-400">Sanity (Tinh Thần)</span>
                       <span className="text-gray-300">{playerStatus.sanity}/{playerStatus.maxSanity}</span>
                     </div>
                     <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-800 to-blue-500 transition-all duration-500 ease-out" 
                          style={{ width: `${Math.max(0, (playerStatus.sanity / playerStatus.maxSanity) * 100)}%` }}
                        ></div>
                     </div>
                   </div>
                </div>

                {/* Character Stats RPG Style */}
                <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                   <h2 className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-gray-700 pb-1 flex justify-between">
                     Chỉ Số (Stats)
                     <span className="text-gray-500 text-[9px]">D20 System</span>
                   </h2>
                   <div className="space-y-3">
                     {[
                       { k: 'STR', l: 'Sức Mạnh', v: stats.STR, c: 'bg-red-500' },
                       { k: 'DEX', l: 'Khéo Léo', v: stats.DEX, c: 'bg-green-500' },
                       { k: 'INT', l: 'Trí Tuệ', v: stats.INT, c: 'bg-blue-500' },
                       { k: 'CHA', l: 'Thu Hút', v: stats.CHA, c: 'bg-purple-500' },
                       { k: 'LCK', l: 'May Mắn', v: stats.LCK, c: 'bg-yellow-500' },
                     ].map((stat) => (
                       <div key={stat.k} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${stat.c} bg-opacity-20 flex items-center justify-center border border-${stat.c.replace('bg-', '')}/30 text-xs font-bold text-gray-200`}>
                            {stat.k}
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between text-[10px] uppercase text-gray-400 mb-1">
                               <span>{stat.l}</span>
                               <span className="font-mono font-bold text-gray-200 text-sm">{stat.v}</span>
                             </div>
                             <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${stat.c}`} style={{ width: `${(stat.v / 20) * 100}%` }}></div>
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
                
                {/* Inventory */}
                <div className="mb-4">
                  <h2 className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-2">Hành trang</h2>
                  {segment.inventory && segment.inventory.length > 0 ? (
                      <ul className="space-y-1.5">
                      {segment.inventory.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-gray-300 bg-gray-800/40 p-2 rounded hover:bg-gray-800 transition-colors">
                          <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span>
                          {item}
                          </li>
                      ))}
                      </ul>
                  ) : (
                      <p className="text-gray-600 text-xs italic">Túi đồ rỗng</p>
                  )}
                </div>
              </>
            ) : (
              // QUEST TAB CONTENT
              <div className="space-y-6">
                 {/* Active Quests */}
                 <div>
                   <h2 className="text-yellow-500 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                     Đang thực hiện
                   </h2>
                   {activeQuests.length === 0 ? (
                     <p className="text-gray-600 text-xs italic text-center">Chưa có nhiệm vụ nào.</p>
                   ) : (
                     <div className="space-y-3">
                       {activeQuests.map(quest => (
                         <div key={quest.id} className={`p-3 rounded-lg border ${quest.type === 'main' ? 'bg-yellow-900/10 border-yellow-700/50' : 'bg-gray-800/40 border-gray-700'}`}>
                           <div className="flex justify-between items-start mb-1">
                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${quest.type === 'main' ? 'bg-yellow-600 text-black' : 'bg-gray-600 text-gray-200'}`}>
                               {quest.type === 'main' ? 'Chính' : 'Phụ'}
                             </span>
                             {quest.status === 'new' && <span className="text-[9px] text-green-400 font-bold animate-pulse">MỚI</span>}
                           </div>
                           <h3 className={`font-bold text-sm mb-1 ${quest.type === 'main' ? 'text-yellow-100' : 'text-gray-200'}`}>{quest.name}</h3>
                           <p className="text-xs text-gray-400 mb-2 leading-relaxed">{quest.description}</p>
                           <div className="bg-black/30 p-2 rounded text-[10px] text-gray-300 border border-gray-700/30">
                             <span className="text-indigo-400 font-bold">Tiến độ: </span>
                             {quest.progress}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

                 {/* Completed Quests */}
                 {completedQuests.length > 0 && (
                   <div>
                      <h2 className="text-green-600 text-[10px] uppercase tracking-widest font-bold mb-3 pt-4 border-t border-gray-800">
                        Đã Hoàn Thành / Thất Bại
                      </h2>
                      <div className="space-y-2 opacity-70">
                        {completedQuests.map(quest => (
                          <div key={quest.id} className="p-2 rounded bg-gray-900 border border-gray-800 flex justify-between items-center">
                            <span className="text-xs text-gray-500 line-through">{quest.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${quest.status === 'completed' ? 'text-green-500 bg-green-900/20' : 'text-red-500 bg-red-900/20'}`}>
                              {quest.status === 'completed' ? 'Xong' : 'Hủy'}
                            </span>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
            )}

        </div>

        {/* Sidebar Fixed Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 space-y-2 shrink-0">
           <Button 
                onClick={() => { setIsNotebookOpen(true); setIsMobileMenuOpen(false); }} 
                variant="primary"
                className="w-full py-3 mb-2 text-xs font-bold uppercase tracking-wide border-indigo-500 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200"
             >
                📖 Sổ Tay ({notebook.length})
           </Button>

           <div className="grid grid-cols-2 gap-2">
             <Button 
                onClick={() => { onUndo(); setIsMobileMenuOpen(false); }} 
                disabled={!canUndo || isLoading}
                variant="secondary"
                className="py-2 text-[10px] font-bold uppercase tracking-wide border-gray-700 bg-gray-800"
             >
                ⟲ Quay lại
             </Button>
             <button onClick={() => { onSave(); setIsMobileMenuOpen(false); }} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-700 transition-all">
                Lưu Game
             </button>
           </div>
           
           <button onClick={() => { onLoad(); setIsMobileMenuOpen(false); }} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-700 transition-all">
                Tải Game
           </button>

           <button 
             onClick={() => { toggleCheatMode(); setIsMobileMenuOpen(false); }}
             className={`w-full py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
               isCheatMode 
                 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20' 
                 : 'bg-gray-800/50 text-gray-500 border-gray-800 hover:bg-gray-800 hover:text-gray-400'
             }`}
           >
             {isCheatMode ? '⚠ Cheat: ON' : 'Cheat: OFF'}
           </button>
           
           <button 
             onClick={onRestart}
             className="w-full py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider text-red-500/70 hover:text-red-400 hover:bg-red-900/10 transition-colors"
           >
             Thoát Game
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#0B0F19]">
        {/* Story Text */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-4"> 
             {/* Header */}
             <header className="mb-6 border-b border-gray-800/50 pb-4">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-100 font-serif leading-tight tracking-tight drop-shadow-lg">
                  {segment.title}
                </h1>
             </header>

             <article className="prose-story text-base md:text-lg text-gray-300 leading-relaxed whitespace-pre-line text-justify">
               {segment.content}
             </article>
             
             {segment.isGameOver && (
               <div className="mt-10 p-6 bg-gray-900/80 rounded-xl border border-gray-700 text-center animate-in zoom-in duration-500">
                 <h3 className="text-3xl font-bold text-red-500 mb-2 uppercase">
                   {playerStatus.hp <= 0 ? "BẠN ĐÃ TỬ NẠN" : (playerStatus.sanity <= 0 ? "BẠN ĐÃ HÓA ĐIÊN" : "KẾT THÚC")}
                 </h3>
                 <p className="text-gray-400">
                   {playerStatus.hp <= 0 
                     ? "Sức cùng lực kiệt, hành trình của bạn dừng lại tại đây." 
                     : (playerStatus.sanity <= 0 
                       ? "Tâm trí bạn vỡ vụn, thực tại chỉ còn là những mảnh ghép méo mó." 
                       : "Hành trình đã kết thúc.")}
                 </p>
                 <div className="mt-6 flex justify-center gap-4">
                    <Button onClick={onLoad} variant="secondary">Tải lại bản lưu</Button>
                    <Button onClick={onRestart} variant="danger">Chơi lại từ đầu</Button>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Choice Area - Compact */}
        <div className="border-t border-gray-800 bg-[#0B0F19]/95 backdrop-blur-xl p-3 md:p-4 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
           <div className="max-w-4xl mx-auto">
             {!segment.isGameOver ? (
                <>
                  {isCheatMode ? (
                    <CheatConsole onCheatSubmit={(text) => onChoice(text, true)} isLoading={isLoading} />
                  ) : (
                    <div className="grid grid-cols-1 gap-2"> 
                      {segment.choices.map((choice) => (
                        <Button
                          key={choice.id}
                          onClick={() => handleChoiceClick(choice)}
                          variant="secondary"
                          isLoading={isLoading || (rollingChoiceId === choice.id)}
                          disabled={isLoading || (rollingChoiceId !== null && rollingChoiceId !== choice.id)}
                          className={`w-full justify-between text-left h-auto py-3 px-4 hover:border-indigo-500 hover:bg-gray-800/80 group transition-all duration-200 border-gray-700 bg-gray-900 
                            ${choice.skillCheck ? 'border-yellow-600/30' : ''}`} 
                        >
                          <div className="flex items-center">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-600 group-hover:border-indigo-400 group-hover:bg-indigo-500/10 flex items-center justify-center mr-3 text-xs text-gray-500 group-hover:text-indigo-400 transition-colors">
                                ➤
                              </span>
                              <span className="text-gray-200 group-hover:text-white text-sm font-medium line-clamp-1 md:line-clamp-2">
                                {choice.text}
                              </span>
                          </div>
                          
                          {/* SKILL CHECK BADGE */}
                          {choice.skillCheck && (
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                <div className="text-[10px] text-gray-400 bg-black/40 px-2 py-1 rounded border border-gray-700">
                                   <span className="font-bold text-indigo-300">{choice.skillCheck.stat}</span>
                                   <span className="mx-1">|</span>
                                   <span className={`${getDifficultyColor(choice.skillCheck.difficulty)} font-bold`}>
                                      DC {choice.skillCheck.difficulty} ({getDifficultyLabel(choice.skillCheck.difficulty)})
                                   </span>
                                </div>
                            </div>
                          )}

                          {/* DICE ROLL OVERLAY for this specific button */}
                          {rollingChoiceId === choice.id && (
                             <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-lg z-10 animate-in fade-in zoom-in duration-200">
                                {rollResult ? (
                                    <div className={`text-xl font-bold flex gap-2 items-center ${rollResult.isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                                       <span>{rollResult.isSuccess ? 'SUCCESS' : 'FAILURE'}</span>
                                       <span className="text-sm text-gray-400">({rollResult.roll} + Stat = {rollResult.total})</span>
                                    </div>
                                ) : (
                                    <div className="text-yellow-500 font-mono text-sm animate-pulse">
                                       🎲 ROLLING D20...
                                    </div>
                                )}
                             </div>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-[#0B0F19]/90 flex items-center justify-center backdrop-blur-sm z-50 rounded-t-xl">
                      <div className="flex flex-col items-center">
                         <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                         <p className="text-indigo-400 font-medium text-sm animate-pulse">AI đang tính toán hậu quả...</p>
                      </div>
                    </div>
                  )}
                </>
             ) : (
                <div className="flex gap-2">
                    <Button onClick={onRestart} className="flex-1 py-3 text-sm">Chơi lại</Button>
                    <Button onClick={onLoad} variant="secondary" className="flex-1 py-3 text-sm">Tải bản lưu</Button>
                </div>
             )}
           </div>
        </div>
      </div>

      {/* Notebook Modal */}
      {isNotebookOpen && (
        <NotebookModal notebook={notebook} onClose={() => setIsNotebookOpen(false)} />
      )}
    </div>
  );
};

export default StoryInterface;