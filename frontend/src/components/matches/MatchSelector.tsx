import React, { useEffect, useMemo, useRef, useState } from 'react';

// flagcdn.com country codes for all 32 World Cup 2022 nations
export const FLAG_CODES: Record<string, string> = {
  'Qatar': 'qa',
  'Ecuador': 'ec',
  'Senegal': 'sn',
  'Netherlands': 'nl',
  'England': 'gb-eng',
  'Iran': 'ir',
  'United States': 'us',
  'Wales': 'gb-wls',
  'Argentina': 'ar',
  'Saudi Arabia': 'sa',
  'Mexico': 'mx',
  'Poland': 'pl',
  'France': 'fr',
  'Australia': 'au',
  'Denmark': 'dk',
  'Tunisia': 'tn',
  'Spain': 'es',
  'Costa Rica': 'cr',
  'Germany': 'de',
  'Japan': 'jp',
  'Belgium': 'be',
  'Canada': 'ca',
  'Morocco': 'ma',
  'Croatia': 'hr',
  'Brazil': 'br',
  'Serbia': 'rs',
  'Switzerland': 'ch',
  'Cameroon': 'cm',
  'Portugal': 'pt',
  'Ghana': 'gh',
  'Uruguay': 'uy',
  'South Korea': 'kr',
};

export function flagUrl(teamName: string, width = 40): string | null {
  const code = FLAG_CODES[teamName];
  return code ? `https://flagcdn.com/w${width}/${code}.png` : null;
}

export const TEAM_ABBR: Record<string, string> = {
  'Qatar': 'QAT', 'Ecuador': 'ECU', 'Senegal': 'SEN', 'Netherlands': 'NED',
  'England': 'ENG', 'Iran': 'IRN', 'United States': 'USA', 'Wales': 'WAL',
  'Argentina': 'ARG', 'Saudi Arabia': 'KSA', 'Mexico': 'MEX', 'Poland': 'POL',
  'France': 'FRA', 'Australia': 'AUS', 'Denmark': 'DEN', 'Tunisia': 'TUN',
  'Spain': 'ESP', 'Costa Rica': 'CRC', 'Germany': 'GER', 'Japan': 'JPN',
  'Belgium': 'BEL', 'Canada': 'CAN', 'Morocco': 'MAR', 'Croatia': 'CRO',
  'Brazil': 'BRA', 'Serbia': 'SRB', 'Switzerland': 'SUI', 'Cameroon': 'CMR',
  'Portugal': 'POR', 'Ghana': 'GHA', 'Uruguay': 'URU', 'South Korea': 'KOR',
};

export function teamAbbr(teamName: string): string {
  if (!teamName) return '???';
  return TEAM_ABBR[teamName] || teamName.slice(0, 3).toUpperCase();
}

const STAGE_ORDER = [
  'Group Stage', 'Round of 16', 'Quarter-finals', 'Semi-finals',
  '3rd Place Final', 'Final',
];

interface MatchSelectorProps {
  matches: any[];
  error: string | null;
  selectedMatch: any | null;
  onSelect: (match: any) => void;
}

const MatchSelector: React.FC<MatchSelectorProps> = ({ matches, error, selectedMatch, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? matches.filter(m =>
          `${m.home_team} ${m.away_team} ${m.stage}`.toLowerCase().includes(q))
      : matches;
    const groups = new Map<string, any[]>();
    for (const m of filtered) {
      const stage = m.stage || 'Group Stage';
      if (!groups.has(stage)) groups.set(stage, []);
      groups.get(stage)!.push(m);
    }
    return [...groups.entries()].sort((a, b) => {
      const ia = STAGE_ORDER.indexOf(a[0]);
      const ib = STAGE_ORDER.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [matches, query]);

  return (
    <div className="relative w-full z-40 select-none" ref={rootRef}>

      <button
        className={`w-full h-10 rounded-xl bg-slate-900/60 border border-slate-700/60 px-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-slate-200 focus:outline-none ${
          open ? 'border-[#38FE5E]/80 ring-1 ring-[#38FE5E]/30' : ''
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {selectedMatch ? (
          <span className="flex items-center gap-3 flex-1 justify-center md:justify-start">
            <img className="w-5 h-3.5 object-cover rounded shadow" src={flagUrl(selectedMatch.home_team) || ''} alt="" />
            <span className="font-semibold text-xs text-slate-100 font-sans">
              {selectedMatch.home_team} {selectedMatch.home_score}–{selectedMatch.away_score} {selectedMatch.away_team}
            </span>
            <img className="w-5 h-3.5 object-cover rounded shadow" src={flagUrl(selectedMatch.away_team) || ''} alt="" />
          </span>
        ) : (
          <span className="text-xs text-slate-500 italic">
            {error ? 'API Offline' : matches.length ? 'Select a match...' : 'Loading 64 matches...'}
          </span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {error && <div className="text-[10px] text-red-500 font-mono mt-1 px-1">{error}</div>}

      {open && (
        <div className="animate-slide-down absolute top-14 left-0 w-full rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur-md z-50 flex flex-col max-h-80 overflow-hidden">
          <input
            className="w-full h-10 px-4 bg-slate-900 border-b border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            placeholder="Search teams or stages (e.g. Argentina, Quarter-finals)..."
            value={query}
            autoFocus
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex-1 overflow-y-auto py-1">
            {grouped.map(([stage, ms]) => (
              <div key={stage}>
                <div className="px-4 py-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono bg-slate-900/40">
                  {stage}
                </div>
                {ms.map(m => (
                  <button
                    key={m.match_id}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between border-b border-slate-900/50 hover:bg-slate-800/50 transition-colors ${
                      selectedMatch?.match_id === m.match_id ? 'bg-[#38FE5E]/10 text-white' : 'text-slate-300'
                    }`}
                    onClick={() => {
                      onSelect(m);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <span className="flex items-center gap-2.5 text-xs">
                      <img className="w-4 h-3 object-cover rounded-sm" src={flagUrl(m.home_team) || ''} alt="" />
                      <span className="font-medium">{m.home_team}</span>
                      <span className="font-bold text-slate-400 mx-1">{m.home_score}–{m.away_score}</span>
                      <span className="font-medium">{m.away_team}</span>
                      <img className="w-4 h-3 object-cover rounded-sm" src={flagUrl(m.away_team) || ''} alt="" />
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{m.match_date}</span>
                  </button>
                ))}
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchSelector;
