import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { useTacticalStore } from '../stores/useTacticalStore';

export function usePitchEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<TacticalAnimationEngine | null>(null);

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
    camera.position.set(0, 135, 0.1);
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
    const topMat = new THREE.MeshStandardMaterial({
      color: '#428545',
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

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
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
