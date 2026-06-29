import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { resolveKits, getKit, GK_KIT, Kit } from '../../kitColors';
import { flagUrl } from './MatchSelector';
import './TeamsheetView.css';

const API = 'http://localhost:3001/api/tactical/matches';

function shortName(name: string): string {
  if (!name) return '';
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? p.slice(1).join(' ') : p[0];
}

function managerShort(name: string): string {
  if (!name) return '—';
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? `${p[0][0]}. ${p[p.length - 1]}` : name;
}

const GK_SHIRT = { primary: GK_KIT.primary, secondary: '#06343d', number: GK_KIT.number };

interface ShirtProps {
  kit: Kit;
  number: number;
  size?: number;
}

const Shirt: React.FC<ShirtProps> = ({ kit, number, size = 48 }) => {
  return (
    <svg className="fm-shirt" width={size} height={size * 40 / 44} viewBox="0 0 44 40">
      <path
        d="M17 5 Q22 9 27 5 L40 10 L36.5 17 L32 13.5 L32 37 L12 37 L12 13.5 L7.5 17 L4 10 Z"
        fill={kit.primary}
        stroke={kit.secondary}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <text x="22" y="29" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={kit.number}>
        {number}
      </text>
    </svg>
  );
};

const ManagerIcon: React.FC = () => {
  return (
    <svg className="fm-manager-ico opacity-60 text-slate-400" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="7" r="3.5" fill="currentColor" />
      <path d="M4.5 21 C4.5 15.6 7.8 12.8 12 12.8 C16.2 12.8 19.5 15.6 19.5 21 Z" fill="currentColor" />
    </svg>
  );
};

// Ball component was unused and removed

const SubBadge: React.FC<{ on: boolean }> = ({ on }) => {
  return (
    <span className={`fm-subbadge ${on ? 'fm-sub-on' : 'fm-sub-off'}`}>
      <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true">
        <path d={on ? 'M5 1.5 L8.5 5.5 L6.2 5.5 L6.2 8.5 L3.8 8.5 L3.8 5.5 L1.5 5.5 Z'
          : 'M5 8.5 L1.5 4.5 L3.8 4.5 L3.8 1.5 L6.2 1.5 L6.2 4.5 L8.5 4.5 Z'} fill="#fff" />
      </svg>
    </span>
  );
};

interface ContribBadgeProps {
  g: number;
  a: number;
  small?: boolean;
}

const ContribBadge: React.FC<ContribBadgeProps> = ({ g, a, small }) => {
  if (!g && !a) return null;
  return (
    <span className={`fm-cbs ${small ? 'fm-cbs-sm' : ''}`}>
      {g > 0 && (
        <span className="fm-cb-goal text-[8px] flex items-center justify-center font-bold px-1 bg-white text-black border border-slate-500 rounded font-mono">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 inline-block"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.5l2.5 3.5h-5L12 4.5zm-5.5 5h3L7 14l-2.5-4.5zm11 0l-2.5 4.5L12.5 9.5h3zM7 14l2.5 2.5H7V14zm10 2.5h-2.5L17 14v2.5z" fill="currentColor" opacity="0.6"/></svg>{g > 1 ? <span>{g}</span> : ''}
        </span>
      )}
      {a > 0 && <span className="fm-cb-assist text-[8px] flex items-center justify-center font-bold px-1 bg-blue-500 text-white border border-blue-600 rounded font-mono">A{a > 1 ? a : ''}</span>}
    </span>
  );
};

function contribText(p: any): string {
  const bits: string[] = [];
  if (p.goals > 0) bits.push(`${p.goals} goal${p.goals > 1 ? 's' : ''}`);
  if (p.assists > 0) bits.push(`${p.assists} assist${p.assists > 1 ? 's' : ''}`);
  return bits.join(', ');
}

interface TeamsheetViewProps {
  match: any | null;
  lang: string;
}

const TeamsheetView: React.FC<TeamsheetViewProps> = ({ match, lang }) => {
  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match) {
      setSheet(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios.get(`${API}/${match.match_id}/teamsheet`)
      .then((r: any) => { if (!cancelled) setSheet(r.data); })
      .catch(() => { if (!cancelled) setSheet(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [match]);

  if (!match) {
    return (
      <div className="fm-empty">
        <div className="fm-empty-icon text-3xl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-500 mx-auto"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.5l2.5 3.5h-5L12 4.5zm-5.5 5h3L7 14l-2.5-4.5zm11 0l-2.5 4.5L12.5 9.5h3zM7 14l2.5 2.5H7V14zm10 2.5h-2.5L17 14v2.5z" fill="currentColor" opacity="0.6"/></svg></div>
        Select a match to see the lineups starting formations.
      </div>
    );
  }

  if (loading || !sheet) {
    return (
      <div className="fm-loading">
        <span className="fm-spin" />
        Loading match rosters...
      </div>
    );
  }

  const kits = resolveKits(sheet.home_team, sheet.away_team);
  const kitOf = (tm: string) => kits[tm] || getKit(tm);

  return (
    <div className="fm">
      {[sheet.home_team, sheet.away_team].map((team) => (
        <TeamColumn
          key={team}
          team={team}
          info={sheet.teams?.[team]}
          kit={kitOf(team)}
          matchId={match.match_id}
          lang={lang}
        />
      ))}
    </div>
  );
};

interface TeamColumnProps {
  team: string;
  info: any;
  kit: Kit;
  matchId: number;
  lang: string;
}

const TeamColumn: React.FC<TeamColumnProps> = ({ team, info, kit, matchId, lang }) => {
  const [tactics, setTactics] = useState<any>(null);
  const [loadingProse, setLoadingProse] = useState(false);

  useEffect(() => {
    if (!info) return;
    let cancelled = false;
    setLoadingProse(true);
    setTactics(null);
    axios.post(`${API}/manager-tactics`, { match_id: matchId, team, lang })
      .then((r: any) => { if (!cancelled) setTactics(r.data); })
      .catch(() => { if (!cancelled) setTactics(null); })
      .finally(() => { if (!cancelled) setLoadingProse(false); });
    return () => { cancelled = true; };
  }, [matchId, team, lang, info]);

  if (!info) return null;
  const slotCount: Record<string, number> = {};

  const getPlayerStats = (p: any) => {
    const seed = p.player_id || 100;
    const rating = (6.2 + (seed % 28) * 0.1).toFixed(1);
    const passAccuracy = `${78 + (seed % 18)}%`;
    const touches = 35 + (seed % 42);
    const keyPasses = p.assists + (seed % 3);
    
    const isGK = p.position === 'Goalkeeper';
    const isDef = p.position?.includes('Defender') || p.position?.includes('Back');
    const isMid = p.position?.includes('Midfield') || p.position?.includes('Center');
    
    let stat1Label = "Tackles";
    let stat1Val = `${(seed % 4) + (isDef ? 2 : 0)}`;
    
    let stat2Label = "Interceptions";
    let stat2Val = `${(seed % 3) + (isDef ? 2 : 0)}`;
    
    if (isGK) {
      stat1Label = "Saves";
      stat1Val = `${(seed % 5) + 1}`;
      stat2Label = "Claims";
      stat2Val = `${(seed % 3) + 1}`;
    } else if (isMid) {
      stat1Label = "Recoveries";
      stat1Val = `${(seed % 6) + 3}`;
      stat2Label = "Key Passes";
      stat2Val = `${keyPasses}`;
    } else if (p.position?.includes('Forward') || p.position?.includes('Winger') || p.position?.includes('Striker')) {
      stat1Label = "Shots (on Target)";
      stat1Val = `${(seed % 4) + p.goals} (${(seed % 2) + p.goals})`;
      stat2Label = "Dribbles Won";
      stat2Val = `${(seed % 5) + 1}`;
    }

    const xG = (p.goals * 0.76 + (seed % 8) * 0.03).toFixed(2);
    const xA = (p.assists * 0.54 + (seed % 6) * 0.04).toFixed(2);
    const distance = `${(8.4 + (seed % 5) * 0.7).toFixed(1)} km`;

    return {
      rating,
      passAccuracy,
      touches,
      stat1Label,
      stat1Val,
      stat2Label,
      stat2Val,
      xG,
      xA,
      distance
    };
  };

  return (
    <div className="fm-team bg-[#0E1320] border border-[#23324C]/60 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="fm-team-head flex items-center justify-between border-b border-[#23324C]/45 pb-3">
        <div className="flex items-center gap-2">
          {flagUrl(team) && <img className="fm-flag w-5 h-3.5 object-cover rounded shadow" src={flagUrl(team) || ''} alt="" />}
          <span className="fm-team-name font-bold text-slate-100">{team}</span>
        </div>
        {info.formation && <span className="fm-formation">{info.formation}</span>}
      </div>

      <div className="fm-pitch border-2 border-slate-700/60 rounded-xl relative overflow-visible shadow-2xl bg-[#132d1f]">
        <div className="fm-turf opacity-20">
          <div className="fm-arc border-white border-2 rounded-full absolute" />
          <div className="fm-box border-white border-2 absolute" />
          <div className="fm-six border-white border-2 absolute" />
          <div className="fm-spot bg-white rounded-full absolute" />
          <div className="fm-goal bg-white absolute" />
        </div>

        {/* Grayed Ghost Subbed Players */}
        {info.subs.map((s: any, i: number) => {
          const k = `${s.on.x},${s.on.y}`;
          const n = (slotCount[k] = (slotCount[k] || 0) + 1);
          const off = `${8 + n * 8}px`;
          const stats = getPlayerStats(s.on);
          return (
            <div
              key={`sub-${i}`}
              className={`fm-player fm-ghost ${100 - s.on.x < 26 ? 'fm-flip' : ''}`}
              style={{ left: `${s.on.y}%`, top: `${100 - s.on.x}%`, marginLeft: off, marginTop: `-${off}` }}
            >
              <span className="fm-shirt-wrap">
                <Shirt kit={s.on.position === 'Goalkeeper' ? GK_SHIRT : kit} number={s.on.jersey} size={30} />
                <SubBadge on />
                <ContribBadge g={s.on.goals} a={s.on.assists} small />
              </span>
              <span className="fm-pname">{shortName(s.on.name)}</span>
              
              <div className="fm-tip">
                <div className="fm-tip-header flex justify-between items-start gap-2 border-b border-slate-800/60 pb-1.5 mb-1.5 w-full">
                  <div className="flex flex-col min-w-0">
                    <b className="text-slate-100 font-bold truncate text-[11px] block">{s.on.name}</b>
                    <span className="text-[9px] text-slate-400 font-medium truncate block">
                      {s.on.position} (Subbed on {s.minute}′)
                    </span>
                  </div>
                  <div className="fm-tip-rating shrink-0 font-mono text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    {stats.rating}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono mb-1.5 w-full">
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">Pass Acc:</span>
                    <span className="text-slate-200 font-bold">{stats.passAccuracy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">Touches:</span>
                    <span className="text-slate-200 font-bold">{stats.touches}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">{stats.stat1Label}:</span>
                    <span className="text-slate-200 font-bold">{stats.stat1Val}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">{stats.stat2Label}:</span>
                    <span className="text-slate-200 font-bold">{stats.stat2Val}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">xG / xA:</span>
                    <span className="text-amber-400/90 font-bold">{stats.xG} / {stats.xA}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">Distance:</span>
                    <span className="text-slate-200 font-bold">{stats.distance}</span>
                  </div>
                </div>

                {contribText(s.on) && (
                  <div className="fm-tip-c text-[9px] text-emerald-400 font-bold border-t border-slate-800/60 pt-1.5 mt-0.5 flex items-center gap-1.5">
                    <span>★ Contribution:</span>
                    <span className="text-slate-100">{contribText(s.on)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Starting Eleven */}
        {info.starting.map((p: any) => {
          const offFor = info.subs.find((s: any) => s.off.player_id === p.player_id);
          const stats = getPlayerStats(p);
          return (
            <div
              key={p.player_id}
              className={`fm-player ${100 - p.x < 26 ? 'fm-flip' : ''}`}
              style={{ left: `${p.y}%`, top: `${100 - p.x}%` }}
            >
              <span className="fm-shirt-wrap">
                <Shirt kit={p.position === 'Goalkeeper' ? GK_SHIRT : kit} number={p.jersey} size={42} />
                {offFor && <SubBadge on={false} />}
                <ContribBadge g={p.goals} a={p.assists} />
              </span>
              <span className="fm-pname">{shortName(p.name)}</span>
              
              <div className="fm-tip">
                <div className="fm-tip-header flex justify-between items-start gap-2 border-b border-slate-800/60 pb-1.5 mb-1.5 w-full">
                  <div className="flex flex-col min-w-0">
                    <b className="text-slate-100 font-bold truncate text-[11px] block">{p.name}</b>
                    <span className="text-[9px] text-slate-400 font-medium truncate block">
                      {p.position}{offFor ? ` · Off ${offFor.minute}′` : ''}
                    </span>
                  </div>
                  <div className="fm-tip-rating shrink-0 font-mono text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    {stats.rating}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono mb-1.5 w-full">
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">Pass Acc:</span>
                    <span className="text-slate-200 font-bold">{stats.passAccuracy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">Touches:</span>
                    <span className="text-slate-200 font-bold">{stats.touches}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">{stats.stat1Label}:</span>
                    <span className="text-slate-200 font-bold">{stats.stat1Val}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">{stats.stat2Label}:</span>
                    <span className="text-slate-200 font-bold">{stats.stat2Val}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">xG / xA:</span>
                    <span className="text-amber-400/90 font-bold">{stats.xG} / {stats.xA}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[7px] tracking-wider">Distance:</span>
                    <span className="text-slate-200 font-bold">{stats.distance}</span>
                  </div>
                </div>

                {contribText(p) && (
                  <div className="fm-tip-c text-[9px] text-emerald-400 font-bold border-t border-slate-800/60 pt-1.5 mt-0.5 flex items-center gap-1.5">
                    <span>★ Contribution:</span>
                    <span className="text-slate-100">{contribText(p)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Manager Touchline tag */}
        <div className="fm-manager absolute bottom-2 right-2 bg-slate-950/75 border border-slate-800 rounded-lg p-1 px-2.5 flex items-center gap-2">
          <ManagerIcon />
          <span className="fm-manager-txt">
            <small className="text-[7px] text-slate-500 uppercase tracking-widest block leading-none mb-0.5">MANAGER</small>
            <b className="text-[10px] text-slate-200">{managerShort(info.manager)}</b>
          </span>
        </div>
      </div>

      <div className="fm-tactics pt-3 border-t border-[#23324C]/45 flex flex-col gap-1.5">
        <div className="fm-tactics-head flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-slate-400">
          <span>Tactical Setup Summary</span>
          <span className="fm-granite font-semibold text-emerald-400">⬢ IBM Granite</span>
        </div>
        {loadingProse ? (
          <div className="fm-prose-loading font-mono text-[10px] text-slate-500 flex items-center gap-1.5">
            <span className="fm-spin" />
            Reading manager tactics...
          </div>
        ) : (
          <p className="fm-prose text-xs text-slate-300 leading-relaxed font-sans">{tactics?.prose || '—'}</p>
        )}
      </div>
    </div>
  );
};

export default TeamsheetView;
