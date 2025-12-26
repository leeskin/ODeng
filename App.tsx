
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductInput from './components/ProductInput';
import ScriptDisplay from './components/ScriptDisplay';
import { GenerateParams, ProductScript, SavedScript, ScriptSegment } from './types';
import { analyzeProductWithVisual, generateContextualImage } from './services/geminiService';

const STORAGE_KEY = 'lookchin_oden_history_v2';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<ProductScript | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedScript[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        setHistory(JSON.parse(saved)); 
      } catch (e) { 
        console.error("Failed to load history:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveHistoryToStorage = (newHistory: SavedScript[]) => {
    try {
      const slimHistory = newHistory.map(item => ({
        ...item,
        params: {
          ...item.params,
          productImage: undefined
        },
        script: {
          ...item.script,
          segments: item.script.segments.map((s: ScriptSegment) => ({
            ...s,
            imageUrl: undefined
          }))
        }
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(slimHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
      if (newHistory.length > 1) {
        saveHistoryToStorage(newHistory.slice(0, -1));
      }
    }
  };

  const handleGenerate = async (params: GenerateParams) => {
    setIsLoading(true);
    setError(null);
    setHeroImage(params.productImage || null);
    try {
      const { script: scriptResult, heroImageBase64 } = await analyzeProductWithVisual(params);
      setScript(scriptResult);
      if (heroImageBase64) setHeroImage(heroImageBase64);
      
      setTimeout(() => {
        const el = document.getElementById('script-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);

      const updatedSegments = [...scriptResult.segments];
      const visualReference = heroImageBase64 || params.productImage;
      
      for (let i = 0; i < updatedSegments.length; i++) {
        try {
          const imageUrl = await generateContextualImage(
            updatedSegments[i].imagePrompt, 
            scriptResult.visualSpecs,
            visualReference
          );
          updatedSegments[i] = { ...updatedSegments[i], imageUrl };
          setScript({ ...scriptResult, segments: [...updatedSegments] });
        } catch (imgErr) {
          console.error(`Segment ${i} visual failed:`, imgErr);
        }
      }

      const newEntry: SavedScript = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        params,
        script: { ...scriptResult, segments: updatedSegments },
      };
      
      const updatedHistory = [newEntry, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      saveHistoryToStorage(updatedHistory);

    } catch (err: any) {
      console.error(err);
      setError('System Error: การเชื่อมต่อระบบอัจฉริยะขัดข้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: SavedScript) => {
    setScript(item.script);
    setHeroImage(item.params.productImage || null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const el = document.getElementById('script-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  const clearHistory = () => {
    if (confirm('ยืนยันการล้างข้อมูลประวัติโปรเจกต์ทั้งหมด?')) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen selection:bg-amber-500 selection:text-black pb-20">
      <div className="container mx-auto max-w-7xl">
        <Header />
        
        <main className="px-4">
          <ProductInput onGenerate={handleGenerate} isLoading={isLoading} />

          {error && (
            <div className="max-w-2xl mx-auto mb-20 p-8 luxury-surface border-red-500/20 rounded-[2rem] text-red-500 text-[11px] uppercase tracking-[0.4em] font-black text-center animate-pulse">
              {error}
            </div>
          )}

          <div id="script-section" className="scroll-mt-32">
            {script && <ScriptDisplay script={script} heroImage={heroImage || undefined} />}
          </div>

          {history.length > 0 && (
            <div className="max-w-5xl mx-auto mt-40">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600">Archive / ประวัติการทำงาน</h3>
                <button 
                  onClick={clearHistory}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-700 hover:text-red-500 transition-all border-b border-transparent hover:border-red-500/30 pb-1"
                >
                  Clear Archive
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div key={item.id} onClick={() => loadFromHistory(item)} className="luxury-surface p-8 rounded-[2rem] cursor-pointer group hover:border-amber-500/30 transition-all duration-700">
                    <div className="flex flex-col gap-6">
                      <div className="h-40 w-full rounded-2xl bg-zinc-900 overflow-hidden border border-white/5 relative">
                        {item.params.productImage ? (
                          <img src={item.params.productImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="History" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-800">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-zinc-200 truncate uppercase tracking-widest leading-none">{item.script.title}</h4>
                        <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-zinc-700">
                          <span>{new Date(item.timestamp).toLocaleDateString('th-TH')}</span>
                          <span className="text-amber-500/40">{item.params.tone.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="mt-40 py-20 border-t border-white/5 text-center px-4">
        <div className="space-y-6">
           <div className="text-[11px] font-black gold-highlight uppercase tracking-[0.8em] mb-4">
             ฟาร์มคลิปลูกชิ้นโอเด้ง 1.0
           </div>
           <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.4em] max-w-sm mx-auto leading-loose">
             Proprietary Content Intelligence Engine<br/>
             Designed for the elite creators worldwide.
           </p>
           <div className="pt-10 text-zinc-800 text-[8px] font-black tracking-widest uppercase">
             &copy; 2025 FARMCLIP ODEN &mdash; ALL RIGHTS RESERVED
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
