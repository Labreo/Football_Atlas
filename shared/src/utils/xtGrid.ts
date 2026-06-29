// Expected Threat (xT) grid and scoring utility
// Based on Karun Singh's 12x8 xT surface representing absolute goal probability.
// Coordinates are mapped from standard pitch dimensions (105x68, centered at 0,0) to StatsBomb coordinates (120x80, origin top-left).

export const XT_GRID = [
  [0.00638303, 0.00779616, 0.00844854, 0.00977659, 0.01126267, 0.01248588, 0.01473348, 0.0174553, 0.02122129, 0.02756312, 0.03485072, 0.0379259],
  [0.00750072, 0.00878589, 0.00942382, 0.0105949, 0.01214719, 0.0138454, 0.01611813, 0.01870347, 0.02401521, 0.02953272, 0.04066992, 0.04647721],
  [0.0088799, 0.00977745, 0.01001304, 0.01110462, 0.01269174, 0.01429128, 0.01685596, 0.01935132, 0.0241224, 0.02855202, 0.05491138, 0.06442595],
  [0.00941056, 0.01082722, 0.01016549, 0.01132376, 0.01262646, 0.01484598, 0.01689528, 0.0199707, 0.02385149, 0.03511326, 0.10805102, 0.25745362],
  [0.00941056, 0.01082722, 0.01016549, 0.01132376, 0.01262646, 0.01484598, 0.01689528, 0.0199707, 0.02385149, 0.03511326, 0.10805102, 0.25745362],
  [0.0088799, 0.00977745, 0.01001304, 0.01110462, 0.01269174, 0.01429128, 0.01685596, 0.01935132, 0.0241224, 0.02855202, 0.05491138, 0.06442595],
  [0.00750072, 0.00878589, 0.00942382, 0.0105949, 0.01214719, 0.0138454, 0.01611813, 0.01870347, 0.02401521, 0.02953272, 0.04066992, 0.04647721],
  [0.00638303, 0.00779616, 0.00844854, 0.00977659, 0.01126267, 0.01248588, 0.01473348, 0.0174553, 0.02122129, 0.02756312, 0.03485072, 0.0379259]
];

/**
 * Maps standard pitch coordinates (x in [-52.5, 52.5], z in [-34, 34])
 * to StatsBomb grid coordinates (x in [0, 120], y in [0, 80]).
 */
export function pitchToStatsBomb(x: number, z: number): { x_sb: number; y_sb: number } {
  const x_sb = ((x + 52.5) / 105) * 120;
  const y_sb = ((z + 34) / 68) * 80;
  return { x_sb, y_sb };
}

/**
 * Returns Expected Threat (xT) value at standard pitch coordinates.
 */
export function getXTAt(x: number, z: number): number {
  const { x_sb, y_sb } = pitchToStatsBomb(x, z);
  const col = Math.max(0, Math.min(11, Math.floor((x_sb / 120) * 12)));
  const row = Math.max(0, Math.min(7, Math.floor((y_sb / 80) * 8)));
  return XT_GRID[row][col];
}

/**
 * Calculates distance from a point to a line segment.
 */
function distToSegment(px: number, pz: number, sx: number, sz: number, ex: number, ez: number): number {
  const dx = ex - sx;
  const dz = ez - sz;
  const l2 = dx * dx + dz * dz;
  if (l2 === 0) return Math.sqrt((px - sx) ** 2 + (pz - sz) ** 2);
  let t = ((px - sx) * dx + (pz - sz) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((px - (sx + t * dx)) ** 2 + (pz - (sz + t * dz)) ** 2);
}

/**
 * Estimates Expected Goals (xG) for a shot from origin standard coordinates.
 */
export function getXGEstimate(
  originX: number,
  originZ: number,
  opponents: Array<{ x: number; z: number }> = []
): number {
  const goalX = 52.5;
  const goalZ = 0;
  const dx = goalX - originX;
  const dz = goalZ - originZ;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // If too far out, no real threat
  if (dist > 32) return 0.0;

  // Angle the goalmouth subtends (posts at z=-3.66 and z=3.66)
  const a1 = Math.atan2(-3.66 - originZ, goalX - originX);
  const a2 = Math.atan2(3.66 - originZ, goalX - originX);
  const angle = Math.abs(a2 - a1);

  // Base expectation from distance & angle
  const base = Math.exp(-0.085 * dist) * (angle / 0.7);

  // Knockdown based on opponents in the shooting cone
  const inCone = opponents.filter((opp) => distToSegment(opp.x, opp.z, originX, originZ, goalX, goalZ) < 2.0).length;
  const xg = base * Math.max(0.2, 1.0 - 0.25 * inCone);

  // Clamp and round
  return Math.round(Math.max(0.0, Math.min(0.9, xg)) * 1000) / 1000;
}
