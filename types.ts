export interface CharacterStats {
  STR: number; // Sức mạnh
  DEX: number; // Khéo léo
  INT: number; // Trí tuệ
  CHA: number; // Thu hút
  LCK: number; // May mắn
}

export interface PlayerStatus {
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
}

export interface StatusChange {
  hp?: number; // Delta (e.g. -10, +5)
  sanity?: number; // Delta
}

export interface SkillCheck {
  stat: keyof CharacterStats;
  difficulty: number; // DC (Difficulty Class): 10 (Easy), 15 (Medium), 20 (Hard), 25 (Impossible)
}

export interface StoryChoice {
  id: string;
  text: string;
  tone?: 'aggressive' | 'diplomatic' | 'stealthy' | 'neutral';
  skillCheck?: SkillCheck; // Optional: If present, this choice requires a dice roll
}

export type NotebookCategory = 'character' | 'enemy' | 'creature' | 'item' | 'location' | 'faction';

export interface NotebookEntry {
  id: string; // Unique ID (e.g., char_alice)
  name: string;
  category: NotebookCategory;
  description: string; // General description
  affinity: number; // 0-100 (For characters/factions)
  relationship: string; // e.g., "Vợ", "Kẻ thù truyền kiếp", "Bạn xã giao"
  keyMemories: string[]; // List of specific events defining the relationship (e.g., "Saved MC in Chapter 1")
  goals: string; // What this entity wants from or with the MC
  lastUpdatedChapter: string; // To track recency
  
  // New Smart Context Fields
  currentLocation?: string; // Where is this entity right now?
  status?: 'active' | 'dead' | 'missing' | 'unknown' | 'companion'; // Current state
  tags?: string[]; // Keywords for search linking
  isCore?: boolean; // If true, always include in context (e.g., Main Companion)
}

export type QuestType = 'main' | 'side';
export type QuestStatus = 'new' | 'active' | 'completed' | 'failed';

export interface Quest {
  id: string;
  name: string;
  type: QuestType;
  description: string; // Short description of the objective
  status: QuestStatus;
  progress: string; // Narrative progress e.g. "Found 1/3 clues"
}

export interface StorySegment {
  title: string;
  content: string; 
  currentLocation: string; // The location name where this segment takes place
  choices: StoryChoice[];
  inventory: string[];
  status: string; // Narrative status (deprecated visually, keep for logic if needed)
  isGameOver: boolean;
  notebookUpdates?: NotebookEntry[]; 
  questUpdates?: Quest[]; 
  statsUpdate?: Partial<CharacterStats>; 
  statusChanges?: StatusChange; // Changes to HP/Sanity in this segment
}

export interface CharacterProfile {
  name: string;
  personality: string;
  appearance: string;
  companion: string;
  genre: string;
  customSetting: string;
}

export interface GameState {
  history: StorySegment[];
  characterProfile: CharacterProfile;
  summary: string;
  notebook: NotebookEntry[]; 
  quests: Quest[]; 
  stats: CharacterStats; 
  playerStatus: PlayerStatus; // HP & Sanity
  currentLocation: string; 
  isCheatMode: boolean;
  isLoading: boolean;
  error: string | null;
  userApiKey: string | null;
}

export type ActionType = 'normal' | 'cheat';
