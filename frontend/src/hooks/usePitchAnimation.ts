import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TacticalAnimation, interpolatePosition } from '../tacticalModules/base';

interface UsePitchAnimationProps {
  animation: TacticalAnimation | null;
  playState: 'playing' | 'paused' | 'stopped';
  playSpeed: number;
  overlays: {
    passingLanes: boolean;
    movementPaths: boolean;
    pressingZones: boolean;
  };
}

export function usePitchAnimation({
  animation,
  playState,
  playSpeed,
  overlays,
}: UsePitchAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Store 3D objects for reference during updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playersGroupRef = useRef<THREE.Group | null>(null);
  const overlaysGroupRef = useRef<THREE.Group | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);

  // Helper to create shirt number sprites
  const createNumberSprite = (number: number, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background circle
      ctx.fillStyle = 'rgba(10, 14, 26, 0.8)';
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.toString(), 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 3, 1);
    return sprite;
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Initialize Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0E1A');
    sceneRef.current = scene;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 55, 65); // Cinematic overhead angle looking down the field
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // 2. Add Lighting Rig
    const ambientLight = new THREE.AmbientLight('#1E293B', 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#FFFFFF', 2.0);
    dirLight.position.set(0, 80, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Neon mood spotlights
    const spotCyan = new THREE.SpotLight('#00F3FF', 8, 100, Math.PI / 4, 0.5, 1);
    spotCyan.position.set(-30, 40, -10);
    scene.add(spotCyan);

    const spotRed = new THREE.SpotLight('#FF0055', 8, 100, Math.PI / 4, 0.5, 1);
    spotRed.position.set(30, 40, 10);
    scene.add(spotRed);

    // 3. Draw Pitch Geometry
    const pitchWidth = 100;
    const pitchLength = 68;

    // Pitch Grass Surface Mesh
    const pitchGeo = new THREE.PlaneGeometry(pitchWidth, pitchLength);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: '#121826', // Premium dark surface
      roughness: 0.8,
      metalness: 0.1,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Pitch marking lines (drawn just above the grass plane)
    const lineGroup = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: '#23324C', transparent: true, opacity: 0.6 });

    // Outer boundary
    const boundaryGeo = new THREE.BoxGeometry(pitchWidth, 0.1, 0.4);
    const topLine = new THREE.Mesh(boundaryGeo, lineMat);
    topLine.position.set(0, 0.05, -pitchLength / 2);
    lineGroup.add(topLine);

    const bottomLine = topLine.clone();
    bottomLine.position.set(0, 0.05, pitchLength / 2);
    lineGroup.add(bottomLine);

    const boundaryVertGeo = new THREE.BoxGeometry(0.4, 0.05, pitchLength);
    const leftLine = new THREE.Mesh(boundaryVertGeo, lineMat);
    leftLine.position.set(-pitchWidth / 2, 0.05, 0);
    lineGroup.add(leftLine);

    const rightLine = leftLine.clone();
    rightLine.position.set(pitchWidth / 2, 0.05, 0);
    lineGroup.add(rightLine);

    // Center Line
    const centerLine = leftLine.clone();
    centerLine.position.set(0, 0.05, 0);
    lineGroup.add(centerLine);

    // Center Circle (drawn with a RingGeometry)
    const ringGeo = new THREE.RingGeometry(9.15, 9.45, 64);
    const centerRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#23324C', side: THREE.DoubleSide }));
    centerRing.rotation.x = -Math.PI / 2;
    centerRing.position.set(0, 0.06, 0);
    lineGroup.add(centerRing);

    scene.add(lineGroup);

    // 4. Draw Goalposts (Left & Right Ends)
    const goalPostMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.2 });
    const postRadius = 0.2;
    const postHeight = 3.5;
    const goalWidth = 12;

    const createGoal = (posX: number, rotateY: boolean) => {
      const goal = new THREE.Group();
      const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16), goalPostMat);
      leftPost.position.set(0, postHeight / 2, -goalWidth / 2);
      goal.add(leftPost);

      const rightPost = leftPost.clone();
      rightPost.position.set(0, postHeight / 2, goalWidth / 2);
      goal.add(rightPost);

      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 16), goalPostMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(0, postHeight, 0);
      goal.add(crossbar);

      goal.position.set(posX, 0, 0);
      if (rotateY) goal.rotation.y = Math.PI;
      return goal;
    };

    scene.add(createGoal(-pitchWidth / 2, false));
    scene.add(createGoal(pitchWidth / 2, true));

    // 5. Container Groups for dynamic items
    const playersGroup = new THREE.Group();
    scene.add(playersGroup);
    playersGroupRef.current = playersGroup;

    const overlaysGroup = new THREE.Group();
    scene.add(overlaysGroup);
    overlaysGroupRef.current = overlaysGroup;

    // Resizing Handler
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Initial build of static configurations
    clockRef.current.start();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      
      // Dispose materials/geometries
      pitchGeo.dispose();
      pitchMat.dispose();
      boundaryGeo.dispose();
      boundaryVertGeo.dispose();
      ringGeo.dispose();
      lineMat.dispose();
      goalPostMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Update dynamic elements when animation concept changes
  useEffect(() => {
    const scene = sceneRef.current;
    const playersGroup = playersGroupRef.current;
    if (!scene || !playersGroup || !animation) return;

    // Clear old player meshes
    while (playersGroup.children.length > 0) {
      const child = playersGroup.children[0];
      playersGroup.remove(child);
    }

    // Clear old ball
    if (ballMeshRef.current) {
      scene.remove(ballMeshRef.current);
      ballMeshRef.current = null;
    }

    // 1. Re-instantiate player tokens
    animation.players.forEach((p) => {
      const playerToken = new THREE.Group();
      playerToken.name = p.id;

      // Inner sphere base
      const glowColor = p.team === 'attack' ? '#00F3FF' : '#FF0055';
      const playerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 32, 32),
        new THREE.MeshStandardMaterial({
          color: glowColor,
          emissive: glowColor,
          emissiveIntensity: 0.6,
          roughness: 0.1,
        })
      );
      playerMesh.position.y = 0.6;
      playerMesh.castShadow = true;
      playerToken.add(playerMesh);

      // Shirt number floating above player head
      const numberSprite = createNumberSprite(p.number, glowColor);
      numberSprite.position.set(0, 4.0, 0);
      playerToken.add(numberSprite);

      playerToken.position.set(p.startPos.x, 0, p.startPos.z);
      playersGroup.add(playerToken);
    });

    // 2. Re-instantiate ball
    const ballGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFB800', // Neon gold highlight glow
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(animation.ball.startPos.x, 0.35, animation.ball.startPos.z);
    ball.castShadow = true;
    scene.add(ball);
    ballMeshRef.current = ball;

    // Reset timeline progress
    timeRef.current = 0;

  }, [animation]);

  // Main rendering & physics update loop
  useEffect(() => {
    const render = () => {
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const playersGroup = playersGroupRef.current;
      const overlaysGroup = overlaysGroupRef.current;
      const ball = ballMeshRef.current;

      if (!scene || !renderer || !camera) return;

      const delta = clockRef.current.getDelta();
      
      // Update time progression based on playState
      if (playState === 'playing' && animation) {
        // Full loop takes roughly 12 seconds at 1x speed
        timeRef.current += (delta * 0.08 * playSpeed);
        if (timeRef.current > 1) {
          timeRef.current = 0; // Loop animation
        }
      } else if (playState === 'stopped') {
        timeRef.current = 0;
      }

      const t = timeRef.current;

      // Update positions for active concepts
      if (animation && playersGroup && ball && overlaysGroup) {
        
        // 1. Move players
        animation.players.forEach((p) => {
          const playerObj = playersGroup.getObjectByName(p.id);
          if (playerObj) {
            const pos = interpolatePosition(p.keyFrames, p.startPos, t);
            playerObj.position.set(pos.x, 0, pos.z);
          }
        });

        // 2. Move ball
        const ballPos = interpolatePosition(animation.ball.keyFrames, animation.ball.startPos, t);
        // Add a slight arc height when the ball is moving fast between players
        let height = 0.35;
        if (playState === 'playing') {
          // Visual arc: simple sine curve mapped to pass timeline
          height = 0.35 + Math.sin(t * Math.PI * 4) * 1.5; 
          if (height < 0.35) height = 0.35;
        }
        ball.position.set(ballPos.x, height, ballPos.z);

        // 3. Render overlays
        // Clear old overlays
        while (overlaysGroup.children.length > 0) {
          const child = overlaysGroup.children[0];
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
          overlaysGroup.remove(child);
        }

        // Passing Lanes
        if (overlays.passingLanes) {
          animation.passingLanes.forEach((lane) => {
            if (t >= lane.startFrame && t <= lane.endFrame) {
              const fromObj = playersGroup.getObjectByName(lane.fromPlayer);
              const toObj = playersGroup.getObjectByName(lane.toPlayer);
              if (fromObj && toObj) {
                // Draw a neon dashed line connecting them
                const points = [fromObj.position.clone(), toObj.position.clone()];
                points.forEach(p => p.y = 0.2); // Elevate line slightly

                const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
                const curveMat = new THREE.LineBasicMaterial({
                  color: '#00F3FF', // Neon Cyan
                  linewidth: 3,
                });
                const line = new THREE.Line(curveGeo, curveMat);
                overlaysGroup.add(line);
              }
            }
          });
        }

        // Running Paths
        if (overlays.movementPaths) {
          animation.runningPaths.forEach((path) => {
            if (t >= path.startFrame && t <= path.endFrame) {
              const points: THREE.Vector3[] = path.points.map(p => new THREE.Vector3(p.x, 0.1, p.z));
              const curve = new THREE.CatmullRomCurve3(points);
              const curvePoints = curve.getPoints(50);
              const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
              
              const curveMat = new THREE.LineDashedMaterial({
                color: '#39FF14', // Neon Green
                dashSize: 1.5,
                gapSize: 1,
              });
              const line = new THREE.Line(curveGeo, curveMat);
              line.computeLineDistances(); // Required for dashed line
              overlaysGroup.add(line);

              // Draw arrow helper at the end of the path
              const dir = new THREE.Vector3()
                .subVectors(points[points.length - 1], points[points.length - 2])
                .normalize();
              const arrow = new THREE.ArrowHelper(
                dir,
                points[points.length - 1],
                3,
                '#39FF14',
                1,
                0.8
              );
              overlaysGroup.add(arrow);
            }
          });
        }

        // Pressing Zones
        if (overlays.pressingZones) {
          animation.pressingZones.forEach((zone) => {
            if (t >= zone.startFrame && t <= zone.endFrame) {
              const colorCode = zone.color === 'red' ? '#FF0055' : (zone.color === 'green' ? '#39FF14' : '#00F3FF');
              const ringGeo = new THREE.RingGeometry(zone.radius - 0.2, zone.radius, 32);
              const ringMat = new THREE.MeshBasicMaterial({
                color: colorCode,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6,
              });
              const mesh = new THREE.Mesh(ringGeo, ringMat);
              mesh.rotation.x = -Math.PI / 2;
              mesh.position.set(zone.center.x, 0.15, zone.center.z);
              overlaysGroup.add(mesh);
            }
          });
        }
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [animation, playState, playSpeed, overlays]);

  return { containerRef, canvasRef, timeRef };
}
