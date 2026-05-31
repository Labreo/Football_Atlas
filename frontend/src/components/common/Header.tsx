import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full shrink-0 h-16 glass-panel border-b border-pitch-border flex items-center justify-between px-6 z-20">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-pitch-neonCyan/10 border border-pitch-neonCyan flex items-center justify-center font-display font-black text-lg text-pitch-neonCyan shadow-[0_0_12px_rgba(0,243,255,0.2)]">
          FA
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-extrabold text-base tracking-wide text-slate-100 uppercase">
            Football Atlas
          </h1>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            AI-Powered Tactical Arena
          </span>
        </div>
      </div>

      {/* Connection & Meta Badges */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-pitch-surface/60 border border-pitch-border">
          <span className="w-1.5 h-1.5 rounded-full bg-pitch-neonGreen animate-pulse shadow-glow-green" />
          <span className="text-[10px] font-semibold text-slate-300 font-sans tracking-wide">
            Granite v2.0 Connect
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-pitch-surface/60 border border-pitch-border">
          <span className="w-1.5 h-1.5 rounded-full bg-pitch-neonCyan animate-pulse shadow-glow-cyan" />
          <span className="text-[10px] font-semibold text-slate-300 font-sans tracking-wide">
            Docling Ingest Base Active
          </span>
        </div>

        <div className="text-xs text-slate-400 font-semibold border-l border-slate-700/50 pl-4 h-5 flex items-center font-display">
          v1.0.0
        </div>
      </div>
    </header>
  );
};

export default Header;
