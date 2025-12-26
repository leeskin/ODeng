
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="relative">
      {/* Top Navigation Bar - Premium App Feel */}
      <nav className="nav-blur h-20 flex items-center justify-between px-8 md:px-20">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Production Mode</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hidden md:block">Engine 2.5 Pro</span>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center">
             <div className="h-3 w-3 rounded-full border border-amber-500/50"></div>
          </div>
        </div>
      </nav>

      {/* Hero Branding Section */}
      <header className="pt-24 pb-20 md:pt-40 md:pb-32 text-center px-4 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
           <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Next-Gen Video Intelligence</span>
        </div>
        
        <div className="space-y-8">
          <h1 className="text-5xl md:text-[7rem] leading-[0.9] brand-title">
            ฟาร์มคลิป<br/>
            <span className="gold-highlight">ลูกชิ้นโอเด้ง 1.0</span>
          </h1>
          
          <div className="flex items-center justify-center gap-6 max-w-2xl mx-auto pt-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800"></div>
            <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] whitespace-nowrap">
              Masterpiece Content Creation
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800"></div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
