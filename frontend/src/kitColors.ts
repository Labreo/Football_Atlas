// World Cup 2022 kit colors — all 32 nations.
// primary = disc fill, secondary = border ring, number = jersey number color.
export interface Kit {
  primary: string;
  secondary: string;
  number: string;
}

export const KIT_COLORS: Record<string, Kit> = {
  'Argentina':      { primary: '#75aadb', secondary: '#ffffff', number: '#1a3a6e' },
  'France':         { primary: '#002395', secondary: '#ffffff', number: '#ffffff' },
  'Brazil':         { primary: '#f7d000', secondary: '#009c3b', number: '#002776' },
  'England':        { primary: '#ffffff', secondary: '#ff0000', number: '#002366' },
  'Germany':        { primary: '#ffffff', secondary: '#000000', number: '#000000' },
  'Spain':          { primary: '#c60b1e', secondary: '#ffc400', number: '#ffc400' },
  'Portugal':       { primary: '#006600', secondary: '#ff0000', number: '#ffffff' },
  'Netherlands':    { primary: '#ff6600', secondary: '#ffffff', number: '#003087' },
  'Croatia':        { primary: '#cc1c2f', secondary: '#ffffff', number: '#ffffff' },
  'Morocco':        { primary: '#cc0001', secondary: '#006233', number: '#ffffff' },
  'Japan':          { primary: '#000080', secondary: '#ffffff', number: '#ffffff' },
  'South Korea':    { primary: '#ce1126', secondary: '#ffffff', number: '#ffffff' },
  'Qatar':          { primary: '#8a1538', secondary: '#ffffff', number: '#ffffff' },
  'Ecuador':        { primary: '#ffdd00', secondary: '#003893', number: '#003893' },
  'Senegal':        { primary: '#ffffff', secondary: '#00853f', number: '#00853f' },
  'Iran':           { primary: '#ffffff', secondary: '#da0000', number: '#239f40' },
  'United States':  { primary: '#ffffff', secondary: '#bf0d3e', number: '#1f2c5c' },
  'Wales':          { primary: '#d00027', secondary: '#ffffff', number: '#ffffff' },
  'Saudi Arabia':   { primary: '#006c35', secondary: '#ffffff', number: '#ffffff' },
  'Mexico':         { primary: '#006847', secondary: '#ffffff', number: '#ffffff' },
  'Poland':         { primary: '#ffffff', secondary: '#dc143c', number: '#dc143c' },
  'Australia':      { primary: '#ffcd00', secondary: '#00843d', number: '#00843d' },
  'Denmark':        { primary: '#c8102e', secondary: '#ffffff', number: '#ffffff' },
  'Tunisia':        { primary: '#ffffff', secondary: '#e70013', number: '#e70013' },
  'Costa Rica':     { primary: '#da291c', secondary: '#ffffff', number: '#ffffff' },
  'Belgium':        { primary: '#e30613', secondary: '#fdda24', number: '#fdda24' },
  'Canada':         { primary: '#c8102e', secondary: '#ffffff', number: '#ffffff' },
  'Serbia':         { primary: '#c6363c', secondary: '#ffffff', number: '#ffffff' },
  'Switzerland':    { primary: '#d52b1e', secondary: '#ffffff', number: '#ffffff' },
  'Cameroon':       { primary: '#007a5e', secondary: '#ce1126', number: '#fcd116' },
  'Ghana':          { primary: '#ffffff', secondary: '#ce1126', number: '#006b3f' },
  'Uruguay':        { primary: '#7bb1dc', secondary: '#000000', number: '#000000' },
};

// Goalkeepers wear a distinct kit — cyan disc, team-colored ring.
export const GK_KIT = { primary: '#00bcd4', secondary: '#04222b', number: '#04222b' };

const DEFAULT_KIT = { primary: '#8899aa', secondary: '#ffffff', number: '#10141c' };

export function getKit(teamName: string): Kit {
  return KIT_COLORS[teamName] || DEFAULT_KIT;
}

// kit-clash resolution (so e.g. USA vs Iran aren't both white)
function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16)
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; // 0..1
}

function colorDist(a: string, b: string): number {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); // 0..441
}

function numberColorFor(bg: string): string {
  return luminance(bg) > 0.55 ? '#10131a' : '#ffffff';
}

// Two shirts clash if they are near-identical, or both pale, or both dark
function kitsClash(a: string, b: string): boolean {
  const d = colorDist(a, b);
  if (d < 95) return true;
  const la = luminance(a);
  const lb = luminance(b);
  if (la > 0.6 && lb > 0.6 && d < 190) return true; // pale vs pale
  if (la < 0.2 && lb < 0.2 && d < 150) return true; // dark vs dark
  return false;
}

// Build alternate kit for away team
function alternateKit(kit: Kit, homePrimary: string): Kit {
  for (const c of [kit.secondary, kit.number]) {
    if (c && colorDist(c, homePrimary) > 110 && colorDist(c, kit.primary) > 50) {
      return { primary: c, secondary: kit.primary, number: numberColorFor(c) };
    }
  }
  return luminance(homePrimary) > 0.5
    ? { primary: '#16223f', secondary: '#ffffff', number: '#ffffff' } // dark alternate
    : { primary: '#ededed', secondary: '#222831', number: '#161b29' }; // light alternate
}

export function resolveKits(homeTeam: string, awayTeam: string): Record<string, Kit> {
  const home = getKit(homeTeam);
  let away = getKit(awayTeam);
  if (kitsClash(home.primary, away.primary)) {
    away = alternateKit(away, home.primary);
  }
  return { [homeTeam]: home, [awayTeam]: away };
}

// Event type accent colors
export const EVENT_COLORS: Record<string, string> = {
  Shot: '#f0a500',
  Pass: '#4a9eff',
  Dribble: '#a78bfa',
  Carry: '#a78bfa',
  Pressure: '#ff4d6a',
  Interception: '#00e5a0',
  Clearance: '#6e85a8',
  Block: '#6e85a8',
  'Goal Keeper': '#00bcd4',
  'Bad Behaviour': '#ffd24d',
  'Foul Committed': '#ffd24d',
};

export function eventColor(type: string): string {
  return EVENT_COLORS[type] || '#6e85a8';
}

function isFailedInterception(ev: any): boolean {
  return ev && ev.type === 'Interception' &&
    ['Lost', 'Lost In Play', 'Lost Out'].includes(ev.outcome);
}

export function eventLabel(ev: any): string {
  if (!ev) return '';
  if (isFailedInterception(ev)) return 'Lost Duel';
  return ev.type;
}

export function eventColorOf(ev: any): string {
  if (isFailedInterception(ev)) return '#ff6b81'; // negative
  return eventColor(ev?.type);
}
