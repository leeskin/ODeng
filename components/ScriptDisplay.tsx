
import React, { useState, useEffect, useRef } from 'react';
import { ProductScript, AVAILABLE_VOICES, VoiceName, AVAILABLE_MUSIC, MusicMood, ScriptSegment } from '../types';
import { generateSpeech, generateContextualImage } from '../services/geminiService';
import VideoRenderer from './VideoRenderer';

interface Props {
  script: ProductScript;
  heroImage?: string;
  onUpdateScript?: (updatedScript: ProductScript) => void;
}

const ScriptDisplay: React.FC<Props> = ({ script, heroImage, onUpdateScript }) => {
  const [editableSegments, setEditableSegments] = useState(script.segments);
  const [regeneratingIndices, setRegeneratingIndices] = useState<Set<number>>(new Set());
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Zephyr');
  const [selectedMusic, setSelectedMusic] = useState<string>('none');
  const [bgmVolume, setBgmVolume] = useState(0.2);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);

  const narrationBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    setEditableSegments(script.segments);
    setAudioUrl(null);
  }, [script]);

  const handleRegenerateImage = async (index: number) => {
    if (regeneratingIndices.has(index)) return;
    setRegeneratingIndices(prev => new Set(prev).add(index));
    try {
      const segment = editableSegments[index];
      const newImageUrl = await generateContextualImage(
        segment.imagePrompt, 
        script.visualSpecs, 
        heroImage
      );
      const newSegments = [...editableSegments];
      newSegments[index] = { ...segment, imageUrl: newImageUrl };
      setEditableSegments(newSegments);
      if (onUpdateScript) onUpdateScript({ ...script, segments: newSegments });
    } catch (error) {
      alert("การสร้างภาพใหม่ล้มเหลว");
    } finally {
      setRegeneratingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    setAudioUrl(null);
    try {
      const fullText = editableSegments.map(s => s.dialogue).join(' ');
      const audioBuffer = await generateSpeech(fullText, selectedVoice);
      narrationBufferRef.current = audioBuffer;
      if (selectedMusic === 'none') {
        setAudioUrl(URL.createObjectURL(audioBufferToWavBlob(audioBuffer)));
      } else {
        await mixWithMusic();
      }
    } catch (e) { alert("Audio failed"); }
    finally { setIsGeneratingAudio(false); }
  };

  const mixWithMusic = async () => {
    if (!narrationBufferRef.current) return;
    setIsMixing(true);
    try {
      const mood = AVAILABLE_MUSIC.find(m => m.id === selectedMusic);
      if (!mood || !mood.url) return;
      const audioCtx = new AudioContext();
      const res = await fetch(mood.url);
      const ab = await res.arrayBuffer();
      const musicBuf = await audioCtx.decodeAudioData(ab);
      const targetSR = 44100;
      const offCtx = new OfflineAudioContext(2, Math.ceil(narrationBufferRef.current.duration * targetSR), targetSR);
      const nSrc = offCtx.createBufferSource(); nSrc.buffer = narrationBufferRef.current;
      const mSrc = offCtx.createBufferSource(); mSrc.buffer = musicBuf; mSrc.loop = true;
      const nGain = offCtx.createGain(); nGain.gain.value = 1.4;
      const mGain = offCtx.createGain(); mGain.gain.value = bgmVolume;
      nSrc.connect(nGain).connect(offCtx.destination);
      mSrc.connect(mGain).connect(offCtx.destination);
      nSrc.start(0); mSrc.start(0);
      const rendered = await offCtx.startRendering();
      setAudioUrl(URL.createObjectURL(audioBufferToWavBlob(rendered)));
    } catch (e) { console.error(e); }
    finally { setIsMixing(false); }
  };

  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const data = new Int16Array(buffer.length * buffer.numberOfChannels);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const cd = buffer.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, cd[i]));
        data[i * buffer.numberOfChannels + c] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
    }
    const header = new ArrayBuffer(44);
    const v = new DataView(header);
    const writeString = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    writeString(0, 'RIFF'); v.setUint32(4, 36 + data.buffer.byteLength, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, buffer.numberOfChannels, true);
    v.setUint32(24, buffer.sampleRate, true); v.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    v.setUint16(32, buffer.numberOfChannels * 2, true); v.setUint16(34, 16, true); writeString(36, 'data');
    v.setUint32(40, data.buffer.byteLength, true);
    return new Blob([header, data], { type: 'audio/wav' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      
      {/* Script Section */}
      <div className="luxury-surface p-12 md:p-20 rounded-[4rem] relative overflow-hidden">
        {/* Hero Reference Badge */}
        {heroImage && (
          <div className="absolute top-0 right-0 p-12 hidden md:block z-10">
            <div className="w-24 aspect-[9/16] rounded-2xl border border-white/10 overflow-hidden shadow-3xl bg-black">
              <img src={heroImage} className="w-full h-full object-cover opacity-80" alt="Product Ref" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <span className="absolute bottom-2 left-0 right-0 text-[8px] text-center font-black text-amber-500 uppercase tracking-widest">Master Ref</span>
            </div>
          </div>
        )}

        <div className="max-w-3xl space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none gold-gradient">{script.title}</h2>
            <p className="text-zinc-500 text-xl font-light italic leading-relaxed">{script.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-16 border-t border-white/5">
            {editableSegments.map((segment, idx) => (
              <div key={idx} className="space-y-8 group">
                <div className="flex justify-between items-center text-zinc-600 font-mono text-[10px] tracking-widest uppercase">
                  <span>Scene {idx + 1}</span>
                  <span className="text-amber-500/50">{segment.time}</span>
                </div>
                
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-amber-500/20">
                  {segment.imageUrl ? (
                    <>
                      <img src={segment.imageUrl} className={`h-full w-full object-cover transition-all duration-1000 ${regeneratingIndices.has(idx) ? 'blur-2xl opacity-20' : ''}`} alt="Segment" />
                      <button 
                        onClick={() => handleRegenerateImage(idx)}
                        disabled={regeneratingIndices.has(idx)}
                        className="absolute top-8 right-8 p-5 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all duration-500 opacity-0 group-hover:opacity-100"
                      >
                        <svg className={`w-5 h-5 ${regeneratingIndices.has(idx) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                      <div className="h-10 w-10 rounded-full border border-amber-500/20 border-t-amber-500 animate-spin"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700">Synthesizing...</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-12">
                     <p className="text-sm text-zinc-200 font-medium leading-relaxed italic">
                        <span className="text-amber-500 not-italic font-black text-[10px] uppercase tracking-[0.4em] block mb-3">Storyboard Visual</span>
                        {segment.visual}
                      </p>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                  <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">Dialog Script / บทพูด</label>
                  <textarea
                    className="w-full bg-transparent border-b border-white/5 focus:border-white outline-none text-white py-4 text-xl leading-relaxed resize-none transition-all font-light"
                    value={segment.dialogue}
                    onChange={(e) => {
                      const next = [...editableSegments];
                      next[idx].dialogue = e.target.value;
                      setEditableSegments(next);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Engine Section */}
      <div className="luxury-surface p-12 md:p-20 rounded-[4rem] space-y-16">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-zinc-900"></div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-600">Audio Composition</h3>
          <div className="h-px flex-1 bg-zinc-900"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Voice Profile</label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_VOICES.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => setSelectedVoice(v.id)}
                  className={`px-6 py-4 rounded-2xl text-left border transition-all duration-500 ${selectedVoice === v.id ? 'border-amber-500 bg-amber-500/5 text-white' : 'border-white/5 text-zinc-600 hover:text-zinc-300'}`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Ambient Soundtrack</label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_MUSIC.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setSelectedMusic(m.id)} 
                  className={`p-6 rounded-2xl transition-all duration-500 border ${selectedMusic === m.id ? 'border-white bg-white text-black' : 'border-white/5 bg-zinc-950 text-zinc-600 hover:text-white'}`}
                >
                  <span className="text-2xl block mb-2">{m.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Master Level</label>
              <input 
                type="range" 
                min="0" 
                max="0.5" 
                step="0.05" 
                className="w-full h-px bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" 
                value={bgmVolume} 
                onChange={e => setBgmVolume(parseFloat(e.target.value))} 
              />
              <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                <span>Silent</span>
                <span>Full Presence</span>
              </div>
            </div>

            <div className="pt-6">
              {!audioUrl ? (
                <button 
                  onClick={handleGenerateAudio} 
                  disabled={isGeneratingAudio || isMixing} 
                  className="w-full satin-button py-8 rounded-2xl text-[10px]"
                >
                  {isGeneratingAudio || isMixing ? "ENGINEERING SOUND..." : "PRODUCE MASTER AUDIO"}
                </button>
              ) : (
                <div className="space-y-12 animate-in zoom-in-95 duration-700">
                   <div className="space-y-8">
                     <div className="h-16 w-full bg-black/50 rounded-3xl border border-white/5 px-6 flex items-center">
                        <audio controls src={audioUrl} className="w-full h-8 filter invert contrast-150" />
                     </div>
                     <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                        <button onClick={() => setAudioUrl(null)} className="text-[9px] font-black tracking-[0.5em] text-zinc-600 hover:text-white uppercase transition-all">Reset Audio</button>
                        <a href={audioUrl} download="production_master.wav" className="text-[9px] font-black tracking-[0.5em] text-amber-500 border-b border-amber-500/20 pb-1 hover:border-amber-500 transition-all">Export Masters</a>
                     </div>
                   </div>

                   <VideoRenderer script={{ ...script, segments: editableSegments }} audioUrl={audioUrl} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDisplay;
