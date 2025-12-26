
import React, { useState, useRef } from 'react';
import { Tone, GenerateParams } from '../types';

interface Props {
  onGenerate: (params: GenerateParams) => void;
  isLoading: boolean;
}

const ProductInput: React.FC<Props> = ({ onGenerate, isLoading }) => {
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(60);
  const [tone, setTone] = useState<Tone>(Tone.Minimal);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onGenerate({ 
      url, 
      durationSeconds: duration, 
      tone, 
      productImage: imagePreview || undefined 
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto mb-32 px-4">
      <div className="luxury-surface p-10 md:p-16 rounded-[3rem]">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex-none h-6 w-6 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">01</span>
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-400">
                Visual Identity / รูปสินค้า
              </label>
            </div>
            <div 
              onClick={triggerFileInput}
              className={`relative group cursor-pointer aspect-video rounded-3xl border border-white/5 transition-all duration-700 overflow-hidden flex flex-col items-center justify-center ${
                imagePreview ? 'bg-black' : 'bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-contain" alt="Preview" />
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white bg-zinc-900/50 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">Replace Content</span>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900/50 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 group-hover:scale-110 transition-all duration-500 border border-white/5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Drop Product Visual</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Supports high-res PNG / JPG</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange} 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex-none h-6 w-6 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">02</span>
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-400">Source Link / ลิงก์สินค้า</label>
            </div>
            <input
              type="url"
              placeholder="PASTE URL HERE"
              className="w-full glow-input rounded-2xl px-8 py-6 text-base text-white focus:outline-none placeholder:text-zinc-800 font-medium tracking-wide"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-400">Duration</label>
                <span className="text-amber-500 font-mono text-xs font-black tracking-widest">{duration}S</span>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                className="w-full h-px bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-[8px] text-zinc-700 font-black uppercase tracking-[0.3em]">
                <span>Short</span>
                <span>Long Form</span>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-400">Persona Tone</label>
              <div className="relative">
                <select
                  className="w-full glow-input rounded-2xl px-8 py-5 text-white focus:outline-none appearance-none cursor-pointer text-xs font-black uppercase tracking-widest"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                >
                  {Object.values(Tone).map((t) => (
                    <option key={t} value={t} className="bg-zinc-950 text-white">{t}</option>
                  ))}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url}
            className={`satin-button w-full py-8 rounded-2xl text-[10px] shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-6">
                <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                PRODUCING...
              </span>
            ) : "INITIATE PRODUCTION"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductInput;
