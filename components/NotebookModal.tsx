import React, { useState } from 'react';
import { NotebookEntry, NotebookCategory } from '../types';
import Button from './Button';

interface NotebookModalProps {
  notebook: NotebookEntry[];
  onClose: () => void;
}

const CATEGORIES: { id: NotebookCategory | 'all', label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'character', label: 'Nhân vật' },
  { id: 'enemy', label: 'Kẻ thù' },
  { id: 'creature', label: 'Sinh vật' },
  { id: 'faction', label: 'Phe phái' },
  { id: 'item', label: 'Vật phẩm' },
  { id: 'location', label: 'Địa điểm' },
];

const NotebookModal: React.FC<NotebookModalProps> = ({ notebook, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<NotebookCategory | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(null);

  const filteredNotebook = notebook.filter(entry => 
    activeCategory === 'all' ? true : entry.category === activeCategory
  );

  const getAffinityColor = (val: number) => {
    if (val >= 80) return 'text-green-400';
    if (val >= 60) return 'text-blue-400';
    if (val >= 40) return 'text-gray-400';
    if (val >= 20) return 'text-orange-400';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="bg-gray-900 border border-indigo-500/30 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Sổ Tay Hành Trình
            </h2>
            <p className="text-sm text-gray-500">Lưu trữ tri thức về thế giới</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left: List & Filters */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/30">
            {/* Tabs */}
            <div className="p-2 flex flex-wrap gap-1 border-b border-gray-800 bg-gray-900/50">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSelectedEntry(null); }}
                  className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredNotebook.length === 0 ? (
                <div className="text-center p-8 text-gray-600 text-sm italic">
                  Chưa có thông tin nào trong mục này.
                </div>
              ) : (
                filteredNotebook.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all ${
                      selectedEntry?.id === entry.id
                        ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                        : 'bg-gray-800/40 border-transparent hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-200">{entry.name}</h4>
                      {entry.category === 'character' && (
                        <span className={`text-xs font-bold ${getAffinityColor(entry.affinity)}`}>
                          {entry.affinity}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{entry.relationship}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Detail View */}
          <div className="hidden md:flex flex-1 bg-[#0B0F19] p-8 flex-col overflow-y-auto custom-scrollbar">
            {selectedEntry ? (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded">
                       {CATEGORIES.find(c => c.id === selectedEntry.category)?.label}
                    </span>
                    <h1 className="text-4xl font-bold text-white mt-3 font-serif">{selectedEntry.name}</h1>
                    <p className="text-gray-400 mt-1 italic">{selectedEntry.relationship}</p>
                  </div>
                  {(selectedEntry.category === 'character' || selectedEntry.category === 'faction') && (
                    <div className="text-right">
                       <div className="text-xs text-gray-500 uppercase mb-1">Hảo Cảm</div>
                       <div className={`text-3xl font-bold ${getAffinityColor(selectedEntry.affinity)}`}>
                         {selectedEntry.affinity}
                         <span className="text-sm text-gray-600">/100</span>
                       </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <section>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Mô Tả</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">{selectedEntry.description}</p>
                  </section>

                  {selectedEntry.goals && (
                    <section className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
                      <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Mục Tiêu / Mong Muốn</h3>
                      <p className="text-indigo-100">{selectedEntry.goals}</p>
                    </section>
                  )}

                  {selectedEntry.keyMemories && selectedEntry.keyMemories.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Ký Ức Cốt Lõi (Lore)</h3>
                      <ul className="space-y-3">
                        {selectedEntry.keyMemories.map((mem, idx) => (
                          <li key={idx} className="flex gap-3 text-gray-300 bg-gray-900 border border-gray-800 p-3 rounded-lg">
                            <span className="text-indigo-500 mt-1">✦</span>
                            <span>{mem}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  
                  <div className="pt-4 text-xs text-gray-600 text-right italic">
                     Cập nhật lần cuối: Chương "{selectedEntry.lastUpdatedChapter}"
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>Chọn một mục bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end">
           <Button onClick={onClose} variant="secondary">Đóng Sổ Tay</Button>
        </div>
      </div>
    </div>
  );
};

export default NotebookModal;
