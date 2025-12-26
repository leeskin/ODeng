
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GenerateParams, ProductScript, VoiceName } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * วิเคราะห์สินค้าและสกัด Visual DNA
 * หากผู้ใช้อัปโหลดรูปภาพ จะใช้รูปนั้นเป็น Hero Image หลัก
 */
export const analyzeProductWithVisual = async (params: GenerateParams): Promise<{ script: ProductScript, heroImageBase64?: string }> => {
  const { url, durationSeconds, tone, productImage } = params;
  
  const prompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์สินค้าและ Content Creator ระดับพรีเมียม
วิเคราะห์สินค้าจากลิงก์: ${url}

เป้าหมาย:
1. หากมีรูปภาพแนบมา (Hero Image) ให้ใช้รูปนั้นวิเคราะห์ลักษณะทางกายภาพอย่างละเอียด (Visual DNA)
2. หากไม่มีรูปภาพแนบมา ให้ค้นหารูปภาพที่แสดงถึงสินค้าชิ้นนี้ได้ชัดเจนที่สุด (Hero Image URL)
3. สกัดรายละเอียด: สี, วัสดุ, ทรง, แบรนด์, ตำแหน่งโลโก้, พื้นผิว
4. สร้างสคริปต์วิดีโอ 9:16 ความยาว ${durationSeconds} วินาที โทน ${tone} โดยแต่ละฉากต้องเน้นความสวยงามของตัวสินค้า

ให้ผลลัพธ์เป็น JSON เท่านั้น:
{
  "title": "ชื่อคลิปสั้นที่ดึงดูดใจ",
  "description": "สรุปสินค้าใน 1 ประโยคหรู",
  "visualSpecs": "Detailed English physical description (color, material, shape, branding) for image consistency",
  "heroImageUrl": "Direct URL of a representative product image (if no image was provided)",
  "segments": [
    {
      "time": "ช่วงเวลา (เช่น 0:00-0:05)",
      "visual": "คำอธิบายสิ่งที่เกิดขึ้นในภาพ (Cinematic Visual)",
      "dialogue": "บทพูดภาษาไทยที่กระชับและตรงโทน",
      "imagePrompt": "Detailed English image generation prompt focusing on product details, lighting, and cinematic environment"
    }
  ],
  "keyHighlights": ["จุดเด่นที่ 1", "จุดเด่นที่ 2", "จุดเด่นที่ 3"]
}`;

  const contentParts: any[] = [{ text: prompt }];
  
  // ส่งรูปภาพที่ผู้ใช้อัปโหลดให้ AI วิเคราะห์ด้วย
  if (productImage) {
    const cleanBase64 = productImage.split(';base64,').pop() || "";
    const mimeType = productImage.split(';')[0].split(':')[1] || "image/png";
    if (cleanBase64.length > 100) {
      contentParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: contentParts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(response.text.trim());
  
  // ใช้รูปที่ผู้ใช้อัปโหลดเป็นลำดับแรก
  let finalHeroImage = productImage || "";

  // หากไม่มีรูปที่อัปโหลด และ AI หา URL มาให้ ให้พยายามดึงรูปนั้น
  if (!finalHeroImage && data.heroImageUrl) {
     try {
       const res = await fetch(data.heroImageUrl, { mode: 'no-cors' }).catch(() => null);
       // Note: fetch with no-cors cannot access body, so this might fail in browser due to security.
       // In a real app, a proxy would be used. We'll rely on search grounding to at least get the URL.
     } catch (e) {
       console.warn("Cross-origin image fetch restricted.");
     }
  }

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Verified Data',
    uri: chunk.web?.uri || ''
  })).filter((s: any) => s.uri) || [];

  return { 
    script: { ...data, sources },
    heroImageBase64: finalHeroImage || undefined
  };
};

/**
 * สร้างภาพแบบ Image-to-Image (Product-in-Context)
 */
export const generateContextualImage = async (prompt: string, visualSpecs: string, base64DataUrl?: string): Promise<string> => {
  let imagePart: any = null;
  
  if (base64DataUrl && base64DataUrl.includes('base64,')) {
    const dataPart = base64DataUrl.split('base64,')[1].trim();
    const mimeType = base64DataUrl.split(';')[0].split(':')[1] || "image/png";
    
    if (dataPart.length > 50) {
      imagePart = {
        inlineData: {
          data: dataPart,
          mimeType: mimeType
        }
      };
    }
  }

  const masterPrompt = `Vertical 9:16 high-end commercial product photography.
PRODUCT DESCRIPTION: ${visualSpecs}.
SCENE CONTEXT: ${prompt}.
TASK: Take the product from the provided reference image, remove its original background, and place it perfectly into the SCENE CONTEXT.
SPECIFICS: Match shadows, light bounce, and reflections. The product MUST be the exact one from the reference.
AESTHETIC: Ultra-realistic, 8k, sharp focus, cinematic luxury lighting.`;

  const contentParts: any[] = [{ text: masterPrompt }];
  if (imagePart) {
    contentParts.push(imagePart);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: contentParts },
    config: {
      imageConfig: {
        aspectRatio: "9:16"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Image Synthesis Engine returned no data.");
};

export const generateSpeech = async (text: string, voice: VoiceName): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio synthesis failed.");
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
};

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
