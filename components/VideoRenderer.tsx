
import React, { useState, useRef, useEffect } from 'react';
import { ProductScript, ScriptSegment } from '../types';

interface Props {
  script: ProductScript;
  audioUrl: string;
  onComplete?: (videoBlob: Blob) => void;
}

const VideoRenderer: React.FC<Props> = ({ script, audioUrl, onComplete }) => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startRendering = async () => {
    if (!canvasRef.current || !audioUrl) return;
    setIsRendering(true);
    setProgress(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 720;
    canvas.height = 1280;

    const audio = new Audio(audioUrl);
    await new Promise((resolve) => {
      audio.onloadedmetadata = resolve;
    });

    const totalDuration = audio.duration + 1;
    const stream = canvas.captureStream(30);
    
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audio);
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioCtx.destination);
    
    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000 
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setVideoPreviewUrl(url);
      if (onComplete) onComplete(blob);
      setIsRendering(false);
    };

    const images = await Promise.all(
      script.segments.map(s => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = s.imageUrl || '';
          img.onload = () => resolve(img);
        });
      })
    );

    recorder.start();
    audio.play();

    const startTime = performance.now();
    const segmentDuration = audio.duration / script.segments.length;

    const renderFrame = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      
      if (elapsed >= totalDuration) {
        recorder.stop();
        audio.pause();
        return;
      }

      setProgress(Math.min(100, (elapsed / totalDuration) * 100));

      const segmentIdx = Math.min(
        script.segments.length - 1,
        Math.floor(elapsed / segmentDuration)
      );
      
      const img = images[segmentIdx];
      const segmentElapsed = elapsed % segmentDuration;
      const segmentProgress = segmentElapsed / segmentDuration;

      const isZoomIn = segmentIdx % 2 === 0;
      const scaleBase = 1.0;
      const scaleMax = 1.2;
      const currentScale = isZoomIn 
        ? scaleBase + (scaleMax - scaleBase) * segmentProgress
        : scaleMax - (scaleMax - scaleBase) * segmentProgress;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const iw = img.width;
      const ih = img.height;
      const cw = canvas.width;
      const ch = canvas.height;
      const ratio = Math.max(cw / iw, ch / ih);
      const nw = iw * ratio * currentScale;
      const nh = ih * ratio * currentScale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;

      ctx.drawImage(img, nx, ny, nw, nh);

      const grad = ctx.createLinearGradient(0, ch * 0.6, 0, ch);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, ch * 0.6, cw, ch * 0.4);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Plus Jakarta Sans"';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText(script.title.toUpperCase(), cw / 2, ch - 80);

      ctx.restore();
      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  return (
    <div className="pt-20 border-t border-white/5">
      <div className="flex flex-col items-center justify-center space-y-12">
        {!videoPreviewUrl && !isRendering && (
          <button 
            onClick={startRendering}
            className="satin-button px-16 py-8 rounded-2xl text-[10px] flex items-center gap-6 group"
          >
            <div className="h-2 w-2 rounded-full bg-red-500 group-hover:animate-ping"></div>
            GENERATE CINEMATIC FILM (9:16)
          </button>
        )}

        {isRendering && (
          <div className="w-full max-w-sm space-y-8 px-4">
            <div className="h-[2px] w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-center font-black uppercase tracking-[0.6em] text-white">
              Processing Frames... {Math.round(progress)}%
            </p>
          </div>
        )}

        {videoPreviewUrl && (
          <div className="space-y-12 w-full flex flex-col items-center">
            <div className="relative group">
               <div className="absolute -inset-4 bg-amber-500/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative aspect-[9/16] w-full max-w-[360px] rounded-[3.5rem] overflow-hidden border border-white/10 bg-black shadow-3xl">
                 <video src={videoPreviewUrl} controls autoPlay loop className="w-full h-full object-cover" />
               </div>
            </div>
            
            <div className="flex items-center gap-12">
              <button 
                onClick={() => setVideoPreviewUrl(null)}
                className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-600 hover:text-white transition-colors"
              >
                Remaster
              </button>
              <a 
                href={videoPreviewUrl} 
                download={`${script.title.replace(/\s/g, '_')}_PREMIUM_AD.mp4`}
                className="text-[9px] font-black uppercase tracking-[0.5em] text-amber-500 border-b border-amber-500/20 pb-1 hover:border-amber-500 transition-all"
              >
                Export MP4
              </a>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default VideoRenderer;
