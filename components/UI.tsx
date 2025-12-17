import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { BGM_URL } from '../constants';

const MusicPlayer = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { audioPlaying, setAudioPlaying } = useStore();

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (audioPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setAudioPlaying(!audioPlaying);
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 z-40">
            <button onClick={togglePlay} className="relative w-10 h-10 flex items-center justify-center group">
                 {/* Rotating snowflake/icon */}
                 <div className={`text-2xl ${audioPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    ❄️
                 </div>
                 {/* Breathing glow */}
                 {audioPlaying && (
                     <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse"></div>
                 )}
            </button>
            <div className="overflow-hidden w-48">
                <div className={`whitespace-nowrap text-white/80 text-sm font-light ${audioPlaying ? 'animate-[marquee_5s_linear_infinite]' : ''}`}>
                    Merry Christmas Mr. Lawrence - Ryuichi Sakamoto
                </div>
            </div>
            <audio ref={audioRef} src={BGM_URL} loop />
        </div>
    );
};

const UI = () => {
  const { gesture, phase, nextPhoto, prevPhoto } = useStore();

  return (
    <>
      {/* Title - Slightly larger */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center mix-blend-screen w-full">
        <h1 className="font-handwriting text-5xl md:text-7xl text-[#F1E6D2] opacity-95 drop-shadow-[0_0_20px_rgba(241,230,210,0.5)] animate-[pulse_4s_ease-in-out_infinite]">
          Merry Christmas
        </h1>
        <p className="text-[#F1E6D2]/60 text-xs md:text-sm mt-2 tracking-[0.5em] font-light uppercase">Interactive WebGL Experience</p>
      </div>

      {/* State Info */}
      <div className="fixed top-4 left-4 z-40 flex flex-col gap-2">
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white">
              <div className="text-xs uppercase text-white/40 tracking-widest mb-1">Status</div>
              <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${gesture !== 'None' ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400'}`}></span>
                  <span className="font-mono text-sm">{gesture} detected</span>
              </div>
              <div className="mt-2 text-xs text-white/60 max-w-[200px]">
                 {phase === 'tree' && "Tip: Show an Open Palm ✋ to explore the memories."}
                 {phase === 'nebula' && "Tip: Show a Closed Fist ✊ to return to the tree. Click photos or use gestures to flip."}
              </div>
          </div>
      </div>
      
      {/* Navigation Arrows for Nebula Phase */}
      {phase === 'nebula' && (
          <>
            <button 
                onClick={prevPhoto}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110"
            >
                ←
            </button>
            <button 
                onClick={nextPhoto}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110"
            >
                →
            </button>
          </>
      )}

      <MusicPlayer />
      
      {/* Tailwind animation extension */}
      <style>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  );
};

export default UI;