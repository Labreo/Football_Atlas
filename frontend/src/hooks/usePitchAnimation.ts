import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TacticalAnimation, interpolatePosition } from '../tacticalModules/base';
import { useTacticalStore } from '../stores/useTacticalStore';

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

interface FormationPlayer {
  id: string;
  team: 'attack' | 'defend';
  number: number;
  x: number;
  z: number;
}

const FORMATIONS: Record<string, FormationPlayer[]> = {
  '4-3-3': [
    // Team A (Attack - Blue) on Left
    { id: 'a1', team: 'attack', number: 1, x: -44, z: 0 },
    { id: 'a2', team: 'attack', number: 2, x: -30, z: 22 },
    { id: 'a3', team: 'attack', number: 3, x: -30, z: -22 },
    { id: 'a4', team: 'attack', number: 4, x: -35, z: -8 },
    { id: 'a5', team: 'attack', number: 5, x: -35, z: 8 },
    { id: 'a6', team: 'attack', number: 6, x: -20, z: 0 },
    { id: 'a8', team: 'attack', number: 8, x: -12, z: -10 },
    { id: 'a10', team: 'attack', number: 10, x: -12, z: 10 },
    { id: 'a7', team: 'attack', number: 7, x: -5, z: 20 },
    { id: 'a11', team: 'attack', number: 11, x: -5, z: -20 },
    { id: 'a9', team: 'attack', number: 9, x: -8, z: 0 },
    
    // Team B (Defend - Red) on Right
    { id: 'b1', team: 'defend', number: 1, x: 44, z: 0 },
    { id: 'b2', team: 'defend', number: 2, x: 30, z: -22 },
    { id: 'b3', team: 'defend', number: 3, x: 30, z: 22 },
    { id: 'b4', team: 'defend', number: 4, x: 35, z: 8 },
    { id: 'b5', team: 'defend', number: 5, x: 35, z: -8 },
    { id: 'b6', team: 'defend', number: 6, x: 20, z: 0 },
    { id: 'b8', team: 'defend', number: 8, x: 12, z: 10 },
    { id: 'b10', team: 'defend', number: 10, x: 12, z: -10 },
    { id: 'b7', team: 'defend', number: 7, x: 5, z: -20 },
    { id: 'b11', team: 'defend', number: 11, x: 5, z: 20 },
    { id: 'b9', team: 'defend', number: 9, x: 8, z: 0 },
  ],
  '4-4-2': [
    // Team A (Attack - Blue) on Left
    { id: 'a1', team: 'attack', number: 1, x: -44, z: 0 },
    { id: 'a2', team: 'attack', number: 2, x: -30, z: 22 },
    { id: 'a3', team: 'attack', number: 3, x: -30, z: -22 },
    { id: 'a4', team: 'attack', number: 4, x: -35, z: -8 },
    { id: 'a5', team: 'attack', number: 5, x: -35, z: 8 },
    { id: 'a6', team: 'attack', number: 6, x: -18, z: -6 },
    { id: 'a8', team: 'attack', number: 8, x: -18, z: 6 },
    { id: 'a7', team: 'attack', number: 7, x: -15, z: 22 },
    { id: 'a11', team: 'attack', number: 11, x: -15, z: -22 },
    { id: 'a9', team: 'attack', number: 9, x: -6, z: -8 },
    { id: 'a10', team: 'attack', number: 10, x: -6, z: 8 },

    // Team B (Defend - Red) on Right
    { id: 'b1', team: 'defend', number: 1, x: 44, z: 0 },
    { id: 'b2', team: 'defend', number: 2, x: 30, z: -22 },
    { id: 'b3', team: 'defend', number: 3, x: 30, z: 22 },
    { id: 'b4', team: 'defend', number: 4, x: 35, z: 8 },
    { id: 'b5', team: 'defend', number: 5, x: 35, z: -8 },
    { id: 'b6', team: 'defend', number: 6, x: 18, z: 6 },
    { id: 'b8', team: 'defend', number: 8, x: 18, z: -6 },
    { id: 'b7', team: 'defend', number: 7, x: 15, z: -22 },
    { id: 'b11', team: 'defend', number: 11, x: 15, z: 22 },
    { id: 'b9', team: 'defend', number: 9, x: 6, z: 8 },
    { id: 'b10', team: 'defend', number: 10, x: 6, z: -8 },
  ],
  '3-5-2': [
    // Team A (Attack - Blue) on Left
    { id: 'a1', team: 'attack', number: 1, x: -44, z: 0 },
    { id: 'a4', team: 'attack', number: 4, x: -35, z: 0 },
    { id: 'a3', team: 'attack', number: 3, x: -35, z: -12 },
    { id: 'a5', team: 'attack', number: 5, x: -35, z: 12 },
    { id: 'a2', team: 'attack', number: 2, x: -20, z: 24 },
    { id: 'a11', team: 'attack', number: 11, x: -20, z: -24 },
    { id: 'a6', team: 'attack', number: 6, x: -22, z: 0 },
    { id: 'a8', team: 'attack', number: 8, x: -12, z: -8 },
    { id: 'a10', team: 'attack', number: 10, x: -12, z: 8 },
    { id: 'a7', team: 'attack', number: 7, x: -6, z: -8 },
    { id: 'a9', team: 'attack', number: 9, x: -6, z: 8 },

    // Team B (Defend - Red) on Right
    { id: 'b1', team: 'defend', number: 1, x: 44, z: 0 },
    { id: 'b4', team: 'defend', number: 4, x: 35, z: 0 },
    { id: 'b3', team: 'defend', number: 3, x: 35, z: 12 },
    { id: 'b5', team: 'defend', number: 5, x: 35, z: -12 },
    { id: 'b2', team: 'defend', number: 2, x: 20, z: -24 },
    { id: 'b11', team: 'defend', number: 11, x: 20, z: 24 },
    { id: 'b6', team: 'defend', number: 6, x: 22, z: 0 },
    { id: 'b8', team: 'defend', number: 8, x: 12, z: 8 },
    { id: 'b10', team: 'defend', number: 10, x: 12, z: -8 },
    { id: 'b7', team: 'defend', number: 7, x: 6, z: 8 },
    { id: 'b9', team: 'defend', number: 9, x: 6, z: -8 },
  ]
};

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

  // Access reactive store states
  const { 
    formation, 
    teamAVisible, 
    teamBVisible, 
    cameraResetTrigger,
    cameraPanDirection,
    cameraZoom,
  } = useTacticalStore();

  // Store 3D objects for reference during updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const playersGroupRef = useRef<THREE.Group | null>(null);
  const overlaysGroupRef = useRef<THREE.Group | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);

  // Helper to create shirt number CanvasTexture for Cylinder Top Face
  const createPlayerDiscTexture = (number: number | string, team: 'attack' | 'defend' | 'defense') => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear background with royal blue or tactical red
      ctx.fillStyle = team === 'attack' ? '#1D4ED8' : '#DC2626'; // Blue / Red
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();

      // White border circle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(64, 64, 55, 0, Math.PI * 2);
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 50px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.toString(), 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Initialize Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = null; // Transparent scene to reveal underlying CSS gradient
    sceneRef.current = scene;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 1000);
    // Beautiful default isometric elevated angle
    camera.position.set(0, 55, 80);
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
    rendererRef.current = renderer;

    // 2. Initialize OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going below pitch
    controls.minPolarAngle = 0.15;
    controls.minDistance = 25;
    controls.maxDistance = 140;
    controlsRef.current = controls;

    // 3. Add Lighting Rig
    const ambientLight = new THREE.AmbientLight('#1E293B', 1.8);
    scene.add(ambientLight);

    // Warm daylight directional source for shadows
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

    // Soft spotlight filling key central areas
    const fillLight = new THREE.DirectionalLight('#60A5FA', 0.5);
    fillLight.position.set(-40, 40, -20);
    scene.add(fillLight);

    // 4. Draw Premium Floating Pitch Platform
    const pitchWidth = 100;
    const pitchLength = 68;
    // Margins around play bounds
    const platformWidth = 106;
    const platformLength = 74;
    const platformThickness = 2.0;

    // Materials array for BoxGeometry faces
    // Polish slate for sides, grass green for top
    const sideMat = new THREE.MeshStandardMaterial({
      color: '#151D2A',
      roughness: 0.5,
      metalness: 0.85
    });
    const topMat = new THREE.MeshStandardMaterial({
      color: '#428545', // Natural organic green grass tone
      roughness: 0.95,
      metalness: 0.02
    });
    const bottomMat = new THREE.MeshStandardMaterial({
      color: '#090D14',
      roughness: 0.9
    });

    const pitchMaterials = [
      sideMat,   // Right
      sideMat,   // Left
      topMat,    // Top
      bottomMat, // Bottom
      sideMat,   // Front
      sideMat    // Back
    ];

    const pitchGeo = new THREE.BoxGeometry(platformWidth, platformThickness, platformLength);
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMaterials);
    pitchMesh.position.y = -platformThickness / 2; // top of pitch matches Y=0
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // 5. Draw Accurate Pitch Markings
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

    // Outer Boundary lines
    createLine(pitchWidth, lineWidth, 0, -pitchLength / 2); // Top boundary
    createLine(pitchWidth, lineWidth, 0, pitchLength / 2);  // Bottom boundary
    createLine(lineWidth, pitchLength, -pitchWidth / 2, 0); // Left boundary
    createLine(lineWidth, pitchLength, pitchWidth / 2, 0);  // Right boundary

    // Center Line
    createLine(lineWidth, pitchLength, 0, 0);

    // Left Penalty Box
    const penW = 16.5;
    const penL = 40.32;
    createLine(penW, lineWidth, -pitchWidth / 2 + penW / 2, -penL / 2);
    createLine(penW, lineWidth, -pitchWidth / 2 + penW / 2, penL / 2);
    createLine(lineWidth, penL, -pitchWidth / 2 + penW, 0);

    // Left Goal Area
    const goalAreaW = 5.5;
    const goalAreaL = 18.32;
    createLine(goalAreaW, lineWidth, -pitchWidth / 2 + goalAreaW / 2, -goalAreaL / 2);
    createLine(goalAreaW, lineWidth, -pitchWidth / 2 + goalAreaW / 2, goalAreaL / 2);
    createLine(lineWidth, goalAreaL, -pitchWidth / 2 + goalAreaW, 0);

    // Right Penalty Box
    createLine(penW, lineWidth, pitchWidth / 2 - penW / 2, -penL / 2);
    createLine(penW, lineWidth, pitchWidth / 2 - penW / 2, penL / 2);
    createLine(lineWidth, penL, pitchWidth / 2 - penW, 0);

    // Right Goal Area
    createLine(goalAreaW, lineWidth, pitchWidth / 2 - goalAreaW / 2, -goalAreaL / 2);
    createLine(goalAreaW, lineWidth, pitchWidth / 2 - goalAreaW / 2, goalAreaL / 2);
    createLine(lineWidth, goalAreaL, pitchWidth / 2 - goalAreaW, 0);

    // Spots (Center + Penalties)
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

    // Center Circle Arc
    const circleRingGeo = new THREE.RingGeometry(9.15, 9.15 + lineWidth, 64);
    const circleRing = new THREE.Mesh(circleRingGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide }));
    circleRing.rotation.x = -Math.PI / 2;
    circleRing.position.set(0, 0.015, 0);
    lineGroup.add(circleRing);

    // Corner Arcs (4 corners)
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

    // Top-Left corner: inside quadrant is bottom-right (+X, +Z) -> thetaStart = 270 deg (3 * Math.PI / 2)
    createCornerArc(-pitchWidth / 2, -pitchLength / 2, 3 * Math.PI / 2);
    
    // Top-Right corner: inside quadrant is bottom-left (-X, +Z) -> thetaStart = 180 deg (Math.PI)
    createCornerArc(pitchWidth / 2, -pitchLength / 2, Math.PI);
    
    // Bottom-Left corner: inside quadrant is top-right (+X, -Z) -> thetaStart = 0 deg (0)
    createCornerArc(-pitchWidth / 2, pitchLength / 2, 0);
    
    // Bottom-Right corner: inside quadrant is top-left (-X, -Z) -> thetaStart = 90 deg (Math.PI / 2)
    createCornerArc(pitchWidth / 2, pitchLength / 2, Math.PI / 2);

    scene.add(lineGroup);

    // 6. Draw Premium White Goals with Net structures
    const goalPostMat = new THREE.MeshStandardMaterial({ 
      color: '#F8FAFC', 
      roughness: 0.15, 
      metalness: 0.1 
    });
    const postRadius = 0.15;
    const postHeight = 2.44;
    const goalWidth = 7.32;
    const goalDepth = 2.0;

    // Create geometries and materials once in outer scope
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth + postRadius * 2, 16);
    const backPostGeo = new THREE.CylinderGeometry(postRadius * 0.8, postRadius * 0.8, goalDepth, 16);
    const strutGeo = new THREE.CylinderGeometry(postRadius * 0.6, postRadius * 0.6, Math.sqrt(postHeight * postHeight + goalDepth * goalDepth), 16);
    const netBoxGeo = new THREE.BoxGeometry(goalDepth, postHeight, goalWidth);
    const netMat = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const netWireGeo = new THREE.EdgesGeometry(netBoxGeo);
    const netWireMat = new THREE.LineBasicMaterial({ color: '#E2E8F0', transparent: true, opacity: 0.35 });

    const createGoalMesh = (posX: number, rotateY: boolean) => {
      const goalGroup = new THREE.Group();

      // Posts
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

      // Back support posts
      const backPostLeft = new THREE.Mesh(backPostGeo, goalPostMat);
      backPostLeft.rotation.z = Math.PI / 2;
      backPostLeft.position.set(-goalDepth / 2, 0.05, -goalWidth / 2);
      goalGroup.add(backPostLeft);

      const backPostRight = backPostLeft.clone();
      backPostRight.position.set(-goalDepth / 2, 0.05, goalWidth / 2);
      goalGroup.add(backPostRight);

      // Support strut
      const strutLeft = new THREE.Mesh(strutGeo, goalPostMat);
      strutLeft.rotation.z = Math.atan2(postHeight, goalDepth);
      strutLeft.position.set(-goalDepth / 2, postHeight / 2, -goalWidth / 2);
      goalGroup.add(strutLeft);

      const strutRight = strutLeft.clone();
      strutRight.position.set(-goalDepth / 2, postHeight / 2, goalWidth / 2);
      goalGroup.add(strutRight);

      // Net Box Geometry (semi-transparent mesh with wireframe overlay)
      const netMesh = new THREE.Mesh(netBoxGeo, netMat);
      netMesh.position.set(-goalDepth / 2, postHeight / 2, 0);
      goalGroup.add(netMesh);

      // Net Wireframe Outline
      const netWire = new THREE.LineSegments(netWireGeo, netWireMat);
      netWire.position.set(-goalDepth / 2, postHeight / 2, 0);
      goalGroup.add(netWire);

      goalGroup.position.set(posX, 0, 0);
      if (rotateY) goalGroup.rotation.y = Math.PI;

      return goalGroup;
    };

    scene.add(createGoalMesh(-pitchWidth / 2, false));
    scene.add(createGoalMesh(pitchWidth / 2, true));

    // 7. Dynamic groups
    const playersGroup = new THREE.Group();
    scene.add(playersGroup);
    playersGroupRef.current = playersGroup;

    const overlaysGroup = new THREE.Group();
    scene.add(overlaysGroup);
    overlaysGroupRef.current = overlaysGroup;

    // Resizing Observer
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

    clockRef.current.start();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      
      // Dispose materials & geometries
      pitchGeo.dispose();
      sideMat.dispose();
      topMat.dispose();
      bottomMat.dispose();
      lineMat.dispose();
      spotGeo.dispose();
      spotMat.dispose();
      circleRingGeo.dispose();
      cornerGeos.forEach(geo => geo.dispose());
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

  // Update dynamic elements when concept animation or formation changes
  useEffect(() => {
    const scene = sceneRef.current;
    const playersGroup = playersGroupRef.current;
    if (!scene || !playersGroup) return;

    // Clear old player meshes
    while (playersGroup.children.length > 0) {
      const child = playersGroup.children[0];
      child.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach((m) => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (node.material.map) node.material.map.dispose();
              node.material.dispose();
            }
          }
        }
      });
      playersGroup.remove(child);
    }

    // Clear old ball
    if (ballMeshRef.current) {
      scene.remove(ballMeshRef.current);
      ballMeshRef.current = null;
    }

    // Determine current configuration: animation or standard formation
    if (animation) {
      // 1. Ingest Animation players
      animation.players.forEach((p) => {
        const playerToken = new THREE.Group();
        playerToken.name = p.id;
        playerToken.userData = { team: p.team };

        // Cylinder disc base (glossy with CanvasTexture top)
        const discHeight = 0.35;
        const discRadius = 1.35;
        const sideColor = p.team === 'attack' ? '#1D4ED8' : '#DC2626'; // Blue / Red
        
        const sideMat = new THREE.MeshStandardMaterial({
          color: sideColor,
          roughness: 0.15,
          metalness: 0.35
        });
        const topTexture = createPlayerDiscTexture(p.number, p.team);
        const topMat = new THREE.MeshStandardMaterial({
          map: topTexture,
          roughness: 0.1
        });

        // 3 Cylinder materials: 0=Side, 1=Top, 2=Bottom
        const discMaterials = [sideMat, topMat, sideMat];
        const tokenMesh = new THREE.Mesh(new THREE.CylinderGeometry(discRadius, discRadius, discHeight, 32), discMaterials);
        tokenMesh.position.y = discHeight / 2; // sits on pitch Y=0
        tokenMesh.castShadow = true;
        tokenMesh.receiveShadow = false;
        playerToken.add(tokenMesh);

        // Position player at startup position
        playerToken.position.set(p.startPos.x, 0, p.startPos.z);
        
        // Match visibility settings
        playerToken.visible = p.team === 'attack' ? teamAVisible : teamBVisible;
        
        playersGroup.add(playerToken);
      });

      // 2. Build Ball
      const ballGeo = new THREE.SphereGeometry(0.55, 32, 32);
      const ballMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.25,
        metalness: 0.1
      });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(animation.ball.startPos.x, 0.275, animation.ball.startPos.z);
      ball.castShadow = true;
      scene.add(ball);
      ballMeshRef.current = ball;

    } else {
      // 3. Render Static Formation players
      const formPlayers = FORMATIONS[formation] || FORMATIONS['4-3-3'];
      formPlayers.forEach((p) => {
        const playerToken = new THREE.Group();
        playerToken.name = p.id;
        playerToken.userData = { team: p.team };

        const discHeight = 0.35;
        const discRadius = 1.35;
        const sideColor = p.team === 'attack' ? '#1D4ED8' : '#DC2626';

        const sideMat = new THREE.MeshStandardMaterial({
          color: sideColor,
          roughness: 0.15,
          metalness: 0.35
        });
        const topTexture = createPlayerDiscTexture(p.number, p.team);
        const topMat = new THREE.MeshStandardMaterial({
          map: topTexture,
          roughness: 0.1
        });

        const discMaterials = [sideMat, topMat, sideMat];
        const tokenMesh = new THREE.Mesh(new THREE.CylinderGeometry(discRadius, discRadius, discHeight, 32), discMaterials);
        tokenMesh.position.y = discHeight / 2;
        tokenMesh.castShadow = true;
        playerToken.add(tokenMesh);

        playerToken.position.set(p.x, 0, p.z);
        
        playersGroup.add(playerToken);
      });

      // Render stationary ball at center of the pitch
      const ballGeo = new THREE.SphereGeometry(0.55, 32, 32);
      const ballMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.25,
        metalness: 0.1
      });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(0, 0.275, 0); // Sits on pitch grass at center spot
      ball.castShadow = true;
      scene.add(ball);
      ballMeshRef.current = ball;
    }

    timeRef.current = 0;
  }, [animation, formation, teamAVisible, teamBVisible]);

  // Handle camera reset updates
  useEffect(() => {
    if (cameraResetTrigger === 0) return;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    
    // Smoothly reset camera position and target
    controls.target.set(0, 0, 0);
    camera.position.set(0, 55, 80);
    camera.zoom = 1.0;
    camera.updateProjectionMatrix();
    controls.update();
  }, [cameraResetTrigger]);

  // Handle zoom slider updates
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera) return;
    camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.update();
    }
  }, [cameraZoom]);

  // Handle arrow pad camera rotations (panning/tilting)
  useEffect(() => {
    if (cameraPanDirection.count === 0) return;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);

    const dir = cameraPanDirection.dir;
    if (dir === 'left') {
      spherical.theta -= 0.18; // Rotate camera horizontal left
    } else if (dir === 'right') {
      spherical.theta += 0.18; // Rotate camera horizontal right
    } else if (dir === 'up') {
      spherical.phi = Math.max(0.12, spherical.phi - 0.1); // Tilt camera up
    } else if (dir === 'down') {
      spherical.phi = Math.min(Math.PI / 2 - 0.05, spherical.phi + 0.1); // Tilt camera down
    }

    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }, [cameraPanDirection.count]);

  // Main rendering & physics update loop
  useEffect(() => {
    const render = () => {
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const playersGroup = playersGroupRef.current;
      const overlaysGroup = overlaysGroupRef.current;
      const ball = ballMeshRef.current;

      if (!scene || !renderer || !camera) return;

      const delta = clockRef.current.getDelta();
      
      // Update time progression based on playState
      if (playState === 'playing' && animation) {
        timeRef.current += (delta * 0.08 * playSpeed);
        if (timeRef.current > 1) {
          timeRef.current = 0; // Loop animation
        }
      } else if (playState === 'stopped') {
        timeRef.current = 0;
      }

      const t = timeRef.current;

      // Update positions for active concept animations
      if (animation && playersGroup && ball && overlaysGroup) {
        // 1. Move players
        animation.players.forEach((p) => {
          const playerObj = playersGroup.getObjectByName(p.id);
          if (playerObj) {
            const pos = interpolatePosition(p.keyFrames, p.startPos, t);
            playerObj.position.set(pos.x, 0, pos.z);
          }
        });

        // 2. Move ball with simple arc elevation
        const ballPos = interpolatePosition(animation.ball.keyFrames, animation.ball.startPos, t);
        let height = 0.275;
        if (playState === 'playing') {
          // Visual pass arc: sine curve mapped across passes
          height = 0.275 + Math.sin(t * Math.PI * 4) * 1.5; 
          if (height < 0.275) height = 0.275;
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

        // Passing Lanes (Emissive Cyan lines)
        if (overlays.passingLanes) {
          animation.passingLanes.forEach((lane) => {
            if (t >= lane.startFrame && t <= lane.endFrame) {
              const fromObj = playersGroup.getObjectByName(lane.fromPlayer);
              const toObj = playersGroup.getObjectByName(lane.toPlayer);
              if (fromObj && toObj) {
                const points = [fromObj.position.clone(), toObj.position.clone()];
                points.forEach(p => p.y = 0.15); // Elevate line slightly above grass

                const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
                const curveMat = new THREE.LineBasicMaterial({
                  color: '#00F3FF', // Emissive Cyan
                  linewidth: 3,
                });
                const line = new THREE.Line(curveGeo, curveMat);
                overlaysGroup.add(line);
              }
            }
          });
        }

        // Running Paths (Dashed Bright Green lines with directional arrows)
        if (overlays.movementPaths) {
          animation.runningPaths.forEach((path) => {
            if (t >= path.startFrame && t <= path.endFrame) {
              const points: THREE.Vector3[] = path.points.map(p => new THREE.Vector3(p.x, 0.1, p.z));
              const curve = new THREE.CatmullRomCurve3(points);
              const curvePoints = curve.getPoints(50);
              const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
              
              const curveMat = new THREE.LineDashedMaterial({
                color: '#39FF14', // Bright Neon Green
                dashSize: 1.5,
                gapSize: 1,
              });
              const line = new THREE.Line(curveGeo, curveMat);
              line.computeLineDistances();
              overlaysGroup.add(line);

              // Draw arrow helper at the end of path
              const dir = new THREE.Vector3()
                .subVectors(points[points.length - 1], points[points.length - 2])
                .normalize();
              const arrow = new THREE.ArrowHelper(
                dir,
                points[points.length - 1],
                3,
                '#39FF14',
                1.0,
                0.7
              );
              overlaysGroup.add(arrow);
            }
          });
        }

        // Pressing Zones (Vibrant soft Rings)
        if (overlays.pressingZones) {
          animation.pressingZones.forEach((zone) => {
            if (t >= zone.startFrame && t <= zone.endFrame) {
              const colorCode = zone.color === 'red' ? '#FF0055' : (zone.color === 'green' ? '#39FF14' : '#00F3FF');
              const ringGeo = new THREE.RingGeometry(zone.radius - 0.2, zone.radius, 32);
              const ringMat = new THREE.MeshBasicMaterial({
                color: colorCode,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
              });
              const mesh = new THREE.Mesh(ringGeo, ringMat);
              mesh.rotation.x = -Math.PI / 2;
              mesh.position.set(zone.center.x, 0.15, zone.center.z);
              overlaysGroup.add(mesh);
            }
          });
        }
      }

      // Update controls damping
      if (controls) {
        controls.update();
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [animation, playState, playSpeed, overlays]);

  return { containerRef, canvasRef, timeRef, controlsRef, cameraRef };
}
