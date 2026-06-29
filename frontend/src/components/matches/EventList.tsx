import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { eventColorOf, eventLabel } from '../../kitColors';
import { flagUrl } from './MatchSelector';

// StatsBomb full position name -> short code for compact display
export const POSITION_ABBR: Record<string, string> = {
  'Goalkeeper': 'GK',
  'Right Back': 'RB',
  'Right Center Back': 'RCB',
  'Center Back': 'CB',
  'Left Center Back': 'LCB',
  'Left Back': 'LB',
  'Right Wing Back': 'RWB',
  'Left Wing Back': 'LWB',
  'Right Defensive Midfield': 'RDM',
  'Center Defensive Midfield': 'CDM',
  'Left Defensive Midfield': 'LDM',
  'Right Center Midfield': 'RCM',
  'Center Midfield': 'CM',
  'Left Center Midfield': 'LCM',
  'Right Midfield': 'RM',
  'Left Midfield': 'LM',
  'Right Attacking Midfield': 'RAM',
  'Center Attacking Midfield': 'CAM',
  'Left Attacking Midfield': 'LAM',
  'Right Wing': 'RW',
  'Left Wing': 'LW',
  'Right Center Forward': 'RCF',
  'Center Forward': 'CF',
  'Left Center Forward': 'LCF',
  'Striker': 'ST',
  'Secondary Striker': 'SS',
};

export function positionAbbr(pos: string): string {
  if (!pos) return '';
  if (POSITION_ABBR[pos]) return POSITION_ABBR[pos];
  return pos.split(' ').map(w => w[0]).join('').toUpperCase();
}

const FILTERS = ['All', 'Goals', 'Shot', 'Pass', 'Dribble', 'Defence'];

const PHASES = [
  { label: 'All', key: 'All' },
  { label: '1st', key: 1 },
  { label: '2nd', key: 2 },
  { label: 'ET1', key: 3 },
  { label: 'ET2', key: 4 },
  { label: 'Pens', key: 5 },
];

const SURNAME_PARTICLES = new Set([
  'di', 'de', 'da', 'dos', 'del', 'della', 'van', 'von', 'der', 'den',
  'la', 'le', 'el', 'al', 'mac', 'ter', 'ten',
]);

function surname(name: string): string {
  if (!name) return '-';
  const parts = name.trim().split(' ');
  let i = parts.length - 1;
  while (i > 0 && SURNAME_PARTICLES.has(parts[i - 1].toLowerCase())) i--;
  return parts.slice(i).join(' ');
}

function reconstructable(e: any): boolean {
  return e.has_360 || e.has_shot_freeze_frame || e.shot_type === 'Penalty' ||
    e.goal_assist || e.shot_assist;
}

interface EventListProps {
  events: any[];
  loading: boolean;
  match: any | null;
  activeEvent: any | null;
  onSelect: (ev: any) => void;
  onNav?: (navInfo: any) => void;
}

const EventList: React.FC<EventListProps> = ({ events, loading, match, activeEvent, onSelect, onNav }) => {
  const [filter, setFilter] = useState('All');
  const [phase, setPhase] = useState<string | number>('All');
  const [player, setPlayer] = useState('All');
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerQuery, setPlayerQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const playerInfo = useMemo(() => {
    const map = new Map<string, { team: string; jersey: number | null; position: string }>();
    for (const e of events) {
      if (!reconstructable(e) || !e.player) continue;
      if (!map.has(e.player)) {
        map.set(e.player, { team: e.team, jersey: e.jersey_number, position: e.position });
      }
    }
    return map;
  }, [events]);

  const playerGroups = useMemo(() => {
    const byTeam: Record<string, any[]> = {};
    for (const [name, info] of playerInfo.entries()) {
      if (!byTeam[info.team]) byTeam[info.team] = [];
      byTeam[info.team].push({ name, ...info });
    }
    const num = (j: any) => (typeof j === 'number' ? j : 999);
    return Object.keys(byTeam).sort().map(team => ({
      team,
      players: byTeam[team].sort((a, b) =>
        num(a.jersey) - num(b.jersey) || surname(a.name).localeCompare(surname(b.name))),
    }));
  }, [playerInfo]);

  const selectedInfo = player === 'All' ? null : playerInfo.get(player);

  const visibleGroups = useMemo(() => {
    const q = playerQuery.trim().toLowerCase();
    if (!q) return playerGroups;
    return playerGroups
      .map(g => ({
        team: g.team,
        players: g.players.filter(p =>
          p.name.toLowerCase().includes(q) ||
          g.team.toLowerCase().includes(q) ||
          String(p.jersey ?? '').includes(q)),
      }))
      .filter(g => g.players.length > 0);
  }, [playerGroups, playerQuery]);

  const availablePhases = useMemo(() => {
    const periods = new Set<number>();
    for (const e of events) {
      if (reconstructable(e) && typeof e.period === 'number') {
        periods.add(e.period);
      }
    }
    return PHASES.filter(p => p.key === 'All' || periods.has(p.key as number));
  }, [events]);

  const filtered = useMemo(() => {
    const typeMatch = (e: any) =>
      filter === 'All' ? true
      : filter === 'Goals' ? (e.type === 'Shot' && e.outcome === 'Goal')
      : filter === 'Defence' ? (e.type === 'Interception' || e.type === 'Block' || e.type === 'Clearance')
      : e.type === filter;
    return events.filter(e =>
      reconstructable(e) &&
      typeMatch(e) &&
      (phase === 'All' || e.period === phase) &&
      (player === 'All' || e.player === player));
  }, [events, filter, phase, player]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeEvent?.id]);

  const navList = useMemo(() => events.filter(reconstructable), [events]);

  useEffect(() => {
    if (!onNav) return;
    const idx = navList.findIndex(e => e.id === activeEvent?.id);
    if (idx === -1) {
      onNav(null);
      return;
    }
    onNav({
      prev: navList[idx - 1] || null,
      next: navList[idx + 1] || null,
      index: idx,
      total: navList.length,
    });
  }, [navList, activeEvent, onNav]);

  useEffect(() => {
    setFilter('All');
    setPhase('All');
    setPlayer('All');
    setPlayerOpen(false);
    setPlayerQuery('');
  }, [match?.match_id]);

  useEffect(() => {
    if (playerOpen) searchRef.current?.focus();
  }, [playerOpen]);

  useEffect(() => {
    if (!playerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (playerRef.current && !playerRef.current.contains(e.target as Node)) {
        setPlayerOpen(false);
        setPlayerQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [playerOpen]);

  const choosePlayer = (name: string) => {
    setPlayer(name);
    setPlayerOpen(false);
    setPlayerQuery('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0c051a]/95 border-r border-purple-950/80 overflow-hidden w-80 shrink-0 backdrop-blur-md">
      
      {/* Title section */}
      <div className="p-4 border-b border-purple-900/30 flex items-center justify-between shrink-0 font-mono text-xs uppercase tracking-widest text-slate-350">
        <span>Match Timeline</span>
        {filtered.length > 0 && (
          <span className="px-2 py-0.5 rounded bg-[#38FE5E]/10 text-[#38FE5E] font-bold border border-[#38FE5E]/20 text-[10px] shadow-[0_0_10px_rgba(56,254,94,0.05)]">
            {filtered.length} Chunks
          </span>
        )}
      </div>

      {/* Primary Category Filters */}
      <div className="p-3 bg-purple-950/20 flex flex-wrap gap-1.5 border-b border-purple-900/20 shrink-0">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono border transition-all ${
              filter === f
                ? 'bg-[#38FE5E] border-[#38FE5E] text-slate-950 shadow-md shadow-[#38FE5E]/10'
                : 'bg-purple-950/50 border-purple-900/50 text-slate-400 hover:text-slate-200 hover:border-purple-700'
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Phase Filters (Stops overlapping minutes) */}
      {match && availablePhases.length > 1 && (
        <div className="px-3 py-2 bg-slate-950/20 flex gap-1 border-b border-[#23324C]/25 shrink-0">
          {availablePhases.map(p => (
            <button
              key={p.label}
              className={`flex-1 py-1 rounded text-[9px] font-bold uppercase tracking-widest font-mono border transition-all ${
                phase === p.key
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setPhase(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Roster list search selector */}
      {match && playerInfo.size > 0 && (
        <div className="px-3 py-2 border-b border-purple-900/30 shrink-0 relative" ref={playerRef}>
          <button
            className={`w-full py-1.5 px-3 rounded-lg border text-left flex items-center justify-between text-[11px] font-medium transition-colors ${
              player !== 'All'
                ? 'border-[#38FE5E]/50 bg-[#38FE5E]/5 text-slate-100'
                : 'border-purple-900 bg-purple-950/30 text-slate-400 hover:border-purple-750 hover:text-slate-200'
            }`}
            onClick={() => setPlayerOpen(o => !o)}
          >
            <span className="flex items-center gap-2 truncate">
              {selectedInfo && flagUrl(selectedInfo.team) && (
                <img className="w-4 h-3 object-cover rounded-sm shadow-sm" src={flagUrl(selectedInfo.team) || ''} alt="" />
              )}
              {selectedInfo?.jersey != null && (
                <span className="font-mono text-emerald-400 font-bold">#{selectedInfo.jersey}</span>
              )}
              <span className="truncate">{player === 'All' ? 'All Players' : player}</span>
              {selectedInfo?.position && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-500">{positionAbbr(selectedInfo.position)}</span>
              )}
            </span>
            <span>▾</span>
          </button>

          {playerOpen && (
            <div className="absolute top-11 left-3 right-3 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl z-50 flex flex-col max-h-72 overflow-hidden">
              <input
                ref={searchRef}
                className="h-9 px-3 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none"
                placeholder="Search roster..."
                value={playerQuery}
                onChange={e => setPlayerQuery(e.target.value)}
              />
              <div className="flex-1 overflow-y-auto py-1">
                {!playerQuery && (
                  <button
                    className={`w-full px-3 py-2 text-left text-[11px] font-medium border-b border-slate-900/50 hover:bg-slate-800/40 ${
                      player === 'All' ? 'bg-[#38FE5E]/10 text-white' : 'text-slate-400'
                    }`}
                    onClick={() => choosePlayer('All')}
                  >
                    All Players
                  </button>
                )}
                {visibleGroups.map(g => (
                  <div key={g.team} className="pb-1.5">
                    <div className="px-3 py-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/45 flex items-center gap-2">
                      {flagUrl(g.team) && (
                        <img className="w-3.5 h-2.5 object-cover rounded-xs" src={flagUrl(g.team) || ''} alt="" />
                      )}
                      {g.team}
                    </div>
                    {g.players.map(p => (
                      <button
                        key={p.name}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-[11px] hover:bg-slate-850/60 ${
                          player === p.name ? 'bg-[#38FE5E]/15 text-white' : 'text-slate-300'
                        }`}
                        onClick={() => choosePlayer(p.name)}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {p.jersey != null && <span className="font-mono text-emerald-400 w-4 font-bold">#{p.jersey}</span>}
                          <span className="truncate">{p.name}</span>
                        </span>
                        {p.position && (
                          <span className="text-[9px] font-mono text-slate-500">{positionAbbr(p.position)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Events scrolling feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5" ref={listRef}>
        {!match && (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic text-center px-4 font-sans leading-relaxed">
            Select a World Cup match from the dropdown to load the play-by-play events database.
          </div>
        )}
        {match && loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-400">Syncing StatsBomb Open Data...</span>
              <p className="text-[10px] text-slate-600">The first load downloads and caches match JSON files.</p>
            </div>
          </div>
        )}
        {match && !loading && filtered.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic text-center px-4">
            No events match the selected filters.
          </div>
        )}

        {filtered.map((ev, i) => {
          const isActive = activeEvent?.id === ev.id;
          const isGoal = ev.type === 'Shot' && ev.outcome === 'Goal';
          const flag = flagUrl(ev.team);

          return (
            <motion.button
              key={ev.id}
              ref={isActive ? activeRef : null}
              className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${
                isActive
                  ? 'border-[#38FE5E] bg-[#38FE5E]/5 text-slate-100 shadow-md shadow-[#38FE5E]/5'
                  : 'border-purple-900 bg-purple-950/20 text-slate-350 hover:border-purple-700 hover:text-slate-100 hover:bg-purple-950/45'
              }`}
              onClick={() => onSelect(ev)}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: Math.min(i * 0.006, 0.15) }}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: eventColorOf(ev) }} />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate flex items-center gap-1.5">
                    <span>{surname(ev.player)}</span>
                    {isGoal && (
                      <span className="text-[8px] px-1 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 rounded font-mono">
                        GOAL
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                    {flag && <img className="w-3.5 h-2.5 object-cover rounded-xs" src={flag || ''} alt="" />}
                    <span className="truncate">{ev.team}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-md border font-mono uppercase tracking-wider font-bold bg-slate-900" style={{ color: eventColorOf(ev), borderColor: eventColorOf(ev) }}>
                  {eventLabel(ev)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {ev.period === 5 ? 'PENS' : `${ev.minute + 1}'`}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

    </div>
  );
};

export default EventList;
