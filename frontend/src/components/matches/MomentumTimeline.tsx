import React, { useCallback, useEffect, useMemo, useRef } from 'react';

// Karun Singh's published Expected Threat (xT) surface: a 12x8 grid
const XT_GRID = [
  [0.00638303, 0.00779616, 0.00844854, 0.00977659, 0.01126267, 0.01248588, 0.01473348, 0.0174553, 0.02122129, 0.02756312, 0.03485072, 0.0379259],
  [0.00750072, 0.00878589, 0.00942382, 0.0105949, 0.01214719, 0.0138454, 0.01611813, 0.01870347, 0.02401521, 0.02953272, 0.04066992, 0.04647721],
  [0.0088799, 0.00977745, 0.01001304, 0.01110462, 0.01269174, 0.01429128, 0.01685596, 0.01935132, 0.0241224, 0.02855202, 0.05491138, 0.06442595],
  [0.00941056, 0.01082722, 0.01016549, 0.01132376, 0.01262646, 0.01484598, 0.01689528, 0.0199707, 0.02385149, 0.03511326, 0.10805102, 0.25745362],
  [0.00941056, 0.01082722, 0.01016549, 0.01132376, 0.01262646, 0.01484598, 0.01689528, 0.0199707, 0.02385149, 0.03511326, 0.10805102, 0.25745362],
  [0.0088799, 0.00977745, 0.01001304, 0.01110462, 0.01269174, 0.01429128, 0.01685596, 0.01935132, 0.0241224, 0.02855202, 0.05491138, 0.06442595],
  [0.00750072, 0.00878589, 0.00942382, 0.0105949, 0.01214719, 0.0138454, 0.01611813, 0.01870347, 0.02401521, 0.02953272, 0.04066992, 0.04647721],
  [0.00638303, 0.00779616, 0.00844854, 0.00977659, 0.01126267, 0.01248588, 0.01473348, 0.0174553, 0.02122129, 0.02756312, 0.03485072, 0.0379259],
];

// Map location standard to xT
function xtAt(loc: any): number {
  if (!Array.isArray(loc)) return 0;
  const x = loc[0], z = loc[1];
  if (typeof x !== 'number' || typeof z !== 'number') return 0;
  // Convert standard pitch back to StatsBomb coordinates to index the grid
  const x_sb = ((x + 52.5) / 105) * 120;
  const y_sb = ((z + 34) / 68) * 80;
  const col = Math.max(0, Math.min(11, Math.floor((x_sb / 120) * 12)));
  const row = Math.max(0, Math.min(7, Math.floor((y_sb / 80) * 8)));
  return XT_GRID[row][col];
}

const XG_CAP = 0.35;
const XT_FLOOR = 0.02;

function locThreat(loc: any): number {
  return Math.max(0, xtAt(loc) - XT_FLOOR);
}

function eventThreat(ev: any): number {
  const t = ev.type;
  if (t === 'Shot') {
    const xg = typeof ev.xg === 'number' ? ev.xg : 0.05;
    return locThreat(ev.location) + Math.min(xg, XG_CAP);
  }
  if (t === 'Carry') return locThreat(ev.location);
  if ((t === 'Pass' || t === 'Dribble') && ev.outcome === 'Complete') {
    return locThreat(ev.location);
  }
  return 0;
}

const CHART_H = 100; // Height of chart canvas in CSS px
const MARK_TOP = 16;
const MARK_BOT = 16;
const PAD_X = 8;
const GAP = 8;

const PERIODS = [
  { period: 1, label: '1st Half' },
  { period: 2, label: '2nd Half' },
  { period: 3, label: 'ET 1' },
  { period: 4, label: 'ET 2' },
];

function layout(segments: any[], w: number): any[] {
  const totalSpan = segments.reduce((a, s) => a + s.span, 0) || 1;
  const nGaps = Math.max(0, segments.length - 1);
  const usableW = w - PAD_X * 2 - GAP * nGaps;
  let cursorX = PAD_X;
  return segments.map(s => {
    const segW = (s.span / totalSpan) * usableW;
    const g = { seg: s, x0: cursorX, w: segW };
    cursorX += segW + GAP;
    return g;
  });
}

function xForEvent(geom: any[], period: number, minute: number): number | null {
  const g = geom.find(x => x.seg.period === period);
  if (!g) return null;
  const { minMin, span } = g.seg;
  const idx = Math.max(0, Math.min(span - 1, minute - minMin));
  return g.x0 + (idx + 0.5) * (g.w / span);
}

interface MomentumTimelineProps {
  events: any[];
  match: any | null;
  activeEvent: any | null;
  onSelect: (ev: any) => void;
}

const MomentumTimeline: React.FC<MomentumTimelineProps> = ({ events, match, activeEvent, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const model = useMemo(() => {
    if (!match || events.length === 0) return null;
    const goals: any[] = [];
    const cards: any[] = [];
    const segments: any[] = [];

    for (const P of PERIODS) {
      const evs = events.filter(e => (e.period ?? 1) === P.period);
      if (evs.length === 0) continue;
      const minMin = Math.min(...evs.map(e => e.minute));
      const maxMin = Math.max(...evs.map(e => e.minute));
      const span = maxMin - minMin + 1;
      const home = new Array(span).fill(0);
      const away = new Array(span).fill(0);

      for (const ev of evs) {
        const isHome = ev.team === match.home_team;
        const idx = ev.minute - minMin;
        const t = eventThreat(ev);
        if (isHome) home[idx] += t;
        else away[idx] += t;

        if (ev.type === 'Shot' && ev.outcome === 'Goal') {
          goals.push({ period: P.period, minute: ev.minute, home: isHome, ev });
        }
        if (ev.card && (ev.card.includes('Red') || ev.card.includes('Second Yellow'))) {
          cards.push({ period: P.period, minute: ev.minute, home: isHome, card: ev.card });
        }
      }

      const net = home.map((h, i) => h - away[i]);
      const smoothed = net.map((_, i) => {
        const l = net[i - 1] ?? 0;
        const r = net[i + 1] ?? 0;
        return l * 0.25 + net[i] * 0.5 + r * 0.25;
      });

      segments.push({ ...P, minMin, maxMin, span, net: smoothed });
    }

    if (segments.length === 0) return null;

    const mags = segments
      .flatMap(s => s.net.map(Math.abs))
      .filter(v => v > 1e-9)
      .sort((a, b) => a - b);
    const peak = mags.length ? Math.max(mags[Math.floor(mags.length * 0.92)], 1e-6) : 1;
    return { segments, peak, goals, cards };
  }, [events, match]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    canvas.width = w * dpr;
    canvas.height = CHART_H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, CHART_H);

    const midY = CHART_H / 2;

    if (!model) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Select a match to view timeline...', w / 2, midY + 3);
      return;
    }

    const { segments, peak, goals, cards } = model;
    const geom = layout(segments, w);
    const blockTop = MARK_TOP;
    const blockBot = CHART_H - MARK_BOT;
    const halfArea = (blockBot - blockTop) / 2 - 2;

    for (const g of geom) {
      const { seg } = g;
      // Home (above, blue-accent) / Away (below, red-accent) fill zones
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(g.x0, blockTop, g.w, midY - blockTop);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(g.x0, midY, g.w, blockBot - midY);

      // Faint border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.x0, blockTop + 0.5);
      ctx.lineTo(g.x0 + g.w, blockTop + 0.5);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeRect(g.x0 + 0.5, blockTop + 0.5, g.w - 1, blockBot - blockTop - 1);

      // Center divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(g.x0, midY);
      ctx.lineTo(g.x0 + g.w, midY);
      ctx.stroke();

      // Period name
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '9px font-sans';
      ctx.textAlign = 'center';
      ctx.fillText(seg.label, g.x0 + g.w / 2, blockTop + 10);

      // Build continuous curve points
      const cellW = g.w / seg.span;
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < seg.span; i++) {
        const r = Math.min(1, Math.abs(seg.net[i]) / peak);
        const h = Math.sign(seg.net[i]) * Math.pow(r, 0.75) * halfArea;
        const x = seg.span === 1 ? g.x0 + g.w / 2 : g.x0 + (i + 0.5) * cellW;
        pts.push({ x, y: midY - h });
      }
      pts.unshift({ x: g.x0, y: pts[0]?.y || midY });
      pts.push({ x: g.x0 + g.w, y: pts[pts.length - 1]?.y || midY });

      // Trace line path
      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      };

      const area = () => {
        trace();
        ctx.lineTo(g.x0 + g.w, midY);
        ctx.lineTo(g.x0, midY);
        ctx.closePath();
      };

      const paint = (top: number, h: number, fill: string, stroke: string) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(g.x0, top, g.w, h);
        ctx.clip();
        area();
        ctx.fillStyle = fill;
        ctx.fill();
        trace();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = stroke;
        ctx.stroke();
        ctx.restore();
      };

      paint(blockTop, midY - blockTop, 'rgba(56, 189, 248, 0.35)', 'rgba(56, 189, 248, 0.9)');
      paint(midY, blockBot - midY, 'rgba(239, 68, 68, 0.35)', 'rgba(239, 68, 68, 0.9)');
    }

    // Active event vertical yellow line
    if (activeEvent) {
      const x = xForEvent(geom, activeEvent.period ?? 1, activeEvent.minute);
      if (x !== null) {
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x, blockTop - 2);
        ctx.lineTo(x, blockBot + 2);
        ctx.stroke();
      }
    }

    // Red cards
    ctx.fillStyle = '#EF4444';
    for (const card of cards) {
      const x = xForEvent(geom, card.period, card.minute);
      if (x === null) continue;
      const y = card.home ? blockTop - 6 : blockBot + 2;
      ctx.fillRect(x - 2.5, y, 5, 4);
    }

    // Goal ball indicators
    const BALL_RADIUS = 5;
    for (const goal of goals) {
      const x = xForEvent(geom, goal.period, goal.minute);
      if (x === null) continue;
      const gy = goal.home ? blockTop - 6 : blockBot + 6;

      // Dashed drop line to mid-axis
      ctx.save();
      ctx.strokeStyle = goal.home ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, midY);
      ctx.stroke();
      ctx.restore();

      // Small soccer ball circle representation
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, gy, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Goal text label
      const label = `${goal.minute + 1}'`;
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = goal.home ? '#56BDF8' : '#F87171';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, goal.home ? gy - 7 : gy + 11);
    }
  }, [model, activeEvent]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!model || events.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const geom = layout(model.segments, rect.width);

    // Snap to goal click
    let goalHit = null, goalDx = 12;
    for (const g of model.goals) {
      if (!g.ev) continue;
      const gx = xForEvent(geom, g.period, g.minute);
      if (gx === null) continue;
      const dx = Math.abs(gx - clickX);
      if (dx < goalDx) {
        goalDx = dx;
        goalHit = g.ev;
      }
    }
    if (goalHit) {
      onSelect(goalHit);
      return;
    }

    let g = geom.find(x => clickX >= x.x0 && clickX <= x.x0 + x.w);
    if (!g) {
      let bestD = Infinity;
      for (const x of geom) {
        const d = clickX < x.x0 ? x.x0 - clickX : clickX - (x.x0 + x.w);
        if (d < bestD) {
          bestD = d;
          g = x;
        }
      }
    }
    if (!g) return;
    const seg = g.seg;
    const frac = Math.max(0, Math.min(1, (clickX - g.x0) / g.w));
    const clickedMin = seg.minMin + Math.round(frac * (seg.span - 1));

    const favorsHome = (seg.net[clickedMin - seg.minMin] ?? 0) >= 0;
    const dominant = favorsHome ? match?.home_team : match?.away_team;

    const pickIn = (lo: number, hi: number, team: string | null) => {
      let pick = null, pickScore = -Infinity;
      for (const ev of events) {
        if ((ev.period ?? 1) !== seg.period) continue;
        if (ev.minute < lo || ev.minute > hi) continue;
        if (team && ev.team !== team) continue;
        const s = xtAt(ev.location) + (ev.type === 'Shot' ? 0.5 : 0);
        if (s > pickScore) {
          pickScore = s;
          pick = ev;
        }
      }
      return pick;
    };

    let best = pickIn(clickedMin, clickedMin, dominant)
      || pickIn(clickedMin - 1, clickedMin + 1, dominant)
      || pickIn(clickedMin - 1, clickedMin + 1, null);

    if (!best) {
      let bestScore = Infinity;
      for (const ev of events) {
        if ((ev.period ?? 1) !== seg.period) continue;
        const d = Math.abs(ev.minute + (ev.second || 0) / 60 - clickedMin);
        const score = d - (ev.type === 'Shot' ? 0.3 : 0);
        if (score < bestScore) {
          bestScore = score;
          best = ev;
        }
      }
    }
    if (best) onSelect(best);
  }, [model, events, onSelect, match]);

  return (
    <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 font-mono text-[10px]">
        <span className="font-bold text-slate-300 uppercase tracking-widest">Match Momentum</span>
        {match && (
          <span className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-sm bg-sky-400/80" />
              {match.home_team}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-sm bg-rose-400/80" />
              {match.away_team}
            </span>
          </span>
        )}
      </div>
      <div className="w-full relative" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="w-full block cursor-pointer"
          style={{ height: CHART_H }}
          onClick={onClick}
        />
      </div>
    </div>
  );
};

export default MomentumTimeline;
