import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { useTacticalStore } from '../stores/useTacticalStore';

export interface PitchEngineOptions {
  cameraTrackingEnabled?: boolean;
  enableCinematicRotation?: boolean;
}

export function usePitchEngine(options?: PitchEngineOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<TacticalAnimationEngine | null>(null);

  // Keep options in a ref to always have latest values in render loop without rebuilding
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Subscriptions to control panel camera operations
  const { 
    cameraZoom, 
    cameraResetTrigger, 
    cameraPanDirection 
  } = useTacticalStore();

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Initialize Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = null;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 1000);
    
    const isLanding = !!options?.enableCinematicRotation;
    if (isLanding) {
      camera.position.set(0, 42, 90);
    } else {
      camera.position.set(0, 135, 0.1);
    }
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Initialize OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minPolarAngle = 0.15;
    controls.minDistance = 25;
    controls.maxDistance = 140;
    controlsRef.current = controls;

    let userInteracting = false;
    controls.addEventListener('start', () => {
      userInteracting = true;
      (window as any)._enableCinematicRotation = false;
    });
    controls.addEventListener('end', () => {
      userInteracting = false;
    });

    // Raycaster for player hover tooltips
    const raycaster = new THREE.Raycaster();
    
    // Create floating tooltip DOM element
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute pointer-events-none bg-[#090D1A]/95 backdrop-blur-md border border-[#23324C]/80 rounded-lg p-2 text-[10px] font-mono text-slate-200 shadow-2xl z-30 opacity-0 transition-opacity duration-150 flex flex-col gap-0.5 min-w-[100px]';
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.marginTop = '-12px'; // offset above the token
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    containerRef.current.appendChild(tooltip);

    const handlePointerMove = (event: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const playersGroup = scene.getObjectByName('tactical-players');
      if (playersGroup) {
        const intersects = raycaster.intersectObjects(playersGroup.children, true);
        if (intersects.length > 0) {
          let current: THREE.Object3D | null = intersects[0].object;
          let playerId = '';
          while (current && current !== playersGroup) {
            if (current.parent === playersGroup) {
              playerId = current.name;
              break;
            }
            current = current.parent;
          }

          if (playerId) {
            const playerState = activeEngine.getPlayerManager().getPlayers().get(playerId);
            if (playerState) {
              const teamColor = playerState.team === 'attack' ? '#3B82F6' : '#EF4444'; // brighter team colors
              const teamLabel = playerState.team === 'attack' ? 'ATTACK' : 'DEFENSE';
              
              tooltip.innerHTML = `
                <div class="flex items-center gap-1.5 border-b border-[#23324C]/40 pb-1 mb-1" style="min-width: 100px;">
                  <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${teamColor}"></span>
                  <span class="font-bold text-[8px] tracking-wider uppercase" style="color: ${teamColor}">${teamLabel}</span>
                  <span class="ml-auto text-slate-500 font-bold">#${playerState.number}</span>
                </div>
                <div class="font-display font-bold text-slate-100 text-[11px] truncate">${playerState.name || 'Unknown Player'}</div>
              `;
              
              tooltip.style.left = `${event.clientX - rect.left}px`;
              tooltip.style.top = `${event.clientY - rect.top}px`;
              tooltip.style.opacity = '1';
              renderer.domElement.style.cursor = 'pointer';
              return;
            }
          }
        }
      }
      
      tooltip.style.opacity = '0';
      renderer.domElement.style.cursor = 'auto';
    };

    const handlePointerLeave = () => {
      tooltip.style.opacity = '0';
      renderer.domElement.style.cursor = 'auto';
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('pointermove', handlePointerMove);
    canvasEl.addEventListener('pointerleave', handlePointerLeave);

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight('#1E293B', 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#FFFFFF', 2.2);
    dirLight.position.set(20, 80, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    const d = 60;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight('#60A5FA', 0.5);
    fillLight.position.set(-40, 40, -20);
    scene.add(fillLight);

    // 4. Premium Pitch Platform
    const pitchWidth = 100;
    const pitchLength = 68;
    const platformWidth = 106;
    const platformLength = 74;
    const platformThickness = 2.0;

    const sideMat = new THREE.MeshStandardMaterial({
      color: '#151D2A',
      roughness: 0.5,
      metalness: 0.85
    });
    const turfTex = makeTurfTexture();
    const topMat = new THREE.MeshStandardMaterial({
      map: turfTex,
      roughness: 0.95,
      metalness: 0.02
    });
    const bottomMat = new THREE.MeshStandardMaterial({
      color: '#090D14',
      roughness: 0.9
    });

    const pitchMaterials = [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];
    const pitchGeo = new THREE.BoxGeometry(platformWidth, platformThickness, platformLength);
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMaterials);
    pitchMesh.position.y = -platformThickness / 2;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // 5. Pitch Markings
    const lineGroup = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ 
      color: '#FFFFFF', 
      transparent: true, 
      opacity: 0.85,
      depthWrite: false 
    });

    const lineWidth = 0.28;
    const createLine = (w: number, l: number, x: number, z: number) => {
      const lineGeo = new THREE.PlaneGeometry(w, l);
      const mesh = new THREE.Mesh(lineGeo, lineMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.01, z);
      lineGroup.add(mesh);
    };

    createLine(pitchWidth, lineWidth, 0, -pitchLength / 2);
    createLine(pitchWidth, lineWidth, 0, pitchLength / 2);
    createLine(lineWidth, pitchLength, -pitchWidth / 2, 0);
    createLine(lineWidth, pitchLength, pitchWidth / 2, 0);
    createLine(lineWidth, pitchLength, 0, 0);

    const penW = 16.5;
    const penL = 40.32;
    createLine(penW, lineWidth, -pitchWidth / 2 + penW / 2, -penL / 2);
    createLine(penW, lineWidth, -pitchWidth / 2 + penW / 2, penL / 2);
    createLine(lineWidth, penL, -pitchWidth / 2 + penW, 0);

    const goalAreaW = 5.5;
    const goalAreaL = 18.32;
    createLine(goalAreaW, lineWidth, -pitchWidth / 2 + goalAreaW / 2, -goalAreaL / 2);
    createLine(goalAreaW, lineWidth, -pitchWidth / 2 + goalAreaW / 2, goalAreaL / 2);
    createLine(lineWidth, goalAreaL, -pitchWidth / 2 + goalAreaW, 0);

    createLine(penW, lineWidth, pitchWidth / 2 - penW / 2, -penL / 2);
    createLine(penW, lineWidth, pitchWidth / 2 - penW / 2, penL / 2);
    createLine(lineWidth, penL, pitchWidth / 2 - penW, 0);

    createLine(goalAreaW, lineWidth, pitchWidth / 2 - goalAreaW / 2, -goalAreaL / 2);
    createLine(goalAreaW, lineWidth, pitchWidth / 2 - goalAreaW / 2, goalAreaL / 2);
    createLine(lineWidth, goalAreaL, pitchWidth / 2 - goalAreaW, 0);

    const spotGeo = new THREE.CircleGeometry(0.35, 16);
    const spotMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });
    
    const centerSpot = new THREE.Mesh(spotGeo, spotMat);
    centerSpot.rotation.x = -Math.PI / 2;
    centerSpot.position.set(0, 0.015, 0);
    lineGroup.add(centerSpot);

    const leftPenSpot = centerSpot.clone();
    leftPenSpot.position.set(-pitchWidth / 2 + 11.0, 0.015, 0);
    lineGroup.add(leftPenSpot);

    const rightPenSpot = centerSpot.clone();
    rightPenSpot.position.set(pitchWidth / 2 - 11.0, 0.015, 0);
    lineGroup.add(rightPenSpot);

    const circleRingGeo = new THREE.RingGeometry(9.15, 9.15 + lineWidth, 64);
    const circleRing = new THREE.Mesh(circleRingGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide }));
    circleRing.rotation.x = -Math.PI / 2;
    circleRing.position.set(0, 0.015, 0);
    lineGroup.add(circleRing);

    const cornerMat = new THREE.MeshBasicMaterial({ 
      color: '#FFFFFF', 
      transparent: true, 
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide 
    });

    const cornerGeos: THREE.RingGeometry[] = [];
    const createCornerArc = (x: number, z: number, thetaStart: number) => {
      const geo = new THREE.RingGeometry(1.0, 1.0 + lineWidth, 16, 1, thetaStart, Math.PI / 2);
      const mesh = new THREE.Mesh(geo, cornerMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.015, z);
      lineGroup.add(mesh);
      cornerGeos.push(geo);
    };

    createCornerArc(-pitchWidth / 2, -pitchLength / 2, 3 * Math.PI / 2);
    createCornerArc(pitchWidth / 2, -pitchLength / 2, Math.PI);
    createCornerArc(-pitchWidth / 2, pitchLength / 2, 0);
    createCornerArc(pitchWidth / 2, pitchLength / 2, Math.PI / 2);

    scene.add(lineGroup);

    // 6. Goals meshes
    const goalPostMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.15, metalness: 0.1 });
    const postRadius = 0.15;
    const postHeight = 2.44;
    const goalWidth = 7.32;
    const goalDepth = 2.0;

    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth + postRadius * 2, 16);
    const backPostGeo = new THREE.CylinderGeometry(postRadius * 0.8, postRadius * 0.8, goalDepth, 16);
    const strutGeo = new THREE.CylinderGeometry(postRadius * 0.6, postRadius * 0.6, Math.sqrt(postHeight * postHeight + goalDepth * goalDepth), 16);
    const netBoxGeo = new THREE.BoxGeometry(goalDepth, postHeight, goalWidth);
    const netMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const netWireGeo = new THREE.EdgesGeometry(netBoxGeo);
    const netWireMat = new THREE.LineBasicMaterial({ color: '#E2E8F0', transparent: true, opacity: 0.35 });

    const createGoalMesh = (posX: number, rotateY: boolean) => {
      const goalGroup = new THREE.Group();
      const leftPost = new THREE.Mesh(postGeo, goalPostMat);
      leftPost.position.set(0, postHeight / 2, -goalWidth / 2);
      leftPost.castShadow = true;
      goalGroup.add(leftPost);

      const rightPost = leftPost.clone();
      rightPost.position.set(0, postHeight / 2, goalWidth / 2);
      goalGroup.add(rightPost);

      const crossbar = new THREE.Mesh(crossbarGeo, goalPostMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(0, postHeight, 0);
      crossbar.castShadow = true;
      goalGroup.add(crossbar);

      const backPostLeft = new THREE.Mesh(backPostGeo, goalPostMat);
      backPostLeft.rotation.z = Math.PI / 2;
      backPostLeft.position.set(-goalDepth / 2, 0.05, -goalWidth / 2);
      goalGroup.add(backPostLeft);

      const backPostRight = backPostLeft.clone();
      backPostRight.position.set(-goalDepth / 2, 0.05, goalWidth / 2);
      goalGroup.add(backPostRight);

      const strutLeft = new THREE.Mesh(strutGeo, goalPostMat);
      strutLeft.rotation.z = Math.atan2(postHeight, goalDepth);
      strutLeft.position.set(-goalDepth / 2, postHeight / 2, -goalWidth / 2);
      goalGroup.add(strutLeft);

      const strutRight = strutLeft.clone();
      strutRight.position.set(-goalDepth / 2, postHeight / 2, goalWidth / 2);
      goalGroup.add(strutRight);

      const netMesh = new THREE.Mesh(netBoxGeo, netMat);
      netMesh.position.set(-goalDepth / 2, postHeight / 2, 0);
      goalGroup.add(netMesh);

      const netWire = new THREE.LineSegments(netWireGeo, netWireMat);
      netWire.position.set(-goalDepth / 2, postHeight / 2, 0);
      goalGroup.add(netWire);

      goalGroup.position.set(posX, 0, 0);
      if (rotateY) goalGroup.rotation.y = Math.PI;
      return goalGroup;
    };

    scene.add(createGoalMesh(-pitchWidth / 2, false));
    scene.add(createGoalMesh(pitchWidth / 2, true));

    // Build ad boards and stadium bowl around the pitch
    buildAdBoards(scene, pitchWidth, pitchLength);
    buildStadium(scene);

    // 7. Instantiate core Animation Engine orchestrator
    const activeEngine = new TacticalAnimationEngine(scene, 12.0);
    // Attach camera references for dynamic preset adjustments
    (activeEngine as any).camera = camera;
    (activeEngine as any).controls = controls;
    setEngine(activeEngine);

    // Resizing Observer
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // requestAnimationFrame tick loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const render = () => {
      const dt = clock.getDelta();
      activeEngine.tick(dt);

      if (controls) {
        const currentOptions = optionsRef.current;
        const trackingEnabled = (currentOptions?.cameraTrackingEnabled ?? false) && (window as any)._cameraTrackingEnabled !== false;
        
        let desiredTarget: THREE.Vector3 | null = null;
        if (trackingEnabled) {
          const players = activeEngine.getPlayerManager().getPlayers();
          for (const player of players.values()) {
            if (player.actor && player.currentPos) {
              desiredTarget = new THREE.Vector3(player.currentPos.x, 0, player.currentPos.z);
              break;
            }
          }
          if (!desiredTarget) {
            desiredTarget = (window as any)._cameraDesiredTarget;
          }
        }

        const autoRotateEnabled = !!currentOptions?.enableCinematicRotation;

        if (desiredTarget) {
          // Smoothly translate target and camera in parallel to follow player movement
          const targetMovement = new THREE.Vector3().subVectors(desiredTarget, controls.target);
          controls.target.addScaledVector(targetMovement, 0.08);
          camera.position.addScaledVector(targetMovement, 0.08);

          // Smoothly glide camera to the broadcast perspective offset
          if (!userInteracting && !autoRotateEnabled) {
            const desiredCamPos = new THREE.Vector3(
              controls.target.x - 22,
              controls.target.y + 24,
              controls.target.z + 18
            );
            camera.position.lerp(desiredCamPos, 0.05);
          }
        }

        controls.autoRotate = autoRotateEnabled && !userInteracting;
        controls.autoRotateSpeed = 0.4;
        controls.update();
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      canvasEl.removeEventListener('pointermove', handlePointerMove);
      canvasEl.removeEventListener('pointerleave', handlePointerLeave);
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }

      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      activeEngine.destroy();

      // Dispose resources
      pitchGeo.dispose();
      sideMat.dispose();
      topMat.dispose();
      bottomMat.dispose();
      lineMat.dispose();
      spotGeo.dispose();
      spotMat.dispose();
      circleRingGeo.dispose();
      cornerGeos.forEach(g => g.dispose());
      cornerMat.dispose();
      goalPostMat.dispose();
      postGeo.dispose();
      crossbarGeo.dispose();
      backPostGeo.dispose();
      strutGeo.dispose();
      netBoxGeo.dispose();
      netMat.dispose();
      netWireGeo.dispose();
      netWireMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Synchronize Camera Reset
  useEffect(() => {
    if (cameraResetTrigger === 0) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    controls.target.set(0, 0, 0);
    camera.position.set(0, 135, 0.1);
    camera.zoom = 1.0;
    camera.updateProjectionMatrix();
    controls.update();
  }, [cameraResetTrigger]);

  // Synchronize Camera Zoom slider
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();
    if (controlsRef.current) controlsRef.current.update();
  }, [cameraZoom]);

  // Synchronize Camera Rotate operations
  useEffect(() => {
    if (cameraPanDirection.count === 0) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    const dir = cameraPanDirection.dir;

    if (dir === 'left') spherical.theta -= 0.18;
    else if (dir === 'right') spherical.theta += 0.18;
    else if (dir === 'up') spherical.phi = Math.max(0.12, spherical.phi - 0.1);
    else if (dir === 'down') spherical.phi = Math.min(Math.PI / 2 - 0.05, spherical.phi + 0.1);

    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }, [cameraPanDirection.count]);

  return { containerRef, canvasRef, engine };
}

// ────────────────────────────────────────────────────────────
// PROCEDURAL GEOMETRY & TEXTURES FOR 3D STADIUM
// ────────────────────────────────────────────────────────────

function roundedRectRing(hw: number, hh: number, r: number, y: number, segs = 10): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const corners = [
    [hw - r, hh - r, 0],
    [-(hw - r), hh - r, Math.PI / 2],
    [-(hw - r), -(hh - r), Math.PI],
    [hw - r, -(hh - r), Math.PI * 1.5],
  ];
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (i / segs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + r * Math.cos(a), y, cz + r * Math.sin(a)));
    }
  }
  pts.push(pts[0].clone());
  return pts;
}

function bandMesh(ringA: THREE.Vector3[], ringB: THREE.Vector3[], material: THREE.Material, uRepeat: number): THREE.Mesh {
  const n = ringA.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    pos.push(ringA[i].x, ringA[i].y, ringA[i].z, ringB[i].x, ringB[i].y, ringB[i].z);
    const u = (i / (n - 1)) * uRepeat;
    uv.push(u, 0, u, 1);
  }
  for (let i = 0; i < n - 1; i++) {
    const a = 2 * i, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeCyberCrowdTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  const W = 1024, H = 512;
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  // Light concrete grey tier background
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, 0, W, H);

  // Draw seats grid
  const rows = 42;
  const seatsPerRow = 128;
  const rowHeight = H / rows;
  const seatWidth = W / seatsPerRow;

  // Curated World Cup palette
  const SECTION_COLORS = [
    '#2563EB', // 0: Royal Blue
    '#EF4444', // 1: Crimson Red
    '#10B981', // 2: Emerald Green
    '#F59E0B'  // 3: Amber Gold
  ];

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    // Row line divider (dark concrete groove)
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();

    for (let s = 0; s < seatsPerRow; s++) {
      const x = s * seatWidth;
      
      // Vertical walkways/aisles (concrete stairs with cyan edge lights)
      if (s % 16 === 0 || s % 16 === 1) {
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(x, y, seatWidth, rowHeight);
        if (s % 16 === 0 && r % 4 === 0) {
          ctx.fillStyle = '#06B6D4';
          ctx.fillRect(x, y, 2, 2);
        }
        continue;
      }

      // Determine section based on horizontal coordinate
      const sectionIdx = Math.floor(s / 32) % SECTION_COLORS.length;
      const primaryColor = SECTION_COLORS[sectionIdx];

      // 2026 World Cup brand color mosaic selection (98% occupancy for a packed stadium)
      const rand = Math.random();
      let color = '#94A3B8'; // default concrete/empty seat
      
      if (rand < 0.75) {
        color = primaryColor; // dominant section color
      } else if (rand < 0.93) {
        color = SECTION_COLORS[(sectionIdx + 1) % SECTION_COLORS.length]; // mixed section color
      } else if (rand < 0.98) {
        color = '#FFFFFF'; // white accent shirt
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 2, seatWidth - 2, rowHeight - 4);

      // Shimmering camera flashes / screen glow
      if (Math.random() > 0.985) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#00F3FF';
        ctx.shadowBlur = 6;
        ctx.fillRect(x + 1, y + 2, seatWidth - 2, rowHeight - 4);
        ctx.shadowBlur = 0;
      }
    }
  }

  // Draw colorful modern banners (inspired by FIFA 26 colorful motifs)
  for (let i = 0; i < 4; i++) {
    const bannerY = 80 + i * 120;
    const colorsList = ['#EF4444', '#10B981', '#2563EB', '#F59E0B'];
    const segmentW = (W - 100) / 4;
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = colorsList[j];
      ctx.fillRect(50 + j * segmentW, bannerY, segmentW, 14);
    }
    // Banner text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('WORLD CUP 2026', W / 2, bannerY + 7);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if ('colorSpace' in tex) {
    (tex as any).colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function makeScoreboardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Royal blue cyber background
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1E3A8A');
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Border frame (Gold/Yellow)
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 250);

  // Inner frame (Teal)
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 240);

  // Title
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = '800 24px "Outfit", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('FOOTBALL ATLAS', 256, 40);

  // Live indicator
  ctx.font = '600 18px "Outfit", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText('DECISION INTEL IQ', 256, 75);

  // Main board text
  ctx.font = 'bold 44px "Outfit", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('LIVE TACTICS', 256, 140);

  // Status message
  ctx.font = '500 20px "Outfit", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#10B981';
  ctx.fillText('ANALYST ACTIVE', 256, 205);

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) {
    (tex as any).colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function makeScoreboardBackTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Dark background
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Gold borders
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 250);

  // Logo text
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = '800 36px "Outfit", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('FOOTBALL', 256, 100);
  ctx.fillStyle = '#06B6D4';
  ctx.fillText('ATLAS', 256, 150);

  // Subtitle
  ctx.font = '600 16px "Outfit", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('DECISION INTEL IQ', 256, 205);

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) {
    (tex as any).colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function makeTurfTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d')!;

  // Alternate vertical stripes (16 stripes)
  const stripes = 16;
  const stripeW = 1024 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1E3E26' : '#19341F'; // Soft, premium grass green
    ctx.fillRect(i * stripeW, 0, stripeW, 1024);
  }

  // Draw white perimeter boundary
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 1016, 1016);

  // Soft noise grain overlay
  for (let k = 0; k < 60000; k++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.025})`;
    ctx.fillRect(rx, ry, 1.2, 1.2);
  }
  for (let k = 0; k < 60000; k++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.045})`;
    ctx.fillRect(rx, ry, 1.2, 1.2);
  }

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) {
    (tex as any).colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function makeAdBoardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 64;
  const ctx = c.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, 64);
  bg.addColorStop(0, '#0c1a3a');
  bg.addColorStop(1, '#081126');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 64);

  // Glowing ad text line
  ctx.textBaseline = 'middle';
  ctx.font = '800 32px "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#38FE5E';
  ctx.shadowColor = '#38FE5E';
  ctx.shadowBlur = 8;
  ctx.fillText('FOOTBALL ATLAS', 30, 32);

  ctx.font = '600 22px "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#00F3FF';
  ctx.shadowColor = '#00F3FF';
  ctx.fillText('DECISION IQ', 400, 32);

  ctx.font = '800 26px "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.fillText('WORLD CUP', 700, 32);
  ctx.shadowBlur = 0;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  if ('colorSpace' in tex) {
    (tex as any).colorSpace = THREE.SRGBColorSpace;
  } else {
    (tex as any).encoding = (THREE as any).sRGBEncoding;
  }
  return tex;
}

function buildAdBoards(scene: THREE.Scene, pitchWidth: number, pitchLength: number) {
  const adTex = makeAdBoardTexture();
  const hw = pitchWidth / 2;
  const hl = pitchLength / 2;

  const place = (len: number, x: number, z: number, rotationY: number) => {
    const tex = adTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(len / 25, 1);
    const boardMat = new THREE.MeshBasicMaterial({
      map: tex,
      toneMapped: false,
      side: THREE.DoubleSide
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.2), boardMat);
    board.position.set(x, 0.6, z);
    board.rotation.y = rotationY;
    board.rotateX(-0.1);
    scene.add(board);
  };

  // Touchline boards
  place(pitchWidth + 4, 0, -hl - 1.8, 0);
  place(pitchWidth + 4, 0, hl + 1.8, Math.PI);

  // Goal-line boards (with gaps for the goals)
  const sideBoardLen = (pitchLength - 7.32) / 2 - 4;
  const offsetZ = 7.32 / 2 + sideBoardLen / 2 + 2;

  // Left goal line (-x)
  place(sideBoardLen, -hw - 1.8, -offsetZ, Math.PI / 2);
  place(sideBoardLen, -hw - 1.8, offsetZ, Math.PI / 2);

  // Right goal line (+x)
  place(sideBoardLen, hw + 1.8, -offsetZ, -Math.PI / 2);
  place(sideBoardLen, hw + 1.8, offsetZ, -Math.PI / 2);
}

function buildScoreboard(scene: THREE.Scene, x: number, z: number, rotationY: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  // Support pole (Silver metal)
  const poleGeo = new THREE.CylinderGeometry(0.35, 0.35, 20, 8);
  const poleMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    metalness: 0.9,
    roughness: 0.15
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 10;
  pole.castShadow = true;
  group.add(pole);

  // Screen bezel (Sleek light silver)
  const bezelGeo = new THREE.BoxGeometry(15, 8.5, 0.6);
  const bezelMat = new THREE.MeshStandardMaterial({
    color: '#F1F5F9',
    metalness: 0.8,
    roughness: 0.2
  });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, 18, 0);
  bezel.castShadow = true;
  group.add(bezel);

  // Screen surface (Vibrant display facing inside)
  const screenGeo = new THREE.PlaneGeometry(14.4, 7.9);
  const screenMat = new THREE.MeshBasicMaterial({
    map: makeScoreboardTexture(),
    toneMapped: false
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 18, 0.31);
  group.add(screen);

  // Screen back face (facing outside)
  const screenBackFaceGeo = new THREE.PlaneGeometry(14.4, 7.9);
  const screenBackFaceMat = new THREE.MeshBasicMaterial({
    map: makeScoreboardBackTexture(),
    toneMapped: false
  });
  const screenBackFace = new THREE.Mesh(screenBackFaceGeo, screenBackFaceMat);
  screenBackFace.position.set(0, 18, -0.31);
  screenBackFace.rotation.y = Math.PI;
  group.add(screenBackFace);

  // Cyber light bar on top of the bezel (Golden glow)
  const lightBarGeo = new THREE.BoxGeometry(13.5, 0.4, 0.4);
  const lightBarMat = new THREE.MeshBasicMaterial({
    color: '#F59E0B'
  });
  const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
  lightBar.position.set(0, 22.45, 0);
  group.add(lightBar);

  scene.add(group);
}

function drawBeam(scene: THREE.Scene, from: THREE.Vector3, to: THREE.Vector3, radius: number, mat: THREE.Material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const geom = new THREE.CylinderGeometry(radius, radius, length, 8);
  const mesh = new THREE.Mesh(geom, mat);
  
  // Position at midpoint
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  
  // Rotate cylinder to point from 'from' to 'to'
  const upVec = new THREE.Vector3(0, 1, 0);
  direction.normalize();
  mesh.quaternion.setFromUnitVectors(upVec, direction);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function buildFloodlightTower(scene: THREE.Scene, x: number, z: number) {
  const tower = new THREE.Group();
  tower.position.set(x, 0, z);

  const legMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    metalness: 0.9,
    roughness: 0.15
  });
  
  // 4 slanted legs meeting towards the top to form a tall lattice tower
  const towerHeight = 56;
  
  const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, towerHeight, 6), legMat);
  leg1.position.set(-1.8, towerHeight / 2, -1.8);
  leg1.rotation.z = 0.035;
  leg1.rotation.x = -0.035;
  leg1.castShadow = true;
  tower.add(leg1);
  
  const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, towerHeight, 6), legMat);
  leg2.position.set(1.8, towerHeight / 2, -1.8);
  leg2.rotation.z = -0.035;
  leg2.rotation.x = -0.035;
  leg2.castShadow = true;
  tower.add(leg2);

  const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, towerHeight, 6), legMat);
  leg3.position.set(-1.8, towerHeight / 2, 1.8);
  leg3.rotation.z = 0.035;
  leg3.rotation.x = 0.035;
  leg3.castShadow = true;
  tower.add(leg3);

  const leg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, towerHeight, 6), legMat);
  leg4.position.set(1.8, towerHeight / 2, 1.8);
  leg4.rotation.z = -0.035;
  leg4.rotation.x = 0.035;
  leg4.castShadow = true;
  tower.add(leg4);

  // Horizontal structural cross-bracing beams for the lattice tower
  const braceMat = new THREE.MeshStandardMaterial({
    color: '#94A3B8',
    metalness: 0.95,
    roughness: 0.1
  });

  const drawLocalBeam = (from: THREE.Vector3, to: THREE.Vector3, radius: number) => {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const geom = new THREE.CylinderGeometry(radius, radius, len, 6);
    const mesh = new THREE.Mesh(geom, braceMat);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, dir.normalize());
    mesh.castShadow = true;
    tower.add(mesh);
  };

  // Add horizontal and diagonal cross braces at different heights
  const heights = [14, 28, 42];
  for (const h of heights) {
    const w = 1.8 * (1.0 - h / 70); // legs get closer towards top
    const p1 = new THREE.Vector3(-w, h, -w);
    const p2 = new THREE.Vector3(w, h, -w);
    const p3 = new THREE.Vector3(w, h, w);
    const p4 = new THREE.Vector3(-w, h, w);
    
    // horizontal frame rings
    drawLocalBeam(p1, p2, 0.09);
    drawLocalBeam(p2, p3, 0.09);
    drawLocalBeam(p3, p4, 0.09);
    drawLocalBeam(p4, p1, 0.09);
    
    // cross diagonals
    drawLocalBeam(p1, p3, 0.07);
    drawLocalBeam(p2, p4, 0.07);
  }

  // Head panel containing the spotlight bulb matrix
  const headGroup = new THREE.Group();
  headGroup.position.set(0, towerHeight, 0);

  // Bezel frame for light fixture
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 4.5, 0.6),
    new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5, metalness: 0.8 })
  );
  frame.castShadow = true;
  headGroup.add(frame);

  // Spotlight bulb grid: 3 rows x 6 columns (18 bulbs)
  const bulbGeo = new THREE.BoxGeometry(0.8, 0.8, 0.25);
  const bulbMat = new THREE.MeshBasicMaterial({
    color: '#FFFDF0',
    toneMapped: false
  });

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const bx = -2.25 + c * 0.9;
      const by = -1.0 + r * 1.0;
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(bx, by, 0.31);
      headGroup.add(bulb);
    }
  }

  // Tilt and orient head to face toward the pitch center (0, 8, 0)
  const worldPos = new THREE.Vector3(x, towerHeight, z);
  const targetPos = new THREE.Vector3(0, 8, 0);
  const dirToCenter = new THREE.Vector3().subVectors(targetPos, worldPos).normalize();
  
  const angleY = Math.atan2(dirToCenter.x, dirToCenter.z);
  const distanceHorizontal = Math.hypot(dirToCenter.x, dirToCenter.z);
  const angleX = -Math.atan2(dirToCenter.y, distanceHorizontal);
  
  headGroup.rotation.y = angleY;
  headGroup.rotation.x = angleX;
  
  tower.add(headGroup);
  scene.add(tower);
}

function buildStadium(scene: THREE.Scene) {
  // Concourse floor apron (Concrete grey)
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(350, 250),
    new THREE.MeshLambertMaterial({ color: '#334155' })
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.05;
  apron.receiveShadow = true;
  scene.add(apron);

  // Restored Rounded Rectangle Rings
  const rrr = roundedRectRing;
  const ring0 = rrr(58, 42, 12, 0);     // lower tier front
  const ring1 = rrr(88, 72, 36, 18);    // lower tier back / vip front
  const ring2 = rrr(91, 75, 39, 20);    // upper tier front / walkway back
  const ring3 = rrr(120, 104, 66, 42);  // upper tier back
  const ring4 = rrr(122, 106, 68, 47);  // rim wall outer
  const ring5 = rrr(98, 82, 46, 48);    // roof inner
  const ring6 = rrr(128, 112, 74, 48);  // roof outer

  // VIP Suite rings
  const vipRing0 = rrr(88.2, 72.2, 36.1, 18);
  const vipRing1 = rrr(90.8, 74.8, 38.9, 19.8);

  // Materials
  const crowdMat = new THREE.MeshBasicMaterial({ map: makeCyberCrowdTexture() });
  
  const walkwayMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    metalness: 0.8,
    roughness: 0.2
  });

  const vipMat = new THREE.MeshStandardMaterial({
    color: '#38BDF8', // Glass cyan-blue
    emissive: '#0EA5E9',
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.DoubleSide
  });

  const rimWallMat = new THREE.MeshStandardMaterial({
    color: '#CBD5E1',
    roughness: 0.7,
    metalness: 0.1
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: '#0F172A',
    transparent: true,
    opacity: 0.65,
    roughness: 0.15,
    metalness: 0.9,
    side: THREE.DoubleSide
  });

  const glassBarrierMat = new THREE.MeshStandardMaterial({
    color: '#06B6D4',
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.DoubleSide
  });

  // Add Stand meshes
  scene.add(bandMesh(ring0, ring1, crowdMat, 10));     // Lower Seating Tier
  scene.add(bandMesh(vipRing0, vipRing1, vipMat, 10)); // Glowing VIP Suites Ring
  scene.add(bandMesh(ring1, ring2, walkwayMat, 10));   // Silver Walkway
  scene.add(bandMesh(ring2, ring3, crowdMat, 13));     // Upper Seating Tier
  scene.add(bandMesh(ring3, ring4, rimWallMat, 13));   // Outer Rim Wall
  scene.add(bandMesh(ring5, ring6, roofMat, 13));      // Slate-Blue Glass Roof Ring

  // 1. Vertical Glass Barriers along Stand rims
  const lowerGlassRingLower = rrr(58, 42, 12, 0.05);
  const lowerGlassRingUpper = rrr(58, 42, 12, 1.25);
  scene.add(bandMesh(lowerGlassRingLower, lowerGlassRingUpper, glassBarrierMat, 8));

  const upperGlassRingLower = rrr(91, 75, 39, 20.05);
  const upperGlassRingUpper = rrr(91, 75, 39, 21.25);
  scene.add(bandMesh(upperGlassRingLower, upperGlassRingUpper, glassBarrierMat, 12));

  // 2. VIP Corporate Box Vertical Partition Mullions
  const mullionGeo = new THREE.BoxGeometry(0.6, 1.95, 0.6);
  const mullionMat = new THREE.MeshStandardMaterial({
    color: '#94A3B8',
    roughness: 0.6,
    metalness: 0.1
  });
  for (let i = 0; i < ring1.length; i += 2) {
    const pt = ring1[i];
    const mullion = new THREE.Mesh(mullionGeo, mullionMat);
    mullion.position.set(pt.x, 18.9, pt.z);
    mullion.lookAt(0, 18.9, 0);
    mullion.castShadow = true;
    scene.add(mullion);
  }

  // 3. Outer Structural Support Columns & Diagonal Cross-Truss Facade
  const columnGeo = new THREE.CylinderGeometry(0.3, 0.45, 48, 8);
  const columnMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    metalness: 0.9,
    roughness: 0.15
  });
  
  const trussMat = new THREE.MeshStandardMaterial({
    color: '#CBD5E1',
    metalness: 0.95,
    roughness: 0.1
  });

  for (let i = 0; i < ring6.length; i += 4) {
    const pt = ring6[i];
    
    // Vertical column
    const col = new THREE.Mesh(columnGeo, columnMat);
    col.position.set(pt.x, 24, pt.z); // Y centered at 24 (since height is 48)
    col.castShadow = true;
    scene.add(col);

    // Diagonal bracing braces crossing to the next column
    const nextIdx = (i + 4) % ring6.length;
    const ptNext = ring6[nextIdx];
    
    const b1_bottom = new THREE.Vector3(pt.x, 0, pt.z);
    const b1_top = new THREE.Vector3(pt.x, 48, pt.z);
    const b2_bottom = new THREE.Vector3(ptNext.x, 0, ptNext.z);
    const b2_top = new THREE.Vector3(ptNext.x, 48, ptNext.z);
    
    drawBeam(scene, b1_bottom, b2_top, 0.15, trussMat);
    drawBeam(scene, b1_top, b2_bottom, 0.15, trussMat);

    // 4. Radial Cantilever Roof Trusses extending inward from pillars
    const ptInner = ring5[i];
    const pOuter = new THREE.Vector3(pt.x, 48, pt.z);
    const pInner = new THREE.Vector3(ptInner.x, 48, ptInner.z);
    drawBeam(scene, pOuter, pInner, 0.22, trussMat);
  }

  // 5. Dual LED line trims (Inner Cyan + Outer Gold/Amber)
  const ledGeo = new THREE.BufferGeometry().setFromPoints(ring5);
  const ledMat = new THREE.LineBasicMaterial({
    color: '#06B6D4',
  });
  const ledLine = new THREE.Line(ledGeo, ledMat);
  ledLine.position.y += 0.1; // sit slightly above the glass roof rim
  scene.add(ledLine);

  const ledOuterGeo = new THREE.BufferGeometry().setFromPoints(ring6);
  const ledOuterMat = new THREE.LineBasicMaterial({
    color: '#F59E0B',
  });
  const ledOuterLine = new THREE.Line(ledOuterGeo, ledOuterMat);
  ledOuterLine.position.y += 0.1;
  scene.add(ledOuterLine);

  // Corner Cyber Scoreboards (angled towards pitch center)
  buildScoreboard(scene, -64, 48, Math.PI / 4);
  buildScoreboard(scene, 64, 48, -Math.PI / 4);
  buildScoreboard(scene, -64, -48, 3 * Math.PI / 4);
  buildScoreboard(scene, 64, -48, -3 * Math.PI / 4);

  // 6. Towering Stadium Corner Floodlights
  buildFloodlightTower(scene, -135, 115);
  buildFloodlightTower(scene, 135, 115);
  buildFloodlightTower(scene, -135, -115);
  buildFloodlightTower(scene, 135, -115);

  // Night sky points
  const starPos: number[] = [];
  for (let i = 0; i < 600; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = 0.15 + Math.random() * (Math.PI / 2 - 0.15);
    starPos.push(
      280 * Math.cos(e) * Math.cos(a),
      280 * Math.sin(e),
      280 * Math.cos(e) * Math.sin(a)
    );
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: '#A5F3FC', // Cyan-tinted stars
    size: 1.8,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  scene.add(stars);
}
