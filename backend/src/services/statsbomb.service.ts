import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';

const COMPETITION_ID = 43; // World Cup
const SEASON_ID = 106;     // 2022
const CACHE_DIR = path.resolve(__dirname, '../../.statsbomb_cache');

// Ensure cache directories exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// On-ball event types to surface
const ON_BALL_TYPES = new Set([
  'Pass', 'Shot', 'Dribble', 'Carry', 'Interception',
  'Clearance', 'Block', 'Bad Behaviour', 'Goal Keeper', 'Foul Committed', 'Foul Won', 'Duel', 'Offside'
]);

const LOST_INTERCEPTION = new Set(['Lost', 'Lost In Play', 'Lost Out']);

// Name overrides for truncated StatsBomb nicknames
const NAME_OVERRIDES: Record<string, string> = {
  'Randal Kolo': 'Randal Kolo Muani',
};

// Mappings from StatsBomb position name to (x, y) on a 0-100 formation grid
const POSITION_XY: Record<string, [number, number]> = {
  'Goalkeeper': [8, 50],
  'Right Back': [27, 85], 'Right Center Back': [26, 63], 'Center Back': [25, 50],
  'Left Center Back': [26, 37], 'Left Back': [27, 15],
  'Right Wing Back': [33, 88], 'Left Wing Back': [33, 12],
  'Right Defensive Midfield': [44, 63], 'Center Defensive Midfield': [44, 50],
  'Left Defensive Midfield': [44, 37],
  'Right Midfield': [57, 85], 'Right Center Midfield': [56, 63], 'Center Midfield': [56, 50],
  'Left Center Midfield': [56, 37], 'Left Midfield': [57, 15],
  'Right Attacking Midfield': [68, 66], 'Center Attacking Midfield': [68, 50],
  'Left Attacking Midfield': [68, 34],
  'Right Wing': [79, 83], 'Left Wing': [79, 17],
  'Right Center Forward': [85, 60], 'Striker': [88, 50], 'Center Forward': [88, 50],
  'Left Center Forward': [85, 40], 'Secondary Striker': [74, 50],
};

export class StatsBombService {
  /**
   * Helper to fetch data with a local disk cache fallback
   */
  private async fetchCachedJson<T>(url: string, relativeCachePath: string): Promise<T> {
    const cachePath = path.join(CACHE_DIR, relativeCachePath);
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(cachePath)) {
      try {
        const data = fs.readFileSync(cachePath, 'utf8');
        return JSON.parse(data) as T;
      } catch (err) {
        Logger.warn(`Failed to read cache at ${relativeCachePath}, re-fetching`, err as any);
      }
    }

    Logger.info(`Fetching StatsBomb data from GitHub: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from StatsBomb Open Data: ${response.statusText} (${response.status})`);
    }

    const json = await response.json();
    fs.writeFileSync(cachePath, JSON.stringify(json, null, 2), 'utf8');
    return json as T;
  }

  // Coordinate Conversion Helpers
  // Standard Pitch3D boundaries: X in [-52.5, 52.5], Z in [-34, 34]
  // StatsBomb boundaries: X in [0, 120], Y in [0, 80]
  public sbToPitchX(x_sb: number): number {
    return (x_sb / 120) * 105 - 52.5;
  }

  public sbToPitchZ(y_sb: number): number {
    return (y_sb / 80) * 68 - 34;
  }

  public pitchToSbX(x: number): number {
    return ((x + 52.5) / 105) * 120;
  }

  public pitchToSbZ(z: number): number {
    return ((z + 34) / 68) * 80;
  }

  private dist(a: [number, number], b: [number, number]): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  /**
   * List matches for competition 43, season 106
   */
  public async getMatches(): Promise<any[]> {
    const url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/${this.COMPITION_ID_URL_REPLACE_HELPER()}/${this.SEASON_ID_URL_REPLACE_HELPER()}.json`;
    const rawMatches = await this.fetchCachedJson<any[]>(url, `matches_${this.COMPITION_ID_URL_REPLACE_HELPER()}_${this.SEASON_ID_URL_REPLACE_HELPER()}.json`);
    
    // Sort chronologically
    const list = rawMatches.map((m: any) => ({
      match_id: m.match_id,
      match_date: m.match_date,
      kick_off: m.kick_off,
      stage: m.competition_stage?.name || m.competition_stage,
      home_team: m.home_team.home_team_name,
      away_team: m.away_team.away_team_name,
      home_score: m.home_score,
      away_score: m.away_score,
      stadium: m.stadium?.name,
      referee: m.referee?.name,
      home_manager: m.home_team.managers?.[0]?.name,
      away_manager: m.away_team.managers?.[0]?.name,
    }));
    return list.sort((a: any, b: any) => {
      const d1 = new Date(`${a.match_date}T${a.kick_off}`);
      const d2 = new Date(`${b.match_date}T${b.kick_off}`);
      return d1.getTime() - d2.getTime();
    });
  }

  private COMPITION_ID_URL_REPLACE_HELPER(): string {
    return String(COMPETITION_ID);
  }

  private SEASON_ID_URL_REPLACE_HELPER(): string {
    return String(SEASON_ID);
  }

  /**
   * Get raw lineups JSON
   */
  public async getRawLineups(matchId: number): Promise<any[]> {
    const url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/lineups/${matchId}.json`;
    return this.fetchCachedJson<any[]>(url, `lineups/lineups_${matchId}.json`);
  }

  /**
   * Get raw events JSON
   */
  public async getRawEvents(matchId: number): Promise<any[]> {
    const url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/${matchId}.json`;
    const events = await this.fetchCachedJson<any[]>(url, `events/events_${matchId}.json`);
    return events.sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
  }

  /**
   * Get 360-freeze frames mapped by event uuid
   */
  public async getFramesMap(matchId: number): Promise<Record<string, any>> {
    const url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/three-sixty/${matchId}.json`;
    const framesList = await this.fetchCachedJson<any[]>(url, `three_sixty/frames_${matchId}.json`);
    const map: Record<string, any> = {};
    for (const f of framesList) {
      if (f.event_uuid) {
        map[f.event_uuid] = {
          freeze_frame: f.freeze_frame || [],
          visible_area: f.visible_area || null
        };
      }
    }
    return map;
  }

  /**
   * Simplify outcome descriptions
   */
  private getEventOutcome(ev: any): string | null {
    const t = ev.type?.name;
    if (t === 'Pass') {
      const out = ev.pass?.outcome?.name;
      return out || 'Complete';
    }
    if (t === 'Shot') {
      return ev.shot?.outcome?.name || null;
    }
    if (t === 'Dribble') {
      return ev.dribble?.outcome?.name || null;
    }
    if (t === 'Interception') {
      return ev.interception?.outcome?.name || null;
    }
    if (t === 'Goal Keeper') {
      return ev.goalkeeper?.outcome?.name || ev.goalkeeper?.type?.name || null;
    }
    return null;
  }

  private getEventCard(ev: any): string | null {
    for (const key of ['bad_behaviour', 'foul_committed']) {
      const card = ev[key]?.card?.name;
      if (card) return card;
    }
    return null;
  }

  private getEventEndLocation(ev: any): [number, number] | [number, number, number] | null {
    const t = ev.type?.name;
    if (t === 'Pass') {
      return ev.pass?.end_location || null;
    }
    if (t === 'Shot') {
      return ev.shot?.end_location || null;
    }
    if (t === 'Carry') {
      return ev.carry?.end_location || null;
    }
    return null;
  }

  private getPlayerNickname(namesIndex: Record<number, any>, playerId: number, fullName: string): string {
    const info = namesIndex[playerId];
    let name = info?.player_name || fullName;
    if (NAME_OVERRIDES[name]) {
      name = NAME_OVERRIDES[name];
    }
    return name;
  }

  /**
   * Builds player details database from lineups JSON
   */
  public async getPlayerIndex(matchId: number): Promise<Record<number, any>> {
    const lineups = await this.getRawLineups(matchId);
    const index: Record<number, any> = {};
    for (const teamLineup of lineups) {
      for (const p of teamLineup.lineup) {
        index[p.player_id] = {
          player_id: p.player_id,
          player_name: p.player_nickname || p.player_name,
          jersey_number: p.jersey_number,
        };
      }
    }
    return index;
  }

  /**
   * Create standard event summaries for lists/timelines
   */
  public simplifyEvent(ev: any, framesMap: Record<string, any>, playerIdx: Record<number, any>): any {
    const t = ev.type?.name;
    const shot = ev.shot || {};
    const pid = ev.player?.id;
    const player_name = pid ? this.getPlayerNickname(playerIdx, pid, ev.player.name) : null;
    const outcome = this.getEventOutcome(ev);

    // Coordinate transformations
    const loc = ev.location ? [this.sbToPitchX(ev.location[0]), this.sbToPitchZ(ev.location[1])] : null;
    const rawEnd = this.getEventEndLocation(ev);
    const endLoc = rawEnd ? [this.sbToPitchX(rawEnd[0]), this.sbToPitchZ(rawEnd[1])] : null;

    const setPiece = t === 'Shot' ? shot.type?.name : ev.pass?.type?.name || null;

    return {
      id: ev.id,
      index: ev.index,
      minute: ev.minute,
      second: ev.second,
      period: ev.period,
      type: t,
      player: player_name,
      player_id: pid || null,
      jersey_number: pid ? playerIdx[pid]?.jersey_number : null,
      team: ev.team?.name,
      possession: ev.possession,
      possession_team: ev.possession_team?.name,
      location: loc,
      end_location: endLoc,
      outcome: outcome,
      under_pressure: !!ev.under_pressure,
      xg: shot.statsbomb_xg || null,
      shot_type: shot.type?.name || null,
      set_piece: setPiece,
      goal_assist: !!ev.pass?.goal_assist,
      shot_assist: !!ev.pass?.shot_assist,
      pass_technique: ev.pass?.technique?.name || null,
      card: this.getEventCard(ev),
      has_shot_freeze_frame: !!shot.freeze_frame,
      has_360: !!(framesMap && framesMap[ev.id]),
      pass_cross: !!ev.pass?.cross,
      pass_length: ev.pass?.length || null,
    };
  }

  /**
   * List play-by-play events for a match
   */
  public async listEvents(matchId: number): Promise<any[]> {
    const rawEvents = await this.getRawEvents(matchId);
    const framesMap = await this.getFramesMap(matchId);
    const playerIdx = await this.getPlayerIndex(matchId);

    const out: any[] = [];
    for (const ev of rawEvents) {
      const t = ev.type?.name;
      if (ON_BALL_TYPES.has(t) || (t === 'Foul Committed' && this.getEventCard(ev))) {
        if (!ev.location) continue;
        const outcome = this.getEventOutcome(ev);
        if (t === 'Interception' && outcome && LOST_INTERCEPTION.has(outcome)) {
          continue; // Filter out negative/lost duels
        }
        out.push(this.simplifyEvent(ev, framesMap, playerIdx));
      }
    }
    return out;
  }

  /**
   * Assemble starting lineups, substitutions, managers
   */
  public async getTeamsheet(matchId: number): Promise<any> {
    const rawEvents = await this.getRawEvents(matchId);
    const playerIdx = await this.getPlayerIndex(matchId);
    const matches = await this.getMatches();
    const match = matches.find((m: any) => m.match_id === matchId) || {};
    
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const managers: Record<string, string> = {
      [homeTeam]: match.home_manager,
      [awayTeam]: match.away_manager,
    };

    // Goals and assists talleys (excluding penalty shootouts, period 5)
    const goals: Record<number, number> = {};
    const assists: Record<number, number> = {};
    let soHome = 0, soAway = 0;

    for (const ev of rawEvents) {
      if (ev.period === 5) {
        if (ev.type?.name === 'Shot' && ev.shot?.outcome?.name === 'Goal') {
          if (ev.team?.name === homeTeam) soHome++;
          else soAway++;
        }
        continue;
      }
      const pid = ev.player?.id;
      if (!pid) continue;
      if (ev.type?.name === 'Shot' && ev.shot?.outcome?.name === 'Goal') {
        goals[pid] = (goals[pid] || 0) + 1;
      } else if (ev.type?.name === 'Pass' && ev.pass?.goal_assist) {
        assists[pid] = (assists[pid] || 0) + 1;
      }
    }

    const teams: Record<string, any> = {};
    for (const ev of rawEvents) {
      const t = ev.type?.name;
      const team = ev.team?.name;
      if (t === 'Starting XI') {
        const tac = ev.tactics || {};
        const starting: any[] = [];
        const coords = this.getFormationCoords(tac.formation, tac.lineup || []);

        for (const p of tac.lineup || []) {
          const pid = p.player.id;
          const pos = p.position.name;
          const [x, y] = coords[pid] || [50, 50];
          starting.push({
            player_id: pid,
            name: this.getPlayerNickname(playerIdx, pid, p.player.name),
            jersey: p.jersey_number,
            position: pos,
            x,
            y,
            goals: goals[pid] || 0,
            assists: assists[pid] || 0,
          });
        }

        teams[team] = {
          formation: this.formatFormation(tac.formation),
          manager: managers[team],
          starting,
          subs: []
        };
      } else if (t === 'Substitution' && teams[team]) {
        const offId = ev.player?.id;
        const repl = ev.substitution?.replacement;
        const onId = repl?.id;
        if (!onId) continue;

        // Trace slot inherited by incoming sub
        let slot = teams[team].starting.find((s: any) => s.player_id === offId);
        if (!slot) {
          slot = teams[team].subs.find((s: any) => s.on.player_id === offId)?.on;
        }

        const [x, y] = slot ? [slot.x, slot.y] : [50, 50];
        const pos = slot ? slot.position : null;

        teams[team].subs.push({
          minute: ev.minute,
          off: {
            player_id: offId,
            name: this.getPlayerNickname(playerIdx, offId, ev.player.name),
            jersey: playerIdx[offId]?.jersey_number
          },
          on: {
            player_id: onId,
            name: this.getPlayerNickname(playerIdx, onId, repl.name),
            jersey: playerIdx[onId]?.jersey_number,
            position: pos,
            x,
            y,
            goals: goals[onId] || 0,
            assists: assists[onId] || 0
          }
        });
      }
    }

    return {
      home_team: homeTeam,
      away_team: awayTeam,
      result: {
        home_score: match.home_score,
        away_score: match.away_score,
        shootout: (soHome || soAway) ? { home: soHome, away: soAway } : null
      },
      teams
    };
  }

  private formatFormation(f: any): string | null {
    if (!f) return null;
    return String(f).split('').join('-');
  }

  private getFormationCoords(formation: any, lineup: any[]): Record<number, [number, number]> {
    const digits = formation ? String(formation).split('').map(Number) : [];
    if (digits.length === 0 || lineup.length === 0) {
      const coords: Record<number, [number, number]> = {};
      for (const p of lineup) {
        coords[p.player.id] = POSITION_XY[p.position.name] || [50, 50];
      }
      return coords;
    }

    const rows: any[][] = [[lineup[0]]];
    let idx = 1;
    for (const n of digits) {
      rows.push(lineup.slice(idx, idx + n));
      idx += n;
    }
    if (idx < lineup.length) {
      rows.push(lineup.slice(idx));
    }

    const R = rows.length;
    const coords: Record<number, [number, number]> = {};
    for (let r = 0; r < R; r++) {
      const x = R > 1 ? 8 + (90 - 8) * (r / (R - 1)) : 50; // GK low, FW high
      const row = rows[r];
      // Sort left-to-right based on POSITION_XY y coordinate hint
      row.sort((a, b) => {
        const ya = POSITION_XY[a.position.name]?.[1] || 50;
        const yb = POSITION_XY[b.position.name]?.[1] || 50;
        return ya - yb;
      });
      const n = row.length;
      for (let i = 0; i < n; i++) {
        const y = ((i + 1) / (n + 1)) * 100;
        coords[row[i].player.id] = [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
      }
    }
    return coords;
  }

  /**
   * Tracks tactics lineup on pitch at a specific event index
   */
  private async getTacticsStateAt(matchId: number, index: number): Promise<Record<string, any[]>> {
    const rawEvents = await this.getRawEvents(matchId);
    const playerIdx = await this.getPlayerIndex(matchId);
    const state: Record<string, Record<number, any>> = {};

    for (const ev of rawEvents) {
      if ((ev.index || 0) > index) break;
      const t = ev.type?.name;
      const team = ev.team?.name;
      if (t === 'Starting XI' || t === 'Tactical Shift') {
        const lineup = ev.tactics?.lineup || [];
        state[team] = {};
        for (const p of lineup) {
          const pid = p.player.id;
          state[team][pid] = {
            player_id: pid,
            player_name: playerIdx[pid]?.player_name || p.player.name,
            position_id: p.position.id,
            position: p.position.name,
            jersey_number: p.jersey_number || playerIdx[pid]?.jersey_number
          };
        }
      } else if (t === 'Substitution') {
        const offId = ev.player?.id;
        const repl = ev.substitution?.replacement;
        const onId = repl?.id;
        if (state[team] && offId && state[team][offId] && onId) {
          const slot = state[team][offId];
          delete state[team][offId];
          state[team][onId] = {
            player_id: onId,
            player_name: playerIdx[onId]?.player_name || repl.name,
            position_id: slot.position_id,
            position: slot.position,
            jersey_number: playerIdx[onId]?.jersey_number
          };
        }
      }
    }

    const out: Record<string, any[]> = {};
    for (const team of Object.keys(state)) {
      out[team] = Object.values(state[team]);
    }
    return out;
  }

  private expectedXY(positionName: string, attackingPlusX: boolean): [number, number] {
    const [px, py] = POSITION_XY[positionName] || [50, 50];
    let x = (px / 100) * 120;
    let y = (py / 100) * 80;
    if (!attackingPlusX) {
      x = 120 - x;
      y = 80 - y;
    }
    return [x, y];
  }

  private assistDots(ev: any, shotEv: any, playerIdx: Record<number, any>): any[] {
    const sff = shotEv.shot?.freeze_frame || [];
    const dots: any[] = [];
    const actorPid = ev.player?.id;
    const actorTeam = ev.team?.name;

    // Add shooter
    const shooterPid = shotEv.player?.id;
    const shotLoc = shotEv.location;
    if (shooterPid) {
      dots.push({
        location: shotLoc ? [shotLoc[0], shotLoc[1]] : [110, 40],
        teammate: true,
        actor: false,
        keeper: false,
        player_id: shooterPid,
        player_name: this.getPlayerNickname(playerIdx, shooterPid, shotEv.player.name),
        position: shotEv.position?.name,
        jersey_number: playerIdx[shooterPid]?.jersey_number,
        identity_confidence: 'exact'
      });
    }

    // Add other players from shot freeze frame
    for (const e of sff) {
      const pid = e.player?.id;
      if (pid === actorPid || pid === shooterPid) continue;
      dots.push({
        location: [e.location[0], e.location[1]],
        teammate: !!e.teammate,
        actor: false,
        keeper: e.position?.name === 'Goalkeeper',
        player_id: pid,
        player_name: pid ? this.getPlayerNickname(playerIdx, pid, e.player.name) : null,
        position: e.position?.name,
        jersey_number: pid ? playerIdx[pid]?.jersey_number : null,
        identity_confidence: 'exact'
      });
    }

    // Add the passer (actor)
    const actorLoc = ev.location;
    if (actorPid) {
      dots.push({
        location: actorLoc ? [actorLoc[0], actorLoc[1]] : [70, 40],
        teammate: true,
        actor: true,
        keeper: false,
        player_id: actorPid,
        player_name: this.getPlayerNickname(playerIdx, actorPid, ev.player.name),
        position: ev.position?.name,
        jersey_number: playerIdx[actorPid]?.jersey_number,
        identity_confidence: 'exact'
      });
    }
    return dots;
  }

  /**
   * Reconstruct 360 freeze frame and resolve player identities
   */
  public async enrichFrame(matchId: number, eventId: string): Promise<any> {
    const rawEvents = await this.getRawEvents(matchId);
    const ev = rawEvents.find((e: any) => e.id === eventId);
    if (!ev) {
      throw new Error(`Event ${eventId} not found in match ${matchId}`);
    }

    const framesMap = await this.getFramesMap(matchId);
    let frame = framesMap[eventId];
    const playerIdx = await this.getPlayerIndex(matchId);

    const actorTeam = ev.team?.name;
    const matchups = await this.getMatches();
    const match = matchups.find((m: any) => m.match_id === matchId) || {};
    const opponentTeam = match.home_team === actorTeam ? match.away_team : match.home_team;

    // Handle missing 360 frames
    if (!frame || !frame.freeze_frame || frame.freeze_frame.length === 0) {
      const sff = ev.shot?.freeze_frame || [];
      const isPen = ev.shot?.type?.name === 'Penalty';
      const isAssist = ev.pass?.goal_assist || ev.pass?.shot_assist;

      if (isAssist) {
        // Borrow frame from corresponding shot
        const shotEv = rawEvents.find((e: any) => e.shot?.key_pass_id === eventId);
        if (shotEv && shotEv.shot?.freeze_frame) {
          const dots = this.assistDots(ev, shotEv, playerIdx);
          // Convert locations to Pitch3D coordinates
          const mappedDots = dots.map((d: any) => ({
            ...d,
            location: [this.sbToPitchX(d.location[0]), this.sbToPitchZ(d.location[1])]
          }));
          return {
            event: this.simplifyEvent(ev, framesMap, playerIdx),
            players: mappedDots,
            visible_area: null,
            context: this.buildDecisionContext(ev, mappedDots),
            teams: { actor_team: actorTeam, opponent_team: opponentTeam }
          };
        }
      }

      if (sff.length === 0 && !isPen && !isAssist) {
        throw new Error(`No 360 freeze frame or shot freeze frame for event ${eventId}`);
      }

      const loc = ev.location || (isPen ? [108, 40] : null);
      const synth: any[] = [];
      if (loc) {
        synth.push({ location: loc, teammate: true, actor: true, keeper: false });
      }
      if (sff.length > 0) {
        for (const e of sff) {
          synth.push({
            location: e.location,
            teammate: !!e.teammate,
            actor: false,
            keeper: e.position?.name === 'Goalkeeper'
          });
        }
      } else if (isPen) {
        synth.push({ location: [120, 40], teammate: false, actor: false, keeper: true });
      }

      frame = { freeze_frame: synth, visible_area: null };
    }

    const tactics = await this.getTacticsStateAt(matchId, ev.index || 0);

    const dots: any[] = frame.freeze_frame.map((d: any) => ({
      location: [d.location[0], d.location[1]],
      teammate: !!d.teammate,
      actor: !!d.actor,
      keeper: !!d.keeper,
      player_id: null,
      player_name: null,
      position: null,
      jersey_number: null,
      identity_confidence: 'unknown'
    }));

    const assignedIds = new Set<number>();

    const assign = (dot: any, pid: number, confidence: string, position?: string, name?: string) => {
      const info = playerIdx[pid] || {};
      dot.player_id = pid;
      dot.player_name = info.player_name || name;
      dot.jersey_number = info.jersey_number;
      dot.position = position || info.position;
      dot.identity_confidence = confidence;
      assignedIds.add(pid);
    };

    // 1) Actor resolution
    const actorPid = ev.player?.id;
    let actorDot = dots.find((d: any) => d.actor);
    if (!actorDot && ev.location) {
      const candidates = dots.filter((d: any) => d.teammate);
      if (candidates.length > 0) {
        let bestDist = Infinity;
        for (const c of candidates) {
          const d = this.dist(c.location, [ev.location[0], ev.location[1]]);
          if (d < bestDist) {
            bestDist = d;
            actorDot = c;
          }
        }
        if (actorDot) actorDot.actor = true;
      }
    }
    if (actorDot && actorPid) {
      assign(actorDot, actorPid, 'exact', ev.position?.name);
    }

    // 2) Shot freeze frame resolution
    const sff = ev.shot?.freeze_frame || [];
    for (const entry of sff) {
      const pid = entry.player?.id;
      if (!pid || assignedIds.has(pid)) continue;
      const sameSide = !!entry.teammate;
      let bestDot = null;
      let bestD = 2.0; // 2 meters window
      for (const d of dots) {
        if (d.player_id !== null || d.actor || d.teammate !== sameSide) continue;
        const dd = this.dist(d.location, [entry.location[0], entry.location[1]]);
        if (dd < bestD) {
          bestD = dd;
          bestDot = d;
        }
      }
      if (bestDot) {
        assign(bestDot, pid, 'exact', entry.position?.name, entry.player?.name);
      }
    }

    // 3) Goalkeepers resolution
    for (const dot of dots) {
      if (!dot.keeper || dot.player_id !== null) continue;
      const sideTeam = dot.teammate ? actorTeam : opponentTeam;
      const lineup = tactics[sideTeam] || [];
      const gk = lineup.find((p: any) => p.position_id === 1 && !assignedIds.has(p.player_id));
      if (gk) {
        assign(dot, gk.player_id, 'exact', gk.position);
      }
    }

    // 4) Neighboring same-possession events anchor matching
    const thisIdx = ev.index || 0;
    const thisPoss = ev.possession;
    const anchors: Array<{ pid: number; team: string; loc: [number, number] }> = [];
    for (const e of rawEvents) {
      if (e === ev || e.possession !== thisPoss) continue;
      if (Math.abs((e.index || 0) - thisIdx) > 6) continue;
      const pid = e.player?.id;
      const loc = e.location;
      if (pid && !assignedIds.has(pid) && Array.isArray(loc) && loc.length >= 2) {
        anchors.push({ pid, team: ev.team?.name, loc: [loc[0], loc[1]] });
      }
    }
    if (anchors.length > 0) {
      const candidates: Array<{ d: number; di: number; pid: number }> = [];
      for (let di = 0; di < dots.length; di++) {
        const dot = dots[di];
        if (dot.player_id !== null) continue;
        const dteam = dot.teammate ? actorTeam : opponentTeam;
        for (const a of anchors) {
          if (a.team !== dteam) continue;
          const d = this.dist(dot.location, a.loc);
          if (d <= 4.0) { // stride range
            candidates.push({ d, di, pid: a.pid });
          }
        }
      }
      candidates.sort((a, b) => a.d - b.d);
      const taken = new Set<number>();
      for (const c of candidates) {
        if (taken.has(c.di) || assignedIds.has(c.pid)) continue;
        assign(dots[c.di], c.pid, 'exact');
        taken.add(c.di);
      }
    }

    // 5) Formation-based expected shapes resolution
    for (const [sideTeam, isTeammate] of [[actorTeam, true], [opponentTeam, false]] as Array<[string, boolean]>) {
      const pool = dots.filter((d: any) => d.teammate === isTeammate && d.player_id === null && !d.actor && !d.keeper);
      const lineup = (tactics[sideTeam] || []).filter((p: any) => !assignedIds.has(p.player_id) && p.position_id !== 1);
      if (pool.length === 0 || lineup.length === 0) continue;

      const pairings: Array<{ d: number; di: number; pi: number; dot: any; p: any }> = [];
      for (let di = 0; di < pool.length; di++) {
        for (let pi = 0; pi < lineup.length; pi++) {
          const player = lineup[pi];
          const [ex, ey] = this.expectedXY(player.position, isTeammate);
          const d = this.dist(pool[di].location, [ex, ey]);
          pairings.push({ d, di, pi, dot: pool[di], p: player });
        }
      }
      pairings.sort((a, b) => a.d - b.d);
      for (const pairing of pairings) {
        if (pairing.dot.player_id !== null || assignedIds.has(pairing.p.player_id)) continue;
        assign(pairing.dot, pairing.p.player_id, 'inferred', pairing.p.position);
      }
    }

    // 6) Reflection Correction Fix
    const evLoc = ev.location;
    const actorDotForRefl = dots.find((d: any) => d.actor);
    if (actorDotForRefl && Array.isArray(evLoc) && evLoc.length >= 2) {
      const ax = actorDotForRefl.location[0];
      const ay = actorDotForRefl.location[1];
      const dSame = (ax - evLoc[0]) ** 2 + (ay - evLoc[1]) ** 2;
      const dRefl = ((120 - ax) - evLoc[0]) ** 2 + ((80 - ay) - evLoc[1]) ** 2;
      if (dRefl < dSame) {
        for (const d of dots) {
          const lx = d.location[0];
          const ly = d.location[1];
          d.location = [Math.round((120 - lx) * 100) / 100, Math.round((80 - ly) * 100) / 100];
        }
      }
    }

    // CONVERT all dots locations to Pitch3D coordinate mapping
    const mappedPlayers = dots.map((d: any) => ({
      ...d,
      location: [this.sbToPitchX(d.location[0]), this.sbToPitchZ(d.location[1])]
    }));

    const enrichedEvent = this.simplifyEvent(ev, framesMap, playerIdx);
    const tactical = this.analyzeFrame(mappedPlayers, enrichedEvent.location, enrichedEvent.type, enrichedEvent.end_location);

    if (ev.shot?.type?.name === 'Penalty') {
      tactical.best_option = 'shot';
      tactical.decision_quality = 'optimal';
    }

    return {
      event: enrichedEvent,
      players: mappedPlayers,
      visible_area: frame.visible_area,
      context: this.buildDecisionContext(ev, mappedPlayers),
      tactical,
      teams: { actor_team: actorTeam, opponent_team: opponentTeam }
    };
  }

  /**
   * Evaluates lane clearance perpendicular distances
   */
  public laneClearance(origin: [number, number], target: [number, number], opponents: any[]): number {
    const ax = origin[0], ay = origin[1];
    const bx = target[0], by = target[1];
    const dx = bx - ax;
    const dz = by - ay;
    const length = Math.hypot(dx, dz);
    if (length === 0) return 99.0;

    const ux = dx / length;
    const uz = dz / length;

    // Buffer values scaled down for standard pitch coords
    // PASSER_PRESSURE_BUFFER = 1.3 meters
    // RECEIVER_MARK_BUFFER = 1.3 meters
    const lo = 1.3;
    const hi = length - 1.3;
    const searchLo = hi <= lo ? Math.max(0, length / 2 - 0.65) : lo;
    const searchHi = hi <= lo ? Math.min(length, length / 2 + 0.65) : hi;

    let best = 99.0;
    for (const o of opponents) {
      const ox = o.location[0];
      const oz = o.location[1];
      const distToReceiver = Math.hypot(ox - bx, oz - by);
      // Tight mark: opponent within 1.1 meters of receiver contests the reception anyway
      const tightMark = distToReceiver <= 1.1;

      // Project opponent onto lane vector
      const along = (ox - ax) * ux + (oz - ay) * uz;
      if ((along < searchLo || along > searchHi) && !tightMark) {
        continue;
      }

      // Perpendicular distance to lane
      const perp = Math.abs((ox - ax) * uz - (oz - ay) * ux);
      if (perp < best) {
        best = perp;
      }
    }
    return Math.round(best * 100) / 100;
  }

  private spaceAhead(origin: [number, number], opponents: any[]): number {
    const blockers: number[] = [];
    for (const o of opponents) {
      const ox = o.location[0];
      const oz = o.location[1];
      if (ox > origin[0] && Math.abs(oz - origin[1]) < 2.5) {
        blockers.push(ox - origin[0]);
      }
    }
    if (blockers.length === 0) {
      return Math.round(Math.min(22.0, 52.5 - origin[0]) * 10) / 10;
    }
    return Math.round(Math.min(...blockers) * 10) / 10;
  }

  private shotValue(origin: [number, number], opponents: any[]): number {
    const goalX = 52.5, goalZ = 0;
    const d = Math.hypot(origin[0] - goalX, origin[1] - goalZ);
    if (d > 30) return 0.0;

    let value = Math.max(0, 1.0 - d / 30);
    // Count opponents blocking target line segment
    let blockers = 0;
    for (const o of opponents) {
      const dx = goalX - origin[0];
      const dz = goalZ - origin[1];
      const l2 = dx*dx + dz*dz;
      let t = ((o.location[0] - origin[0]) * dx + (o.location[1] - origin[1]) * dz) / l2;
      t = Math.max(0, Math.min(1, t));
      const dist = Math.hypot(o.location[0] - (origin[0] + t*dx), o.location[1] - (origin[1] + t*dz));
      if (dist < 1.7) blockers++;
    }
    value *= Math.max(0.15, 1.0 - 0.28 * blockers);
    return Math.round(value * 1000) / 1000;
  }

  /**
   * Analyzes tactical dimensions geometrically from 3D Pitch coordinates
   */
  public analyzeFrame(players: any[], actorLoc: [number, number] | null, eventType: string, endLoc: [number, number] | null): any {
    const origin = actorLoc || [0, 0];
    const opponents = players.filter((p: any) => !p.teammate);
    const teammates = players.filter((p: any) => p.teammate && !p.actor);

    // Closest defender
    let nearestDist = null;
    let density = 0;
    for (const o of opponents) {
      const d = Math.hypot(o.location[0] - origin[0], o.location[1] - origin[1]);
      if (nearestDist === null || d < nearestDist) {
        nearestDist = d;
      }
      if (d < 4.5) density++; // 4.5m radius for density count
    }

    // Pressure score
    let pressure = 0.0;
    if (nearestDist !== null) {
      pressure = Math.exp(-nearestDist / 3.5);
      pressure = Math.min(1.0, pressure + 0.07 * Math.max(0, density - 1));
    }
    pressure = Math.round(pressure * 1000) / 1000;

    const openOptions: any[] = [];
    const blockedOptions: any[] = [];
    const LANE_BLOCK_LIMIT = 0.9; // lane margin less than 0.9m blocks the lane

    for (const tm of teammates) {
      const laneMargin = this.laneClearance(origin, tm.location, opponents);
      const progress = tm.location[0] - origin[0];
      const opt = {
        player_name: tm.player_name,
        jersey_number: tm.jersey_number,
        position: tm.position,
        location: tm.location,
        distance: Math.round(Math.hypot(tm.location[0] - origin[0], tm.location[1] - origin[1]) * 10) / 10,
        lane_margin: laneMargin,
        forward_progress: Math.round(progress * 10) / 10
      };
      if (laneMargin >= LANE_BLOCK_LIMIT) {
        openOptions.push(opt);
      } else {
        blockedOptions.push(opt);
      }
    }

    openOptions.sort((a, b) => b.forward_progress - a.forward_progress);
    blockedOptions.sort((a, b) => b.forward_progress - a.forward_progress);

    const space = this.spaceAhead(origin, opponents);
    const sVal = this.shotValue(origin, opponents);

    // Candidate valuation list
    const candidates: Array<[string, number]> = [['shot', sVal]];
    if (openOptions.length > 0) {
      const bestPass = openOptions[0];
      const passVal = 0.3 + 0.011 * Math.max(0.0, bestPass.forward_progress) + 0.048 * Math.min(4, openOptions.length);
      const label = bestPass.jersey_number ? `pass_to_${bestPass.jersey_number}` : 'pass';
      candidates.push([label, Math.round(Math.min(0.95, passVal) * 1000) / 1000]);
    }
    const carryVal = Math.min(0.7, 0.045 * space) * (1.0 - pressure * 0.6);
    candidates.push(['carry', Math.round(carryVal * 1000) / 1000]);

    candidates.sort((a, b) => b[1] - a[1]);
    const bestOption = candidates[0][0];

    // Determine decision quality
    const actionKey: Record<string, string> = {
      'Shot': 'shot',
      'Pass': 'pass',
      'Carry': 'carry',
      'Dribble': 'carry'
    };
    const chosen = actionKey[eventType] || null;
    const chosenRank = chosen ? candidates.findIndex(([name]) => name.startsWith(chosen)) : -1;

    let decisionQuality = 'good';
    if (chosenRank === 0) {
      decisionQuality = 'optimal';
    } else if (chosenRank === 1) {
      decisionQuality = 'good';
    } else if (chosenRank !== -1) {
      decisionQuality = 'suboptimal';
    }
    if (pressure > 0.72 && decisionQuality === 'suboptimal') {
      decisionQuality = 'poor';
    }

    return {
      pressure_score: pressure,
      nearest_defender_dist: nearestDist !== null ? Math.round(nearestDist * 100) / 100 : null,
      defender_density: density,
      open_passing_options: openOptions,
      blocked_options: blockedOptions,
      space_ahead: space,
      shot_value: sVal,
      best_option: bestOption,
      option_ranking: candidates.map(([option, value]) => ({ option, value })),
      decision_quality: decisionQuality
    };
  }

  private buildDecisionContext(ev: any, players: any[]): any {
    const origin = ev.location ? [this.sbToPitchX(ev.location[0]), this.sbToPitchZ(ev.location[1])] : [0, 0];
    const opponents = players.filter((p: any) => !p.teammate);
    const teammates = players.filter((p: any) => p.teammate && !p.actor);

    let nearest = null;
    for (const o of opponents) {
      const d = Math.hypot(o.location[0] - origin[0], o.location[1] - origin[1]);
      if (nearest === null || d < nearest) {
        nearest = d;
      }
    }

    let pressure = 'LOW';
    if (nearest !== null) {
      if (nearest < 2.7) pressure = 'HIGH';
      else if (nearest < 5.5) pressure = 'MEDIUM';
    }

    let openCount = 0;
    for (const tm of teammates) {
      if (this.laneClearance(origin as [number, number], tm.location, opponents) >= 0.9) {
        openCount++;
      }
    }

    let zone = 'middle third';
    if (ev.location) {
      // statsbomb coordinates x-boundary: x>=102 is penalty, x>=80 is attacking, x>=40 is middle
      const x = ev.location[0], y = ev.location[1];
      if (x >= 102 && y >= 18 && y <= 62) zone = 'penalty area';
      else if (x >= 80) zone = 'attacking third';
      else if (x >= 40) zone = 'middle third';
      else zone = 'defensive third';
    }

    return {
      nearest_defender_dist: nearest !== null ? Math.round(nearest * 100) / 100 : null,
      pressure,
      open_teammate_count: openCount,
      teammate_count: teammates.length,
      opponent_count: opponents.length,
      zone,
      xg: ev.shot?.statsbomb_xg || null,
      outcome: this.getEventOutcome(ev)
    };
  }

  /**
   * Assemble possession sequence chain of events
   */
  public async getPossessionChain(matchId: number, possessionId: number, upToIndex?: number): Promise<any[]> {
    const rawEvents = await this.getRawEvents(matchId);
    const framesMap = await this.getFramesMap(matchId);
    const playerIdx = await this.getPlayerIndex(matchId);

    const onball = rawEvents.filter((ev: any) => ON_BALL_TYPES.has(ev.type?.name) && ev.location);
    const coreIndices: number[] = [];
    for (let i = 0; i < onball.length; i++) {
      if (onball[i].possession === possessionId) {
        coreIndices.push(i);
      }
    }

    if (coreIndices.length === 0) return [];
    
    // Core spell plus preceding and trailing transition event for before/after context
    const first = coreIndices[0];
    const last = coreIndices[coreIndices.length - 1];
    const lo = first > 0 ? first - 1 : first;
    const hi = last < onball.length - 1 ? last + 1 : last;

    const chain: any[] = [];
    for (let i = lo; i <= hi; i++) {
      const ev = onball[i];
      if (upToIndex !== undefined && (ev.index || 0) > upToIndex) {
        break;
      }
      chain.push(this.simplifyEvent(ev, framesMap, playerIdx));
    }
    return chain;
  }
}

export const statsbombService = new StatsBombService();
