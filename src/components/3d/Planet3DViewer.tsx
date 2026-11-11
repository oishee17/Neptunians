import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ExoplanetData } from '../../types/exoplanet';
import { classifyPlanetSize } from '../../utils/astronomy';
import { RotateCw, ZoomIn, ZoomOut, Eye, Minimize2 } from 'lucide-react';

interface Planet3DViewerProps {
  planet: ExoplanetData;
  height?: string;
  showEarthComparison?: boolean;
}

export function Planet3DViewer({
  planet,
  height = '420px',
  showEarthComparison = false,
}: Planet3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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

    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060812);

    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.5, 4.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.8;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // 5. Lighting Rig (Key + Fill + Rim)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-5, -1, -3);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x0f172a, 0x020617, 0.7);
    scene.add(hemiLight);

    // 6. Generate Procedural Planet Texture
    const sizeInfo = classifyPlanetSize(planet.pl_rade);
    const canvasTexture = createProceduralPlanetTexture(planet, sizeInfo.category);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Main Planet Mesh
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const planetRadius = 1.0;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      roughness: sizeInfo.category.includes('jupiter') || sizeInfo.category.includes('neptune') ? 0.4 : 0.85,
      metalness: 0.1,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Atmospheric Glow Mesh
    let atmosphereMesh: THREE.Mesh | null = null;
    if (showAtmosphere) {
      const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.025, 36, 36);
      const atmoColor = getAtmosphereColor(sizeInfo.category, planet.pl_eqt);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: atmoColor,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
      planetGroup.add(atmosphereMesh);
    }

    // Optional Earth Comparison Sphere
    let earthMesh: THREE.Mesh | null = null;
    if (showEarthComparison) {
      const earthRadius = planet.pl_rade ? 1.0 / planet.pl_rade : 1.0;
      const clampedEarthR = Math.max(0.12, Math.min(1.8, earthRadius));
      const earthGeo = new THREE.SphereGeometry(clampedEarthR, 32, 32);
      const earthTex = createEarthFallbackTexture();
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.8,
      });
      earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.position.set(2.4, -0.2, 0);
      scene.add(earthMesh);
    }

    // Gentle axial tilt
    planetGroup.rotation.z = THREE.MathUtils.degToRad(12);

    // Animation Loop
    let frameId = 0;
    function tick() {
      if (isRotating) {
        planetMesh.rotation.y += 0.0025;
        if (atmosphereMesh) {
          atmosphereMesh.rotation.y += 0.0018;
        }
      }
      if (earthMesh) {
        earthMesh.rotation.y += 0.004;
      }
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }
    tick();

    // Resize Handler
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
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      planetGeo.dispose();
      planetMat.dispose();
      canvasTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [planet, isRotating, showAtmosphere, showEarthComparison]);

  const handleZoom = (delta: number) => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    c.object.position.multiplyScalar(delta);
    c.update();
  };

  const handleResetCamera = () => {
    if (!controlsRef.current) return;
    controlsRef.current.reset();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#060812]">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} style={{ height }} className="w-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec Kicker (quiet, non-pill) */}
      <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-slate-400 select-none pointer-events-none">
        <span className="font-semibold text-slate-200">{planet.pl_name}</span>
        <span aria-hidden="true">·</span>
        <span>{classifyPlanetSize(planet.pl_rade).label}</span>
        <span aria-hidden="true">·</span>
        <span>Interactive 3D Globe</span>
      </div>

      {/* Collapsible Ergonomic Bottom Dock (Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 transition-transform duration-300 z-10 ${
          isControlsCollapsed ? 'translate-y-12' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-sm text-xs text-slate-200">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              isRotating ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle axial rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isRotating ? 'Spinning' : 'Paused'}</span>
          </button>

          <span className="w-px h-3.5 bg-slate-700 mx-1" />

          <button
            onClick={() => setShowAtmosphere(!showAtmosphere)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              showAtmosphere ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle atmospheric haze"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Haze</span>
          </button>

          <span className="w-px h-3.5 bg-slate-700 mx-1" />

          <button
            onClick={() => handleZoom(0.85)}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-300"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(1.15)}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-300"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="px-2 py-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-200"
            title="Reset view"
          >
            Reset
          </button>

          <span className="w-px h-3.5 bg-slate-700 mx-1" />

          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Collapse / expand dock"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Procedural planet canvas texture generation based on physical properties
 */
function createProceduralPlanetTexture(planet: ExoplanetData, category: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const eqt = planet.pl_eqt ?? 300;

  if (category.includes('jupiter') || category === 'larger-jupiter') {
    // Gas giant: colored atmospheric bands, storm oval
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    if (eqt > 1200) {
      // Hot Jupiter (molten or dark silicate bands)
      grad.addColorStop(0.0, '#38160d');
      grad.addColorStop(0.2, '#7c2d12');
      grad.addColorStop(0.4, '#ea580c');
      grad.addColorStop(0.6, '#9a3412');
      grad.addColorStop(0.8, '#451a03');
      grad.addColorStop(1.0, '#1c0a00');
    } else {
      // Jupiter/Saturn-like amber/cream bands
      grad.addColorStop(0.0, '#854d0e');
      grad.addColorStop(0.18, '#ca8a04');
      grad.addColorStop(0.35, '#fef08a');
      grad.addColorStop(0.5, '#d97706');
      grad.addColorStop(0.68, '#fde047');
      grad.addColorStop(0.85, '#92400e');
      grad.addColorStop(1.0, '#713f12');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Add turbulent zonal bands
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 16 + 4;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '60,30,10'}, ${Math.random() * 0.25})`;
      ctx.fillRect(0, y, 1024, h);
    }

    // Great red/dark storm spot
    ctx.beginPath();
    ctx.ellipse(320, 310, 75, 45, 0, 0, Math.PI * 2);
    ctx.fillStyle = eqt > 1200 ? 'rgba(254, 215, 170, 0.5)' : 'rgba(185, 28, 28, 0.7)';
    ctx.fill();
  } else if (category.includes('neptune')) {
    // Ice Giant / Sub-Neptune: azure, cyan, deep indigo with methane cirrus
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#0c4a6e');
    grad.addColorStop(0.25, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(0.75, '#0369a1');
    grad.addColorStop(1.0, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Methane cloud streaks
    for (let i = 0; i < 28; i++) {
      const y = Math.random() * 512;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(0, y, 1024, Math.random() * 8 + 2);
    }
  } else if (eqt > 1500) {
    // Ultra-hot rocky lava world (e.g., 55 Cancri e)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 1024, 512);

    // Glowing magma fractures
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      let x = Math.random() * 1024;
      let y = Math.random() * 512;
      ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += (Math.random() - 0.5) * 120;
        y += (Math.random() - 0.5) * 80;
        ctx.lineTo(x, y);
      }
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
  } else {
    // Terrestrial / Super-Earth: Continents, oceans or arid terrain
    const isWaterWorld = eqt >= 240 && eqt <= 320;
    ctx.fillStyle = isWaterWorld ? '#0369a1' : '#78716c';
    ctx.fillRect(0, 0, 1024, 512);

    // Continental landmasses
    ctx.fillStyle = isWaterWorld ? '#15803d' : '#a8a29e';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const cx = Math.random() * 1024;
      const cy = Math.random() * 512;
      const r = Math.random() * 110 + 40;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar ice caps
    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.fillRect(0, 0, 1024, 45);
    ctx.fillRect(0, 467, 1024, 45);

    // Swirling cloud cover
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * 1024,
        Math.random() * 512,
        Math.random() * 140 + 50,
        Math.random() * 25 + 10,
        Math.random() * 0.4 - 0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  return new THREE.CanvasTexture(canvas);
}

function getAtmosphereColor(category: string, eqt: number | null): number {
  if (eqt && eqt > 1400) return 0xf97316; // Orange/amber incandescent haze
  if (category.includes('neptune')) return 0x38bdf8; // Vivid cyan
  if (category.includes('jupiter')) return 0xfbbf24; // Warm amber
  return 0x60a5fa; // Earth-like nitrogen/oxygen blue Rayleigh scatter
}

function createEarthFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0284c7'; // oceans
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#16a34a'; // continents
  ctx.beginPath();
  ctx.arc(150, 110, 60, 0, Math.PI * 2);
  ctx.arc(320, 120, 75, 0, Math.PI * 2);
  ctx.arc(380, 180, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff'; // polar caps
  ctx.fillRect(0, 0, 512, 20);
  ctx.fillRect(0, 236, 512, 20);

  return new THREE.CanvasTexture(canvas);
}
