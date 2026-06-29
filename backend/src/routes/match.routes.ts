import { Router, Request, Response, NextFunction } from 'express';
import { statsbombService } from '../services/statsbomb.service';
import { graniteMatchService } from '../services/graniteMatch.service';
import { getXTAt, getXGEstimate } from '@football-atlas/shared';
import { Logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/tactical/matches
 * Group matches by tournament stage and return details
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await statsbombService.getMatches();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tactical/matches/:id/events
 * Get simplified, located play-by-play events
 */
router.get('/:id/events', async (req: Request, res: Response, next: NextFunction) => {
  const matchId = parseInt(req.params.id, 10);
  try {
    const list = await statsbombService.listEvents(matchId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tactical/matches/:id/teamsheet
 * Starting formations, lineups, managers, subs
 */
router.get('/:id/teamsheet', async (req: Request, res: Response, next: NextFunction) => {
  const matchId = parseInt(req.params.id, 10);
  try {
    const sheet = await statsbombService.getTeamsheet(matchId);
    res.json(sheet);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tactical/matches/:id/frames/:event_id
 * 360-degree player coordinate reconstruction & identity resolution
 */
router.get('/:id/frames/:event_id', async (req: Request, res: Response, next: NextFunction) => {
  const matchId = parseInt(req.params.id, 10);
  const eventId = req.params.event_id;
  try {
    const enriched = await statsbombService.enrichFrame(matchId, eventId);
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tactical/matches/:id/possession/:possession_id
 * Consequence chain of touches under the same possession index
 */
router.get('/:id/possession/:possession_id', async (req: Request, res: Response, next: NextFunction) => {
  const matchId = parseInt(req.params.id, 10);
  const possessionId = parseInt(req.params.possession_id, 10);
  const upToIndex = req.query.up_to_index ? parseInt(req.query.up_to_index as string, 10) : undefined;
  try {
    const chain = await statsbombService.getPossessionChain(matchId, possessionId, upToIndex);
    res.json(chain);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tactical/matches/assess
 * AI action quality and Stakes analysis
 */
router.post('/assess', async (req: Request, res: Response, next: NextFunction) => {
  const { frameContext } = req.body;
  try {
    const result = await graniteMatchService.assessMoment(frameContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tactical/matches/explain
 * Get visual narrative prose explanation
 */
router.post('/explain', async (req: Request, res: Response, next: NextFunction) => {
  const { frameContext } = req.body;
  try {
    const result = await graniteMatchService.getExplanation(frameContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tactical/matches/manager-tactics
 * Manager tactical details prose
 */
router.post('/manager-tactics', async (req: Request, res: Response, next: NextFunction) => {
  const { match_id, team, lang } = req.body;
  try {
    const sheet = await statsbombService.getTeamsheet(match_id);
    const result = await graniteMatchService.getManagerTactics(match_id, team, sheet, lang);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tactical/matches/whatif
 * Valuate all counterfactual options using Expected Threat (xT) or Expected Goals (xG)
 */
router.post('/whatif', async (req: Request, res: Response, next: NextFunction) => {
  const { frame } = req.body;
  try {
    const players = frame.players || [];
    const ev = frame.event || {};
    const context = frame.context || {};
    const actor = players.find((p: any) => p.actor);

    // Compute origin in StatsBomb coordinates
    // Frame coordinates served to client are mapped to Pitch3D coordinates, so we must
    // convert back to StatsBomb coordinates to perform expected threat queries
    const originPitch: [number, number] = actor ? actor.location : ev.location || [0, 0];
    const originX_sb = ((originPitch[0] + 52.5) / 105) * 120;
    const originZ_sb = ((originPitch[1] + 34) / 68) * 80;

    const xt0 = getXTAt(originPitch[0], originPitch[1]);

    const opponents = players.filter((p: any) => !p.teammate);

    // Use statsbombService tools to analyze frame parameters
    const tactical = statsbombService.analyzeFrame(players, originPitch, ev.type, ev.end_location);

    const options: any[] = [];

    // 1) Pass options: teammates list
    const optionsPool = [...tactical.open_passing_options, ...tactical.blocked_options];
    for (const opt of optionsPool) {
      const loc = opt.location;
      const viable = opt.lane_margin >= 0.9;
      const who = opt.player_name || (opt.jersey_number ? `#${opt.jersey_number}` : 'team-mate');
      options.push({
        kind: 'pass',
        label: `Pass to ${who}`,
        receiver: opt.player_name,
        jersey_number: opt.jersey_number,
        position: opt.position,
        target: loc,
        value: getXTAt(loc[0], loc[1]), // threat reached
        value_kind: 'xT',
        viable,
        blocked: !viable,
        forward: opt.forward_progress
      });
    }

    // 2) Carry into open space ahead
    const space = tactical.space_ahead || 0.0;
    if (space > 3.0) {
      const targetPitch: [number, number] = [Math.min(52.5, originPitch[0] + (space * 105 / 120)), originPitch[1]];
      options.push({
        kind: 'carry',
        label: `Carry into ${Math.round(space)}m of space`,
        target: targetPitch,
        value: getXTAt(targetPitch[0], targetPitch[1]),
        value_kind: 'xT',
        viable: true,
        blocked: false
      });
    }

    // 3) Shot option (if in range)
    const goalPitch: [number, number] = [52.5, 0];
    const distToGoal = Math.hypot(originPitch[0] - goalPitch[0], originPitch[1] - goalPitch[1]);
    if (ev.type !== 'Shot' && distToGoal <= 28) {
      const xg = getXGEstimate(originPitch[0], originPitch[1], opponents.map((o: any) => ({ x: o.location[0], z: o.location[1] })));
      if (xg > 0) {
        options.push({
          kind: 'shot',
          label: 'Shoot',
          target: goalPitch,
          value: xg,
          value_kind: 'xG',
          viable: true,
          blocked: false,
          estimate: true
        });
      }
    }

    // 4) Chosen action
    let chosenVal = 0.0;
    let chosenKind = 'xT';
    if (ev.type === 'Shot') {
      const xg = context.xg || ev.xg || 0.05;
      chosenVal = xg;
      chosenKind = 'xG';
    } else if (ev.end_location) {
      chosenVal = getXTAt(ev.end_location[0], ev.end_location[1]);
      chosenKind = 'xT';
    }

    const chosenLabel = {
      'Shot': 'Shoot',
      'Pass': 'The pass played',
      'Carry': 'The carry made',
      'Dribble': 'The dribble taken'
    }[ev.type as string] || 'The action taken';

    options.push({
      kind: (ev.type || 'action').toLowerCase(),
      label: chosenLabel,
      target: ev.end_location || goalPitch,
      value: chosenVal,
      value_kind: chosenKind,
      viable: true,
      blocked: false,
      chosen: true
    });

    // Sort by goal probability value
    options.sort((a, b) => (b.value || 0) - (a.value || 0));

    // Best alternative viable choice that beats the chosen one
    const alt = options.filter(o => o.viable && !o.chosen && o.value > chosenVal);
    const best = alt.length > 0 ? alt[0] : null;
    if (best) {
      best.best = true;
    }

    // Genuinely best overall option
    const others = options.filter(o => !o.chosen && typeof o.value === 'number');
    others.sort((a, b) => b.value - a.value);
    const bestOverall = others.length > 0 ? others[0] : null;
    const blockedDream = (bestOverall && bestOverall.blocked && bestOverall.value >= Math.max(chosenVal * 2.0, chosenVal + 0.05)) ? bestOverall : null;

    const rank = options.findIndex(o => o.chosen);
    const delta = best ? Math.round((best.value - chosenVal) * 10000) / 10000 : null;

    let verdictClass = 'optimal';
    if (best && delta && delta > 0.005) {
      verdictClass = chosenVal >= 0.7 * best.value ? 'solid' : 'better_available';
    } else if (blockedDream) {
      verdictClass = 'forced';
    }

    const summary = {
      chosen_value: chosenVal,
      chosen_kind: chosenKind,
      best_value: best ? best.value : null,
      best_label: best ? best.label : null,
      best_target: best ? best.target : null,
      delta,
      blocked_best_label: blockedDream ? blockedDream.label : null,
      blocked_best_value: blockedDream ? blockedDream.value : null,
      rank,
      count: options.length,
      verdict_class: verdictClass
    };

    res.json({
      origin: originPitch,
      actor: actor ? actor.player_name : ev.player,
      options,
      summary,
      verdict: `Based on expected threat, this was a ${verdictClass === 'optimal' ? 'highly optimal choice' : verdictClass === 'solid' ? 'solid, low-risk decision' : 'suboptimal decision as better options were available'}.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
