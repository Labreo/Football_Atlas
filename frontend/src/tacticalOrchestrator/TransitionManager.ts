import * as THREE from 'three';
import { PlayerState, ArrowState, OverlayState, AnimationFrame, TacticalPosition } from '../tacticalEngine/types';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';

export class TransitionManager {
  private static instance: TransitionManager;

  private constructor() {}

  public static getInstance(): TransitionManager {
    if (!TransitionManager.instance) {
      TransitionManager.instance = new TransitionManager();
    }
    return TransitionManager.instance;
  }

  /**
   * Modifies the target concept definition to start player and ball positions from their current state,
   * interpolating them to their new layout during the transition phase.
   */
  public prepareTransition(
    engine: TacticalAnimationEngine,
    newData: {
      players: PlayerState[];
      arrows: ArrowState[];
      overlays: OverlayState[];
      ball?: {
        startPos: TacticalPosition;
        keyFrames: AnimationFrame[];
      };
      duration?: number;
    },
    transitionFraction: number = 0.15
  ): any {
    // 1. Capture current positions
    const oldPlayers = engine.getPlayerManager().getPlayers();
    const oldBallPos = engine.getBallPosition(); // { x, y, z }

    // 2. Clone new players so we do not mutate the static manifest data
    const playersCopy: PlayerState[] = JSON.parse(JSON.stringify(newData.players));
    const arrowsCopy: ArrowState[] = JSON.parse(JSON.stringify(newData.arrows || []));
    const overlaysCopy: OverlayState[] = JSON.parse(JSON.stringify(newData.overlays || []));
    let ballCopy = newData.ball ? JSON.parse(JSON.stringify(newData.ball)) : undefined;

    const matchedOldKeys = new Set<string>();

    // 3. For each new player, find the best match in the previous player states
    playersCopy.forEach((newP) => {
      let matchedOldP: PlayerState | null = null;

      // Match 1: Shirt number
      for (const [id, oldP] of oldPlayers.entries()) {
        if (!matchedOldKeys.has(id) && oldP.number === newP.number && oldP.team === newP.team) {
          matchedOldP = oldP;
          matchedOldKeys.add(id);
          break;
        }
      }

      // Match 2: Closest physical proximity of same team
      if (!matchedOldP) {
        let minDistance = Infinity;
        let closestId = '';
        for (const [id, oldP] of oldPlayers.entries()) {
          if (!matchedOldKeys.has(id) && oldP.team === newP.team) {
            const dx = oldP.currentPos.x - newP.startPos.x;
            const dz = oldP.currentPos.z - newP.startPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < minDistance) {
              minDistance = dist;
              closestId = id;
            }
          }
        }
        if (closestId) {
          matchedOldP = oldPlayers.get(closestId) || null;
          matchedOldKeys.add(closestId);
        }
      }

      // If we found a match, carry its position and inject the transition slide
      if (matchedOldP) {
        const startPos = { ...newP.startPos }; // target position
        newP.startPos = { x: matchedOldP.currentPos.x, z: matchedOldP.currentPos.z }; // start from previous actual position

        // Squeeze existing keyframes into [transitionFraction, 1.0]
        const adjustedKeyFrames: AnimationFrame[] = (newP.keyFrames || []).map((kf) => ({
          ...kf,
          time: transitionFraction + kf.time * (1 - transitionFraction),
        }));

        // Inject first slide transition keyframe from current carry position to target startPos
        newP.keyFrames = [
          {
            time: transitionFraction,
            x: startPos.x,
            z: startPos.z,
            easing: 'quadInOut',
          },
          ...adjustedKeyFrames,
        ];
      }
    });

    // 4. Carry over ball if both old and new ball definitions exist
    if (ballCopy && oldBallPos) {
      const targetStartBall = { ...ballCopy.startPos };
      ballCopy.startPos = { x: oldBallPos.x, z: oldBallPos.z };

      const adjustedBallFrames = (ballCopy.keyFrames || []).map((kf: any) => ({
        ...kf,
        time: transitionFraction + kf.time * (1 - transitionFraction),
      }));

      ballCopy.keyFrames = [
        {
          time: transitionFraction,
          x: targetStartBall.x,
          z: targetStartBall.z,
          easing: 'quadInOut',
        },
        ...adjustedBallFrames,
      ];
    }

    // 5. Shift arrows start/end ranges so they only display after the transition has ended
    arrowsCopy.forEach((arrow) => {
      arrow.startFrame = transitionFraction + arrow.startFrame * (1 - transitionFraction);
      arrow.endFrame = transitionFraction + arrow.endFrame * (1 - transitionFraction);
    });

    // 6. Shift overlays start/end ranges
    overlaysCopy.forEach((overlay) => {
      overlay.startFrame = transitionFraction + overlay.startFrame * (1 - transitionFraction);
      overlay.endFrame = transitionFraction + overlay.endFrame * (1 - transitionFraction);
    });

    return {
      players: playersCopy,
      arrows: arrowsCopy,
      overlays: overlaysCopy,
      ball: ballCopy,
      duration: newData.duration,
    };
  }

  /**
   * Smoothly interpolates OrbitControls target and camera positions to avoid snaps.
   */
  public async transitionCamera(
    camera: THREE.PerspectiveCamera,
    controls: any,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    durationMs: number = 1200
  ): Promise<void> {
    if (!camera || !controls) return;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const startTime = performance.now();

    return new Promise((resolve) => {
      const animateCam = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);

        // cubicInOut easing
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startPos, targetPosition, t);
        controls.target.lerpVectors(startTarget, targetLookAt, t);
        controls.update();

        if (progress < 1.0) {
          requestAnimationFrame(animateCam);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animateCam);
    });
  }
}

export const transitionManager = TransitionManager.getInstance();
