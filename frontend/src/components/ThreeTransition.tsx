'use client';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ThreeTransitionProps {
  onTransitionEnd: () => void;
  onMidpoint?: () => void;
  durationMs?: number;
}

interface TileData {
  id: number;
  position: [number, number, number];
  color: string;
  isAccent: boolean;
  roughness: number;
  metalness: number;
}

// Restrained palette: dark slate tones and single warm amber accent
const PALETTE = [
  { color: '#12161E', roughness: 0.52, metalness: 0.18, isAccent: false },
  { color: '#181E26', roughness: 0.48, metalness: 0.22, isAccent: false },
  { color: '#222933', roughness: 0.46, metalness: 0.25, isAccent: false },
  { color: '#D97706', roughness: 0.42, metalness: 0.35, isAccent: true }, // Amber accent tile
  { color: '#1B212B', roughness: 0.50, metalness: 0.20, isAccent: false }
];

// Damped harmonic ease with subtle overshoot (never linear)
function easeInOutDamped(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const s = 1.25; // Subtle 3% overshoot damping
  if (t < 0.5) {
    return (Math.pow(2 * t, 2) * ((s + 1) * 2 * t - s)) / 2;
  }
  const t2 = 2 * t - 2;
  return (Math.pow(t2, 2) * ((s + 1) * t2 + s) + 2) / 2;
}

// Generate rounded beveled rectangular geometry for realistic milled code tiles
function createBeveledTileGeometry(width: number, height: number, depth: number, radius: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.016,
    bevelThickness: 0.016
  });
}

// Create procedural micro-roughness noise texture for subtle surface imperfections
function createMicroNoiseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(64, 64);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = 120 + Math.floor(Math.random() * 25);
      imgData.data[i] = val;
      imgData.data[i + 1] = val;
      imgData.data[i + 2] = val;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Create soft contact shadow gradient texture
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

function Scene({
  onTransitionEnd,
  onMidpoint,
  durationMs = 750,
  wrapperRef
}: {
  onTransitionEnd: () => void;
  onMidpoint?: () => void;
  durationMs?: number;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dollyRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const midpointTriggeredRef = useRef(false);

  // Procedural assets cached with useMemo
  const noiseTexture = useMemo(() => createMicroNoiseTexture(), []);
  const shadowTexture = useMemo(() => createContactShadowTexture(), []);
  const tileGeometry = useMemo(() => createBeveledTileGeometry(1.36, 0.94, 0.04, 0.02), []);

  // 4x3 grid of physically proportioned tiles
  const tiles: TileData[] = useMemo(() => {
    const list: TileData[] = [];
    let id = 0;
    for (let row = -1; row <= 1; row++) {
      for (let col = -1.5; col <= 1.5; col += 1) {
        const pal = PALETTE[(id + 1) % PALETTE.length];
        list.push({
          id: id++,
          position: [col * 1.54, row * 1.12, 0],
          color: pal.color,
          isAccent: pal.isAccent,
          roughness: pal.roughness,
          metalness: pal.metalness
        });
      }
    }
    return list;
  }, []);

  // Dispose of all geometries, materials, and textures on unmount to prevent leaks
  useEffect(() => {
    return () => {
      tileGeometry.dispose();
      noiseTexture.dispose();
      shadowTexture.dispose();
    };
  }, [tileGeometry, noiseTexture, shadowTexture]);

  useFrame(() => {
    if (completedRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / durationMs, 1);
    const ease = easeInOutDamped(progress);

    // Smooth opacity envelope directly applied to DOM wrapper
    let opacity = 1;
    if (progress < 0.15) {
      opacity = progress / 0.15;
    } else if (progress > 0.70) {
      opacity = (1 - progress) / 0.30;
    }
    if (wrapperRef.current) {
      wrapperRef.current.style.opacity = Math.max(0, Math.min(1, opacity)).toFixed(3);
    }

    // Physical Camera Dolly Track simulation (moving dolly group with damped curve)
    if (dollyRef.current) {
      dollyRef.current.position.z = ease * 1.6;
      dollyRef.current.position.x = -Math.sin(ease * Math.PI) * 0.22;
      dollyRef.current.position.y = Math.sin(ease * Math.PI) * 0.08;
    }

    // Physical rotation of the tile grid with slight inertia
    if (groupRef.current) {
      groupRef.current.rotation.y = ease * Math.PI * 0.52;
      groupRef.current.rotation.x = Math.sin(ease * Math.PI) * 0.14;
      groupRef.current.position.z = -Math.sin(ease * Math.PI) * 1.8;
    }

    // Trigger midpoint route swap at 45% when camera is closest and tiles cover the view
    if (progress >= 0.45 && !midpointTriggeredRef.current) {
      midpointTriggeredRef.current = true;
      if (onMidpoint) onMidpoint();
    }

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onTransitionEnd();
    }
  });

  return (
    <group ref={dollyRef}>
      {/* Soft Ambient & Hemisphere Fill */}
      <hemisphereLight args={['#21262D', '#0E1116', 0.55]} />
      
      {/* Key Directional Light with Soft Highlights */}
      <directionalLight
        position={[4, 5.5, 4.5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
      />

      {/* Amber Rim Accent Light */}
      <directionalLight
        position={[-3, -2, -2]}
        intensity={0.4}
        color="#F59E0B"
      />

      {/* Main Beveled Tile Grid */}
      <group ref={groupRef}>
        {tiles.map((tile) => (
          <mesh
            key={tile.id}
            position={tile.position}
            geometry={tileGeometry}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color={tile.color}
              roughness={tile.roughness}
              metalness={tile.metalness}
              roughnessMap={noiseTexture}
              clearcoat={tile.isAccent ? 0.2 : 0.08}
              clearcoatRoughness={0.25}
              reflectivity={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Contact Shadow Ground Plane */}
      <mesh position={[0, -1.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 4]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function ThreeTransition({ onTransitionEnd, onMidpoint, durationMs = 750 }: ThreeTransitionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Safety fallback: ensure transition ends even if browser tab loses focus
    const timer = setTimeout(() => {
      onTransitionEnd();
    }, durationMs + 120);
    return () => clearTimeout(timer);
  }, [onTransitionEnd, durationMs]);

  return (
    <div
      ref={wrapperRef}
      className="route-transition-canvas-wrapper"
      aria-hidden="true"
      style={{
        backgroundColor: 'rgba(14, 17, 22, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: 0,
        pointerEvents: 'none'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance'
        }}
      >
        <Scene
          onTransitionEnd={onTransitionEnd}
          onMidpoint={onMidpoint}
          durationMs={durationMs}
          wrapperRef={wrapperRef}
        />
      </Canvas>
    </div>
  );
}
