import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StorySegment, CharacterProfile, NotebookEntry, Quest, CharacterStats, PlayerStatus } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview'; 

const getAiInstance = (userKey: string | null) => {
  const apiKey = userKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide one in settings.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- SCHEMAS ---

const notebookEntrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['character', 'enemy', 'creature', 'item', 'location', 'faction'] },
    description: { type: Type.STRING },
    affinity: { type: Type.INTEGER },
    relationship: { type: Type.STRING },
    keyMemories: { type: Type.ARRAY, items: { type: Type.STRING } },
    goals: { type: Type.STRING },
    lastUpdatedChapter: { type: Type.STRING },
    currentLocation: { type: Type.STRING },
    status: { type: Type.STRING, enum: ['active', 'dead', 'missing', 'unknown', 'companion'] },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    isCore: { type: Type.BOOLEAN }
  },
  required: ["id", "name", "category", "description", "affinity", "relationship", "keyMemories", "goals"]
};

const questSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['main', 'side'] },
    description: { type: Type.STRING },
    status: { type: Type.STRING, enum: ['new', 'active', 'completed', 'failed'] },
    progress: { type: Type.STRING }
  },
  required: ["id", "name", "type", "description", "status", "progress"]
};

const statsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    STR: { type: Type.INTEGER },
    DEX: { type: Type.INTEGER },
    INT: { type: Type.INTEGER },
    CHA: { type: Type.INTEGER },
    LCK: { type: Type.INTEGER },
  },
};

const statusChangeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hp: { type: Type.INTEGER, description: "Thay đổi HP (Ví dụ: -15 là bị thương, +10 là hồi phục). Trả về 0 nếu không đổi." },
    sanity: { type: Type.INTEGER, description: "Thay đổi Sanity (Ví dụ: -10 là gặp ma/hoảng loạn, +5 là trấn tĩnh). Trả về 0 nếu không đổi." }
  },
  required: []
};

const skillCheckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    stat: { type: Type.STRING, enum: ['STR', 'DEX', 'INT', 'CHA', 'LCK'] },
    difficulty: { type: Type.INTEGER }
  },
  required: ["stat", "difficulty"]
};

const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING },
    currentLocation: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          tone: { type: Type.STRING, enum: ['aggressive', 'diplomatic', 'stealthy', 'neutral'] },
          skillCheck: { ...skillCheckSchema }
        },
        required: ["id", "text"]
      }
    },
    inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
    status: { type: Type.STRING },
    isGameOver: { type: Type.BOOLEAN },
    notebookUpdates: { type: Type.ARRAY, items: notebookEntrySchema },
    questUpdates: { type: Type.ARRAY, items: questSchema },
    statsUpdate: { ...statsSchema },
    statusChanges: { ...statusChangeSchema, description: "Cập nhật thay đổi Máu (HP) và Tinh thần (Sanity) dựa trên sự kiện chương này." }
  },
  required: ["title", "content", "currentLocation", "choices", "inventory", "status", "isGameOver"]
};

// --- SMART CONTEXT FILTERING ---

const getRelevantNotebookEntries = (
  allEntries: NotebookEntry[], 
  playerLocation: string,
  activeQuests: Quest[],
  recentHistoryText: string
): NotebookEntry[] => {
  if (!allEntries || allEntries.length === 0) return [];

  const recentTextLower = recentHistoryText.toLowerCase();
  
  return allEntries.filter(entry => {
    if (entry.isCore || entry.status === 'companion') return true;
    if (entry.currentLocation && playerLocation && 
        entry.currentLocation.toLowerCase() === playerLocation.toLowerCase()) {
      return true;
    }
    if (recentTextLower.includes(entry.name.toLowerCase())) return true;
    const isRelatedToQuest = activeQuests.some(q => 
      q.description.toLowerCase().includes(entry.name.toLowerCase()) ||
      (entry.tags && entry.tags.some(tag => q.description.toLowerCase().includes(tag.toLowerCase())))
    );
    if (isRelatedToQuest) return true;
    return false;
  });
};

// --- PROMPT BUILDERS ---

const buildCoreMemoryPrompt = (profile: CharacterProfile) => {
  let memory = `THÔNG TIN CỐT LÕI:\n`;
  memory += `- Thể loại: ${profile.genre}\n`;
  memory += `- Bối cảnh: ${profile.customSetting || "Tùy ý sáng tạo"}\n`;
  if (profile.name) memory += `- Tên nhân vật: ${profile.name}\n`;
  if (profile.personality) memory += `- Tính cách: ${profile.personality}\n`;
  
  return memory;
};

const buildStatsContext = (stats: CharacterStats) => {
  return `CHỈ SỐ RPG: STR:${stats.STR}, DEX:${stats.DEX}, INT:${stats.INT}, CHA:${stats.CHA}, LCK:${stats.LCK}`;
};

const buildPlayerStatusContext = (status: PlayerStatus) => {
  let ctx = `TRẠNG THÁI SINH TỒN HIỆN TẠI:\n`;
  ctx += `- HP (Máu): ${status.hp}/${status.maxHp}\n`;
  ctx += `- Sanity (Tinh thần): ${status.sanity}/${status.maxSanity}\n`;

  // Dynamic Instructions based on status
  if (status.hp <= 30) {
    ctx += `!!! CẢNH BÁO HP THẤP !!! Nhân vật đang bị thương nặng, đau đớn, kiệt sức. Hãy mô tả văn phong ngắt quãng, khó khăn, nhìn mờ, thở dốc.\n`;
  }
  if (status.sanity <= 30) {
    ctx += `!!! CẢNH BÁO TINH THẦN THẤP !!! Nhân vật đang hoảng loạn, hoang tưởng. Hãy mô tả văn phong điên rồ, nhìn thấy ảo giác kinh dị, suy nghĩ méo mó.\n`;
  }
  
  ctx += `HÃY TÍNH TOÁN HP/SANITY LOGIC: Nếu bị tấn công -> Trừ HP (statusChanges.hp âm). Nếu gặp sự kiện kinh dị/sốc -> Trừ Sanity (statusChanges.sanity âm).\n`;
  
  return ctx;
};

const buildQuestContext = (quests: Quest[]) => {
  const activeQuests = quests.filter(q => q.status === 'active' || q.status === 'new');
  if (!activeQuests.length) return "";
  return "NHIỆM VỤ ĐANG LÀM:\n" + activeQuests.map(q => `- ${q.name}: ${q.progress}`).join("\n");
};

const buildNotebookContext = (notebook: NotebookEntry[], isFiltered: boolean) => {
  if (!notebook.length) return "";
  let header = isFiltered 
    ? "SỔ TAY (ĐÃ LỌC CÁC MỤC LIÊN QUAN ĐẾN NGỮ CẢNH/VỊ TRÍ HIỆN TẠI):" 
    : "SỔ TAY:";
    
  return `${header}\n` + notebook.map(e => {
    let line = `- ${e.name} [${e.category.toUpperCase()}]`;
    if (e.currentLocation) line += ` @ ${e.currentLocation}`;
    if (e.status) line += ` (${e.status})`;
    line += `: ${e.relationship} (Hảo cảm ${e.affinity}). ${e.description}`;
    return line;
  }).join("\n");
};


// --- API FUNCTIONS ---

export const generateStorySummary = async (
  currentSummary: string,
  recentSegments: StorySegment[],
  isGrandSummary: boolean,
  apiKey: string | null
): Promise<string> => {
  const ai = getAiInstance(apiKey);
  const recentContent = recentSegments.map(s => `Chương: ${s.title}\n${s.content}`).join("\n\n");
  
  const prompt = isGrandSummary 
    ? `Tổng hợp toàn bộ cốt truyện dựa trên tóm tắt cũ: "${currentSummary}" và nội dung mới:\n${recentContent}`
    : `Cập nhật tóm tắt ngắn dựa trên: "${currentSummary}" và diễn biến mới:\n${recentContent}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "text/plain" },
    });
    return response.text || currentSummary;
  } catch (e) {
    return currentSummary; 
  }
};


export const startNewGame = async (profile: CharacterProfile, apiKey: string | null): Promise<StorySegment> => {
  const ai = getAiInstance(apiKey);
  const coreMemory = buildCoreMemoryPrompt(profile);
  
  const prompt = `
    ${coreMemory}
    
    YÊU CẦU KHỞI TẠO GAME RPG SINH TỒN:
    1. Viết CHƯƠNG 1 (MỞ ĐẦU) khoảng 800-1000 từ. Hãy viết thật cuốn hút.
    2. Xác định rõ 'currentLocation'.
    3. KHỞI TẠO CHỈ SỐ RPG (statsUpdate).
    4. Trạng thái sinh tồn mặc định là HP 100/100, Sanity 100/100.
    5. KHỞI TẠO NHIỆM VỤ: Ít nhất 1 Main Quest.
    6. Ngôn ngữ: TIẾNG VIỆT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
        systemInstruction: "Bạn là Game Master RPG. Quản lý cốt truyện, chỉ số nhân vật, và trạng thái sinh tồn (Máu/Tinh thần).",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as StorySegment;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const continueStory = async (
  previousSegments: StorySegment[], 
  choiceTextOrOutcome: string,
  isCheat: boolean,
  profile: CharacterProfile,
  currentSummary: string,
  fullNotebook: NotebookEntry[], 
  currentQuests: Quest[],
  currentStats: CharacterStats,
  playerStatus: PlayerStatus, 
  playerLocation: string,
  apiKey: string | null
): Promise<StorySegment> => {
  
  const ai = getAiInstance(apiKey);
  const coreMemory = buildCoreMemoryPrompt(profile);
  const statsContext = buildStatsContext(currentStats);
  const statusContext = buildPlayerStatusContext(playerStatus); // NEW
  const questContext = buildQuestContext(currentQuests);

  const lastSegment = previousSegments[previousSegments.length - 1];
  const recentHistoryText = previousSegments.slice(-2).map(s => s.content).join(" ");

  const relevantNotebook = getRelevantNotebookEntries(fullNotebook, playerLocation, currentQuests, recentHistoryText);
  const notebookContext = buildNotebookContext(relevantNotebook, true);

  let actionPrompt = "";
  if (isCheat) {
    actionPrompt = `CHEAT MODE: "${choiceTextOrOutcome}".`;
  } else {
    actionPrompt = `HÀNH ĐỘNG: "${choiceTextOrOutcome}".`;
  }

  const fullPrompt = `
    ${coreMemory}
    ${statsContext}
    ${statusContext} 
    VỊ TRÍ HIỆN TẠI: ${playerLocation || "Chưa xác định"}
    
    ${questContext}
    ${notebookContext}
    
    TÓM TẮT: ${currentSummary}
    
    CHƯƠNG TRƯỚC:
    ${lastSegment.content}
    
    ${actionPrompt}

    YÊU CẦU:
    1. Viết tiếp câu chuyện (800-1200 từ).
    2. QUAN TRỌNG: Cập nhật 'statusChanges' (hp, sanity) nếu nhân vật bị thương hoặc hồi phục.
    3. Cập nhật vị trí và sổ tay nếu cần.
    4. Nếu HP < 30 hoặc Sanity < 30, văn phong phải thay đổi để phản ánh sự đau đớn/điên loạn.
    5. Ngôn ngữ: TIẾNG VIỆT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as StorySegment;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
