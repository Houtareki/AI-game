import React, { useState } from 'react';
import Button from './Button';

interface CheatConsoleProps {
  onCheatSubmit: (input: string) => void;
  isLoading: boolean;
}

const CheatConsole: React.FC<CheatConsoleProps> = ({ onCheatSubmit, isLoading }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCheatSubmit(input);
      setInput("");
    }
  };

  return (
    <div className="mt-6 border-2 border-yellow-500/30 bg-yellow-900/10 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 mb-2 text-yellow-500 font-mono text-sm uppercase tracking-widest font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        GOD MODE CONSOLE
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập lệnh can thiệp thực tại (VD: Triệu hồi rồng, Bất tử...)"
          className="flex-1 bg-black/50 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-100 placeholder-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono"
        />
        <Button 
          type="submit" 
          variant="cheat" 
          isLoading={isLoading}
          disabled={!input.trim()}
          className="whitespace-nowrap"
        >
          Kích hoạt
        </Button>
      </form>
    </div>
  );
};

export default CheatConsole;