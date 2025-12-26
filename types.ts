
export interface ScriptSegment {
  time: string;
  visual: string;
  dialogue: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface ProductScript {
  title: string;
  description: string;
  visualSpecs: string; 
  segments: ScriptSegment[];
  keyHighlights: string[];
  sources: { title: string; uri: string }[];
}

export interface SavedScript {
  id: string;
  timestamp: number;
  params: GenerateParams;
  script: ProductScript;
}

export enum Tone {
  Professional = 'ทางการและน่าเชื่อถือ',
  Casual = 'เป็นกันเอง สนุกสนาน',
  Hype = 'ตื่นเต้น เร้าใจ (สายรีวิวจัดเต็ม)',
  Minimal = 'เรียบหรู ดูแพง'
}

export type VoiceName = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';

export interface VoiceOption {
  id: VoiceName;
  label: string;
  description: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'Zephyr', label: 'Zephyr (แนะนำ)', description: 'เสียงที่สมดุลและเป็นธรรมชาติที่สุด เหมาะกับทุกงาน' },
  { id: 'Kore', label: 'Kore', description: 'เสียงสดใส กระตือรือร้น เหมาะกับสายรีวิวสนุกๆ' },
  { id: 'Puck', label: 'Puck', description: 'เสียงเป็นกันเอง ดูเข้าถึงง่าย' },
  { id: 'Charon', label: 'Charon', description: 'เสียงทุ้มลึก น่าเชื่อถือ' },
  { id: 'Fenrir', label: 'Fenrir', description: 'เสียงหนักแน่น มีพลัง' },
];

export interface MusicMood {
  id: string;
  label: string;
  url: string;
  icon: string;
}

export const AVAILABLE_MUSIC: MusicMood[] = [
  { id: 'none', label: 'ไม่มีดนตรี', url: '', icon: '🔇' },
  { id: 'song1', label: 'Song 1 (Chill)', url: '/music/Song1.mp3', icon: '🌿' },
  { id: 'song2', label: 'Song 2 (Luxury)', url: '/music/Song2.mp3', icon: '💎' },
  { id: 'song3', label: 'Song 3 (Upbeat)', url: '/music/Song3.mp3', icon: '⚡' },
  { id: 'song4', label: 'Song 4 (Epic)', url: '/music/Song4.mp3', icon: '🎬' },
  { id: 'song5', label: 'Song 5 (Happy)', url: '/music/Song5.mp3', icon: '🌟' },
];

export interface GenerateParams {
  url: string;
  durationSeconds: number;
  tone: Tone;
  productImage?: string; // Base64 string of the uploaded product image
}
