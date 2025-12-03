
import React, { useState } from 'react';
import Experience from './components/Experience';

const WISHES = [
  { id: 1, title: "Only You", text: "Under the mistletoe or the stars, my only wish is you." },
  { id: 2, title: "Guiding Light", text: "May your Christmas be as bright as the lights guiding me to you." },
  { id: 3, title: "The Gift", text: "The best gift this year isn't under the tree, it's holding your hand." },
  { id: 4, title: "Warmth", text: "Snowflakes melt, but my love for you warms the coldest winter night." },
  { id: 5, title: "Spark", text: "Every Christmas light reminds me of the spark in your eyes." },
  { id: 6, title: "Embrace", text: "Wrapped in your arms is the only place I want to be this holiday." },
  { id: 7, title: "Magic", text: "You are the magic that makes my Christmas sparkle." },
  { id: 8, title: "Frozen Time", text: "Wishing for a moment frozen in time, just you and me and the falling snow." },
  { id: 9, title: "Heartbeat", text: "My heart beats in rhythm with the Christmas bells, calling your name." },
  { id: 10, title: "Starlight", text: "Let's make a memory tonight that will outshine the brightest star." },
];

const App: React.FC = () => {
  const [isExploded, setIsExploded] = useState(false);
  const [selectedWishIndex, setSelectedWishIndex] = useState<number>(0);
  const [textOpacity, setTextOpacity] = useState(1);

  const toggleExplosion = () => {
    setIsExploded((prev) => !prev);
  };

  const handleWishChange = (direction: 'next' | 'prev') => {
    // 1. Fade out
    setTextOpacity(0);
    
    // 2. Wait for fade out, then switch text and fade in
    setTimeout(() => {
      setSelectedWishIndex((prev) => {
        if (direction === 'next') {
          return (prev + 1) % WISHES.length;
        } else {
          return (prev - 1 + WISHES.length) % WISHES.length;
        }
      });
      setTextOpacity(1);
    }, 400); // Matches the duration-300 + a small buffer
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience isExploded={isExploded} />
      </div>

      {/* Greeting Text Display (Floating in upper center) */}
      <div className="absolute top-[20%] left-0 w-full z-10 pointer-events-none px-4 flex justify-center">
        <div 
          className={`
            max-w-4xl text-center transition-all duration-700 ease-in-out
            ${isExploded ? 'scale-110' : 'scale-100'}
          `}
          style={{ opacity: isExploded ? textOpacity : textOpacity * 0.7 }}
        >
          <p className="font-serif italic text-2xl md:text-5xl text-pink-100 drop-shadow-[0_0_15px_rgba(255,105,180,0.8)] leading-relaxed">
            “ {WISHES[selectedWishIndex].text} ”
          </p>
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        {/* Header */}
        <header className="text-center md:text-left pointer-events-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter drop-shadow-lg">
            <span className="text-red-500">MERRY</span> <span className="text-green-500">CHRISTMAS</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">Interactive 3D Experience</p>
        </header>

        {/* Instructions */}
        <div className="text-center md:text-right hidden md:block">
           <p className="text-xs text-gray-500">Drag to Rotate • Scroll to Zoom</p>
        </div>
      </div>

      {/* Right Sidebar - Expandable Smart Button */}
      {/* Container is pointer-events-none so it doesn't block the canvas, child is auto */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="pointer-events-auto group relative flex items-center justify-center">
          
          {/* Background / Shape Morphing */}
          {/* 
             Default: w-14 h-14 rounded-full
             Hover: w-72 h-20 rounded-[2.5rem]
             Uses ease-out-back (customized via cubic-bezier/spring classes) for a "pop" feel
          */}
          <div className="
            bg-white/10 backdrop-blur-xl border border-white/20 
            shadow-[0_0_20px_rgba(255,105,180,0.3)]
            transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
            w-14 h-14 rounded-full
            group-hover:w-80 group-hover:h-20 group-hover:rounded-[2rem]
            group-hover:bg-black/60 group-hover:border-pink-500/30
          "></div>

          {/* Icon Layer (Visible by default, fades out on hover) */}
          <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-50">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-pink-400 animate-pulse">
               <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
             </svg>
          </div>

          {/* Controls Layer (Hidden by default, fades in/scales up on hover) */}
          <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 delay-75">
             
             {/* Prev Button */}
             <button 
                onClick={() => handleWishChange('prev')}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
             </button>

             {/* Center Label */}
             <div className="flex flex-col items-center justify-center w-full px-2 overflow-hidden">
                <span className="text-[10px] text-pink-400 uppercase tracking-[0.2em] font-bold mb-0.5">
                   WISH {selectedWishIndex + 1}
                </span>
                <span className="text-sm md:text-base text-white font-serif italic truncate w-full text-center">
                   {WISHES[selectedWishIndex].title}
                </span>
             </div>

             {/* Next Button */}
             <button 
                onClick={() => handleWishChange('next')}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
             </button>

          </div>
        </div>
      </div>

      {/* Main Interaction Button (Bottom) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={toggleExplosion}
          className={`
            relative group px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 
            rounded-full text-white font-bold tracking-[0.2em] uppercase transition-all duration-300
            hover:bg-white/20 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]
            overflow-hidden
          `}
        >
          <span className="relative z-10">
            {isExploded ? "Gather Magic" : "Make a Wish"}
          </span>
          {/* Button Gradient Shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          {/* Button Color Glow */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-pink-600/50 to-purple-600/50 opacity-0 ${isExploded ? 'opacity-100' : 'group-hover:opacity-100'} transition-opacity duration-500 blur-md`}></div>
        </button>
      </div>
    </div>
  );
};

export default App;
    