import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ExoplanetData } from '../../types/exoplanet';
import { classifyPlanetSize, getStarColor } from '../../utils/astronomy';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface PlanetarySystem3DProps {
  hostname: string;
  planets: ExoplanetData[];
  selectedPlanet: ExoplanetData | null;
  onSelectPlanet: (planet: ExoplanetData) => void;
  height?: string;
}

export function PlanetarySystem3D({
  hostname,
  planets,
  selectedPlanet,
  onSelectPlanet,
  height = '500px',
}: PlanetarySystem3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Sort planets by semi-major axis
  const sortedPlanets = [...planets].sort(
    (a, b) => (a.pl_orbsmax ?? 0) - (b.pl_orbsmax ?? 0)
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const heightPx = container.clientHeight || 500;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.set(0, 18, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below orbital plane
    controlsRef.current = controls;

    // Ambient + Center Star Point Light
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const hostStar = sortedPlanets[0];
    const starColorHex = getStarColor(hostStar?.st_spectype, hostStar?.st_teff);
    const starColor = new THREE.Color(starColorHex);

    const starLight = new THREE.PointLight(starColorHex, 4, 150);
    starLight.position.set(0, 0, 0);
    scene.add(starLight);

    // Host Star Mesh & Glow Corona
    const starGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: starColorHex });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    scene.add(starMesh);

    // Subtle star corona sprite/ring
    const coronaGeo = new THREE.RingGeometry(1.6, 2.5, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: starColorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    coronaMesh.rotation.x = Math.PI / 2;
    scene.add(coronaMesh);

    // Build Planetary Orbits & Planet Meshes
    // Illustrative spacing: map radial index to comfortable visual rings
    interface PlanetNode {
      data: ExoplanetData;
      mesh: THREE.Mesh;
      orbitalRadius: number;
      speed: number;
      currentAngle: number;
    }
    const planetNodes: PlanetNode[] = [];

    sortedPlanets.forEach((p, idx) => {
      // Non-linear visual spacing so close-in planets are clearly distinguishable
      const orbitR = 3.8 + idx * 2.4;

      // Draw Orbit Ellipse/Circle Path
      const orbitPoints: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitR, 0, Math.sin(theta) * orbitR));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const isSelected = selectedPlanet?.pl_name === p.pl_name;
      const orbitMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x38bdf8 : 0x1e293b,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.6,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);

      // Planet Sphere Geometry
      const sizeClass = classifyPlanetSize(p.pl_rade);
      let rScale = 0.35;
      if (sizeClass.category.includes('jupiter')) rScale = 0.85;
      else if (sizeClass.category.includes('neptune')) rScale = 0.55;
      else if (sizeClass.category.includes('super-earth')) rScale = 0.42;
      else if (sizeClass.category === 'earth-sized') rScale = 0.35;
      else if (sizeClass.category === 'sub-earth') rScale = 0.24;

      const pGeo = new THREE.SphereGeometry(rScale, 24, 24);
      let pColor = 0x38bdf8;
      if (sizeClass.category.includes('jupiter')) pColor = 0xf59e0b;
      else if (sizeClass.category.includes('neptune')) pColor = 0x06b6d4;
      else if (sizeClass.category.includes('earth')) pColor = 0x10b981;
      else if (sizeClass.category.includes('sub-earth')) pColor = 0xfb923c;

      const pMat = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.6,
        metalness: 0.1,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      // Attach metadata for raycasting
      pMesh.userData = { planetData: p };
      scene.add(pMesh);

      // Keplerian speed: v = 1 / sqrt(r)
      const periodDays = p.pl_orbper || 10 * (idx + 1);
      const baseSpeed = Math.max(0.002, 0.08 / Math.sqrt(periodDays));
      const initialAngle = (idx * (Math.PI * 2)) / sortedPlanets.length;

      pMesh.position.set(
        Math.cos(initialAngle) * orbitR,
        0,
        Math.sin(initialAngle) * orbitR
      );

      planetNodes.push({
        data: p,
        mesh: pMesh,
        orbitalRadius: orbitR,
        speed: baseSpeed,
        currentAngle: initialAngle,
      });
    });

    // Raycaster for clicking planets in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshesToTest = planetNodes.map((n) => n.mesh);
      const intersects = raycaster.intersectObjects(meshesToTest);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.planetData) {
          onSelectPlanet(hit.userData.planetData);
        }
      }
    };
    container.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let frameId = 0;
    function tick() {
      if (isPlaying) {
        planetNodes.forEach((node) => {
          node.currentAngle += node.speed * speedMultiplier;
          node.mesh.position.x = Math.cos(node.currentAngle) * node.orbitalRadius;
          node.mesh.position.z = Math.sin(node.currentAngle) * node.orbitalRadius;
          node.mesh.rotation.y += 0.01;
        });
      }
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hostname, planets, selectedPlanet, isPlaying, speedMultiplier]);

  const handleResetCamera = () => {
    if (!controlsRef.current) return;
    controlsRef.current.reset();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#05070f]">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ height }} className="w-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay */}
      <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-slate-400 select-none pointer-events-none">
        <span className="font-semibold text-slate-200">{hostname} System</span>
        <span aria-hidden="true">·</span>
        <span>{sortedPlanets.length} Known Worlds</span>
        <span aria-hidden="true">·</span>
        <span className="text-cyan-400 font-mono">Keplerian Orbit Simulation</span>
      </div>

      {/* Planet Selection Pill Ribbon on Top Right */}
      <div className="absolute top-3 right-4 flex items-center gap-1.5 flex-wrap max-w-sm justify-end">
        {sortedPlanets.map((p) => {
          const isSelected = selectedPlanet?.pl_name === p.pl_name;
          return (
            <button
              key={p.pl_name}
              onClick={() => onSelectPlanet(p)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors border ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {p.pl_name.replace(hostname, '').trim() || p.pl_name}
            </button>
          );
        })}
      </div>

      {/* Ergonomic Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-xs text-slate-200 backdrop-blur-sm">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
            isPlaying ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Play / Pause simulation"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Running' : 'Paused'}</span>
        </button>

        <span className="w-px h-3.5 bg-slate-700" />

        {/* Speed presets */}
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeedMultiplier(s)}
            className={`px-2 py-0.5 rounded font-mono transition-colors ${
              speedMultiplier === s
                ? 'bg-slate-700 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}

        <span className="w-px h-3.5 bg-slate-700" />

        <button
          onClick={handleResetCamera}
          className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-200"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
