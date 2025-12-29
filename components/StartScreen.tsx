import React, { useState } from 'react';
import Button from './Button';
import { CharacterProfile } from '../types';

interface StartScreenProps {
  onStart: (profile: CharacterProfile, apiKey: string | null) => void;
  isLoading: boolean;
}

const PRESET_GENRES = [
  "Khoa học viễn tưởng (Cyberpunk)",
  "Giả tưởng (Dark Fantasy)",
  "Kinh dị sinh tồn (Zombie Apocalypse)",
  "Trinh thám (Noir)",
  "Kiếm hiệp / Tiên hiệp (Wuxia/Xianxia)",
  "Hậu tận thế (Post-Apocalyptic)",
  "Lịch sử giả tưởng (Alternative History)"
];

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'settings'>('create');
  
  // Profile State
  const [profile, setProfile] = useState<CharacterProfile>({
    name: "",
    personality: "",
    appearance: "",
    companion: "",
    genre: PRESET_GENRES[0],
    customSetting: ""
  });

  // Settings State
  const [apiKey, setApiKey] = useState("");

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(profile, apiKey || null);
  };

  const handleInputChange = (field: keyof CharacterProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Export Template
  const exportTemplate = () => {
    if (!profile.name && !profile.customSetting) {
       alert("Hãy nhập ít nhất tên hoặc mô tả để lưu mẫu.");
       return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const fileName = `template_${profile.name || 'unnamed'}_${Date.now()}.json`;
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Import Template
  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsedData = JSON.parse(e.target.result as string) as CharacterProfile;
            // Basic check
            if (typeof parsedData.name === 'string' && typeof parsedData.genre === 'string') {
               setProfile({
                   ...profile, // keep defaults if missing
                   ...parsedData
               });
               alert("Đã nhập mẫu nhân vật thành công!");
            } else {
               throw new Error("Invalid format");
            }
          } catch (err) {
            alert("File mẫu không hợp lệ.");
          }
        }
      };
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-[90vh] justify-center fade-in">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 tracking-tighter">
          Infinite Chronicles
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-light">
          Kiến tạo vận mệnh của bạn trong thế giới vô tận.
        </p>
      </div>

      <div className="w-full bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'create' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Tạo Nhân Vật Mới
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Cài Đặt / API Key
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'create' ? (
            <form onSubmit={handleStart} className="space-y-6">
              
              {/* Template Controls */}
              <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                 <div className="text-xs text-gray-400">Bạn có file mẫu nhân vật cũ?</div>
                 <div className="flex gap-2">
                    <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-xs font-bold border border-gray-600 transition-colors">
                       📂 Nhập Mẫu
                       <input type="file" accept=".json" className="hidden" onChange={importTemplate} />
                    </label>
                    <button type="button" onClick={exportTemplate} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-xs font-bold border border-gray-600 transition-colors">
                       💾 Xuất Mẫu
                    </button>
                 </div>
              </div>

              {/* Genre Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">1. Chọn Thể Loại</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleInputChange('genre', g)}
                      className={`p-3 rounded-lg text-left text-xs md:text-sm transition-all border ${
                        profile.genre === g 
                          ? 'bg-indigo-900/40 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Character Details (Optional) */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">2. Hồ sơ nhân vật (Không bắt buộc)</label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tên nhân vật</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Bạn đồng hành</label>
                    <input 
                      type="text" 
                      value={profile.companion}
                      onChange={(e) => handleInputChange('companion', e.target.value)}
                      placeholder="VD: Chú chó robot, Thanh kiếm biết nói..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Ngoại hình</label>
                    <input 
                      type="text" 
                      value={profile.appearance}
                      onChange={(e) => handleInputChange('appearance', e.target.value)}
                      placeholder="VD: Cao, tóc bạc, mắt đỏ, mặc áo choàng đen..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Tính cách</label>
                    <input 
                      type="text" 
                      value={profile.personality}
                      onChange={(e) => handleInputChange('personality', e.target.value)}
                      placeholder="VD: Lạnh lùng, thông minh nhưng lười biếng, nghĩa hiệp..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* World Setting */}
              <div className="space-y-2 pt-4 border-t border-gray-800">
                <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">3. Thiết lập thế giới bổ sung</label>
                <textarea
                  value={profile.customSetting}
                  onChange={(e) => handleInputChange('customSetting', e.target.value)}
                  placeholder="Mô tả thêm về thế giới bạn muốn chơi (VD: Thế giới không có mặt trời, con người sống dưới lòng đất...)"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none min-h-[80px]"
                />
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full text-lg h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-0">
                BẮT ĐẦU HÀNH TRÌNH
              </Button>
            </form>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Cấu hình API Key</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Ứng dụng sử dụng Google Gemini API. Nếu bạn có Key riêng (để tăng giới hạn rate limit hoặc dùng bản trả phí), hãy nhập vào đây. Nếu không, hệ thống sẽ dùng Key mặc định (nếu có).
                </p>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Nhập Google Gemini API Key của bạn (bắt đầu bằng AIza...)"
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-sm"
                  />
                  {apiKey && (
                    <div className="absolute right-3 top-3.5 text-green-500 flex items-center gap-1 text-xs bg-green-900/20 px-2 py-1 rounded">
                      <span>✓</span> Đã nhập
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Lấy API Key tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>
                </p>
              </div>
              
              <div className="p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-lg">
                <h4 className="text-yellow-500 font-bold text-sm mb-1">Lưu ý</h4>
                <p className="text-xs text-yellow-200/70">
                  Key của bạn chỉ được lưu tạm thời trong phiên làm việc này hoặc khi bạn nhấn Save Game. Chúng tôi không lưu trữ key của bạn trên server.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => setActiveTab('create')} variant="secondary">
                  Quay lại tạo nhân vật
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
