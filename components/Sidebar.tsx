import React, { useState } from 'react';
import { CharacterStats, PlayerStatus, NotebookEntry, Quest, StorySegment } from '../types';
import Button from './Button';

interface SidebarProps {
  segment: StorySegment;
  notebook: NotebookEntry[];
  quests: Quest[];
  stats: CharacterStats;
  playerStatus: PlayerStatus;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onOpenNotebook: () => void;
  onUndo: () => void;
  onSave: () => void;
  onLoad: () => void;
  onRestart: () => void;
  toggleCheatMode: () => void;
  isCheatMode: boolean;
  canUndo: boolean;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  segment, notebook, quests, stats, playerStatus,
  isMobileMenuOpen, setIsMobileMenuOpen,
  onOpenNotebook, onUndo, onSave, onLoad, onRestart,
  toggleCheatMode, isCheatMode, canUndo, isLoading
}) => {
  const [sidebarTab, setSidebarTab] = useState<'info' | 'quests'>('info');
  const activeQuests = quests.filter(q => q.status === 'active' || q.status === 'new');
  const completedQuests = quests.filter(q => q.status === 'completed' || q.status === 'failed');

  return (
    <div className={`
      fixed inset-0 bg-gray-950 z-50 md:relative md:inset-auto md:w-80 md:bg-gray-900 md:border-r md:border-gray-800 md:flex md:flex-col md:shrink-0 transition-transform duration-300
      ${isMobileMenuOpen ? 'translate-x-0 flex flex-col' : '-translate-x-full md:translate-x-0 hidden'}
    `}>
      {/* Mobile Close */}
      <div className="md:hidden p-4 border-b border-gray-800 flex justify-end">
        <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">✕ Đóng</button>
      </div>

      {/* Tabs */}
      <div className="p-2 border-b border-gray-800 flex gap-1 bg-gray-900/50">
        <button onClick={() => setSidebarTab('info')} className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${sidebarTab === 'info' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
          Hồ sơ & Túi
        </button>
        <button onClick={() => setSidebarTab('quests')} className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors relative ${sidebarTab === 'quests' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
          Nhiệm vụ
          {activeQuests.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white items-center justify-center">{activeQuests.length}</span>
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {sidebarTab === 'info' ? (
          <>
            {/* Status Bars */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-inner">
              <h2 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-3">Trạng Thái Sinh Tồn</h2>
              
              <div className="mb-3">
                <div className="flex justify-between text-[10px] uppercase mb-1 font-bold">
                  <span className="text-red-400">HP (Sức Khỏe)</span>
                  <span className="text-gray-300">{playerStatus.hp}/{playerStatus.maxHp}</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500 ease-out" style={{ width: `${Math.max(0, (playerStatus.hp / playerStatus.maxHp) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] uppercase mb-1 font-bold">
                  <span className="text-purple-400">Sanity (Tinh Thần)</span>
                  <span className="text-gray-300">{playerStatus.sanity}/{playerStatus.maxSanity}</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-purple-800 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${Math.max(0, (playerStatus.sanity / playerStatus.maxSanity) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
               <h2 className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-gray-700 pb-1 flex justify-between">Chỉ Số (Stats)</h2>
               <div className="space-y-3">
                 {[{k:'STR',l:'Sức Mạnh',v:stats.STR,c:'bg-red-500'},{k:'DEX',l:'Khéo Léo',v:stats.DEX,c:'bg-green-500'},{k:'INT',l:'Trí Tuệ',v:stats.INT,c:'bg-blue-500'},{k:'CHA',l:'Thu Hút',v:stats.CHA,c:'bg-purple-500'},{k:'LCK',l:'May Mắn',v:stats.LCK,c:'bg-yellow-500'}]
                 .map((s)=>(
                   <div key={s.k} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${s.c} bg-opacity-20 flex items-center justify-center border border-${s.c.replace('bg-', '')}/30 text-xs font-bold text-gray-200`}>{s.k}</div>
                      <div className="flex-1">
                         <div className="flex justify-between text-[10px] uppercase text-gray-400 mb-1"><span>{s.l}</span><span className="font-mono font-bold text-gray-200 text-sm">{s.v}</span></div>
                         <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden"><div className={`h-full ${s.c}`} style={{width:`${(s.v/20)*100}%`}}></div></div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Inventory */}
            <div className="mb-4">
              <h2 className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-2">Hành trang</h2>
              {segment.inventory?.length ? (
                 <ul className="space-y-1.5">{segment.inventory.map((i,x)=><li key={x} className="flex items-center gap-2 text-xs text-gray-300 bg-gray-800/40 p-2 rounded"><span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span>{i}</li>)}</ul>
              ) : <p className="text-gray-600 text-xs italic">Túi đồ rỗng</p>}
            </div>
          </>
        ) : (
          <div className="space-y-6">
             {/* Quests */}
             <div>
               <h2 className="text-yellow-500 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>Đang thực hiện</h2>
               {activeQuests.length === 0 ? <p className="text-gray-600 text-xs italic text-center">Chưa có nhiệm vụ.</p> : (
                 <div className="space-y-3">{activeQuests.map(q=>(<div key={q.id} className={`p-3 rounded-lg border ${q.type==='main'?'bg-yellow-900/10 border-yellow-700/50':'bg-gray-800/40 border-gray-700'}`}><div className="flex justify-between items-start mb-1"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${q.type==='main'?'bg-yellow-600 text-black':'bg-gray-600 text-gray-200'}`}>{q.type==='main'?'Chính':'Phụ'}</span>{q.status==='new'&&<span className="text-[9px] text-green-400 font-bold animate-pulse">MỚI</span>}</div><h3 className={`font-bold text-sm mb-1 ${q.type==='main'?'text-yellow-100':'text-gray-200'}`}>{q.name}</h3><p className="text-xs text-gray-400 mb-2">{q.description}</p><div className="bg-black/30 p-2 rounded text-[10px] text-gray-300 border border-gray-700/30"><span className="text-indigo-400 font-bold">Tiến độ: </span>{q.progress}</div></div>))}</div>
               )}
             </div>
             {completedQuests.length > 0 && (
                <div>
                   <h2 className="text-green-600 text-[10px] uppercase tracking-widest font-bold mb-3 pt-4 border-t border-gray-800">Đã Hoàn Thành / Thất Bại</h2>
                   <div className="space-y-2 opacity-70">{completedQuests.map(q=>(<div key={q.id} className="p-2 rounded bg-gray-900 border border-gray-800 flex justify-between items-center"><span className="text-xs text-gray-500 line-through">{q.name}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${q.status==='completed'?'text-green-500 bg-green-900/20':'text-red-500 bg-red-900/20'}`}>{q.status==='completed'?'Xong':'Hủy'}</span></div>))}</div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 space-y-2 shrink-0">
         <Button onClick={()=>{onOpenNotebook();setIsMobileMenuOpen(false)}} variant="primary" className="w-full py-3 mb-2 text-xs font-bold uppercase tracking-wide border-indigo-500 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200">📖 Sổ Tay ({notebook.length})</Button>
         <div className="grid grid-cols-2 gap-2">
           <Button onClick={()=>{onUndo();setIsMobileMenuOpen(false)}} disabled={!canUndo||isLoading} variant="secondary" className="py-2 text-[10px] font-bold uppercase tracking-wide border-gray-700 bg-gray-800">⟲ Quay lại</Button>
           <button onClick={()=>{onSave();setIsMobileMenuOpen(false)}} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-700 transition-all">Lưu Game</button>
         </div>
         <button onClick={()=>{onLoad();setIsMobileMenuOpen(false)}} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-700 transition-all">Tải Game</button>
         <button onClick={()=>{toggleCheatMode();setIsMobileMenuOpen(false)}} className={`w-full py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${isCheatMode?'bg-yellow-500/10 text-yellow-500 border-yellow-500/50':'bg-gray-800/50 text-gray-500 border-gray-800'}`}>{isCheatMode?'⚠ Cheat: ON':'Cheat: OFF'}</button>
         <button onClick={onRestart} className="w-full py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider text-red-500/70 hover:text-red-400 hover:bg-red-900/10 transition-colors">Thoát Game</button>
      </div>
    </div>
  );
};

export default Sidebar;
