import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import Button from './Button';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
  gameState?: GameState; // Required for save/export
  onLoadGame: (data: GameState) => void;
}

interface SaveSlotData {
  id: number;
  timestamp: number;
  summary: string;
  charName: string;
  chapterTitle: string;
  isEmpty: boolean;
}

const SLOT_PREFIX = 'infinite_chronicles_slot_';

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ mode, onClose, gameState, onLoadGame }) => {
  const [slots, setSlots] = useState<SaveSlotData[]>([]);
  const [activeTab, setActiveTab] = useState<'slots' | 'file'>('slots');

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = () => {
    const loadedSlots: SaveSlotData[] = [];
    for (let i = 1; i <= 3; i++) {
      const savedStr = localStorage.getItem(`${SLOT_PREFIX}${i}`);
      if (savedStr) {
        try {
          const data = JSON.parse(savedStr) as GameState;
          const lastSegment = data.history[data.history.length - 1];
          loadedSlots.push({
            id: i,
            timestamp: Date.now(), // In real app, store timestamp in GameState
            summary: data.summary ? (data.summary.substring(0, 60) + '...') : 'Chưa có tóm tắt',
            charName: data.characterProfile.name || 'Vô danh',
            chapterTitle: lastSegment?.title || 'Khởi đầu',
            isEmpty: false
          });
        } catch (e) {
          loadedSlots.push({ id: i, timestamp: 0, summary: '', charName: '', chapterTitle: '', isEmpty: true });
        }
      } else {
        loadedSlots.push({ id: i, timestamp: 0, summary: '', charName: '', chapterTitle: '', isEmpty: true });
      }
    }
    setSlots(loadedSlots);
  };

  const handleSlotAction = (slotId: number) => {
    if (mode === 'save' && gameState) {
      if (localStorage.getItem(`${SLOT_PREFIX}${slotId}`)) {
        if (!window.confirm(`Ghi đè lên Slot ${slotId}?`)) return;
      }
      localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(gameState));
      loadSlots(); 
      alert(`Đã lưu vào Slot ${slotId}`);
    } else if (mode === 'load') {
      const savedStr = localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
      if (savedStr) {
        try {
            if (window.confirm(`Tải game từ Slot ${slotId}? Tiến trình hiện tại sẽ mất.`)) {
                const data = JSON.parse(savedStr);
                onLoadGame(data);
                onClose();
            }
        } catch (e) {
            alert("File lưu bị lỗi.");
        }
      }
    }
  };

  const handleDeleteSlot = (e: React.MouseEvent, slotId: number) => {
    e.stopPropagation();
    if (window.confirm(`Xóa dữ liệu Slot ${slotId}?`)) {
      localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
      loadSlots();
    }
  };

  const handleExport = () => {
    if (!gameState) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const fileName = `infinite_chronicles_${gameState.characterProfile.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsedData = JSON.parse(e.target.result as string);
            // Basic validation
            if (!parsedData.history || !parsedData.characterProfile) {
                throw new Error("Invalid format");
            }
            if (window.confirm("Bạn có chắc muốn nhập file save này? Game hiện tại sẽ bị thay thế.")) {
                onLoadGame(parsedData);
                onClose();
            }
          } catch (err) {
            alert("File không hợp lệ hoặc bị lỗi.");
          }
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {mode === 'save' ? 'Lưu Game' : 'Tải Game'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex border-b border-gray-800">
           <button 
             onClick={() => setActiveTab('slots')}
             className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'slots' ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Slot Lưu Trữ
           </button>
           <button 
             onClick={() => setActiveTab('file')}
             className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'file' ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
           >
             File (Import/Export)
           </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'slots' ? (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div 
                  key={slot.id}
                  onClick={() => !slot.isEmpty || mode === 'save' ? handleSlotAction(slot.id) : null}
                  className={`relative p-4 rounded-lg border flex justify-between items-center transition-all group ${
                    slot.isEmpty 
                      ? (mode === 'save' ? 'bg-gray-800/30 border-gray-700 border-dashed cursor-pointer hover:bg-gray-800 hover:border-indigo-500' : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed')
                      : 'bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 hover:border-indigo-500 shadow-lg'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-indigo-500 uppercase mb-1">Slot {slot.id}</span>
                    {slot.isEmpty ? (
                      <span className="text-gray-500 italic">Trống</span>
                    ) : (
                      <>
                        <span className="text-white font-bold text-lg">{slot.charName}</span>
                        <span className="text-indigo-300 text-sm">{slot.chapterTitle}</span>
                      </>
                    )}
                  </div>
                  
                  {!slot.isEmpty && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 hidden sm:block max-w-[150px] truncate">{slot.summary}</span>
                        {mode === 'save' && (
                             <button 
                                onClick={(e) => handleDeleteSlot(e, slot.id)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded z-10"
                                title="Xóa slot"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                        )}
                    </div>
                  )}
                  {slot.isEmpty && mode === 'save' && (
                      <span className="text-gray-500 text-sm group-hover:text-indigo-400">Nhấn để lưu mới</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6 items-center justify-center h-full">
               <div className="w-full bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center">
                  <h3 className="text-white font-bold mb-2">Sao lưu dữ liệu (Export)</h3>
                  <p className="text-gray-400 text-sm mb-4">Tải toàn bộ tiến trình game hiện tại về máy tính dưới dạng file .JSON an toàn.</p>
                  <Button onClick={handleExport} disabled={!gameState && mode === 'save'} className="w-full">
                     ⬇ Tải file Save về máy
                  </Button>
               </div>

               <div className="w-full bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center">
                  <h3 className="text-white font-bold mb-2">Khôi phục dữ liệu (Import)</h3>
                  <p className="text-gray-400 text-sm mb-4">Tải lên file .JSON save game từ máy tính để tiếp tục chơi.</p>
                  <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <p className="text-sm text-gray-400"><span className="font-semibold">Nhấn để chọn file</span></p>
                      </div>
                      <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal;
