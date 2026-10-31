import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Play } from 'lucide-react';

interface Hero3DStageProps {
  onExploreClick: () => void;
}

interface BlockSpec {
  id: number;
  label: string;
  position: [number, number, number];
  color: string;
  roughness: number;
  metalness: number;
  isAccent: boolean;
  scale: [number, number, number];
}

const BLOCKS: BlockSpec[] = [
  {
    id: 1,
    label: 'Issue #101: WebSocket Handover Bug',
    position: [0, 0.2, 0.5],
    color: '#D97706', // Primary amber
    roughness: 0.38,
    metalness: 0.42,
    isAccent: true,
    scale: [1.6, 1.05, 0.16]
  },
  {
    id: 2,
    label: 'Vector Embedding: 1536-dim Cosine Match',
    position: [-1.45, -0.65, -0.3],
    color: '#1F2937', // Slate dark
    roughness: 0.52,
    metalness: 0.22,
    isAccent: false,
    scale: [1.35, 0.85, 0.14]
  },
  {
    id: 3,
    label: 'Duplicate Check: 0.92 Similarity Threshold',
    position: [1.45, -0.6, -0.2],
    color: '#161B22',
    roughness: 0.46,
    metalness: 0.28,
    isAccent: false,
    scale: [1.35, 0.85, 0.14]
  },
  {
    id: 4,
    label: 'Taxonomy Classifier: Edge Runtime',
    position: [-0.95, 0.9, -0.6],
    color: '#21262D',
    roughness: 0.50,
    metalness: 0.20,
    isAccent: false,
    scale: [1.1, 0.7, 0.12]
  },
  {
    id: 5,
    label: 'Draft Synthesizer: Human in the Loop',
    position: [0.95, 0.95, -0.5],
    color: '#30363D',
    roughness: 0.48,
    metalness: 0.25,
    isAccent: false,
    scale: [1.15, 0.72, 0.12]
  }
];

function createBeveledBlock(width: number, height: number, depth: number, radius: number): THREE.BufferGeometry {
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
    bevelSize: 0.02,
    bevelThickness: 0.02
  });
}

function StageScene({
  onBlockClick,
  onHoverBlock
}: {
  onBlockClick: () => void;
  onHoverBlock: (label: string) => void;
}) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const pointerPos = useRef({ x: 0, y: 0 });

  const geometries = useMemo(() => {
    return BLOCKS.map(b => createBeveledBlock(b.scale[0], b.scale[1], b.scale[2], 0.04));
  }, []);

  useEffect(() => {
    return () => {
      geometries.forEach(g => g.dispose());
    };
  }, [geometries]);

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      // Normalize pointer [-1, 1]
      pointerPos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerPos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (rootGroupRef.current) {
      // Smooth physical tilt tracking cursor with inertia damping
      const targetRotY = pointerPos.current.x * 0.35 + Math.sin(time * 0.6) * 0.08;
      const targetRotX = -pointerPos.current.y * 0.25 + Math.cos(time * 0.5) * 0.05;

      rootGroupRef.current.rotation.y += (targetRotY - rootGroupRef.current.rotation.y) * 0.06;
      rootGroupRef.current.rotation.x += (targetRotX - rootGroupRef.current.rotation.x) * 0.06;

      // Subtle levitation breathing along Y
      rootGroupRef.current.position.y = Math.sin(time * 1.2) * 0.05;
    }
  });

  return (
    <>
      <hemisphereLight args={['#21262D', '#0E1116', 0.6]} />
      <directionalLight
        position={[4, 5, 4.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#F59E0B" />

      <group ref={rootGroupRef} onClick={onBlockClick}>
        {BLOCKS.map((block, idx) => (
          <mesh
            key={block.id}
            position={block.position}
            geometry={geometries[idx]}
            castShadow
            receiveShadow
            onPointerOver={() => onHoverBlock(block.label)}
          >
            <meshPhysicalMaterial
              color={block.color}
              roughness={block.roughness}
              metalness={block.metalness}
              clearcoat={block.isAccent ? 0.25 : 0.08}
              clearcoatRoughness={0.25}
              reflectivity={0.4}
            />
          </mesh>
        ))}

        {/* Contact Shadow Plane */}
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 3.5]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

export default function Hero3DStage({ onExploreClick }: Hero3DStageProps) {
  const [activeLabel, setActiveLabel] = useState<string>('Issue #101: WebSocket Handover Bug (Triage Score: 94%)');

  return (
    <div className="hero-3d-stage-card">
      <div className="stage-top-bar">
        <div className="stage-top-left">
          <span className="live-dot"></span>
          <span className="stage-title">Interactive 3D Stage</span>
          <span className="stage-sub font-mono">MeshPhysicalMaterial / ACESFilmic</span>
        </div>
        <button
          className="stage-action-btn"
          onClick={onExploreClick}
          aria-label="Launch 3D Transition to Triage Dashboard"
        >
          <Play size={12} />
          <span>Launch 3D Transition</span>
        </button>
      </div>

      <div className="canvas-viewport" tabIndex={0} role="region" aria-label="3D Interactive Issue Model">
        <Canvas
          camera={{ position: [0, 0, 4.4], fov: 40 }}
          dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'high-performance'
          }}
        >
          <StageScene onBlockClick={onExploreClick} onHoverBlock={setActiveLabel} />
        </Canvas>

        <div className="stage-overlay-hint">
          <span>Click blocks or rotate cursor to interact</span>
        </div>
      </div>

      <div className="stage-footer">
        <div className="stage-label-box">
          <span className="label-caption">Active 3D Block:</span>
          <span className="label-text">{activeLabel}</span>
        </div>
        <div className="stage-chips">
          <span className="stage-chip">Beveled Geometry</span>
          <span className="stage-chip">Contact Shadows</span>
          <span className="stage-chip">Camera Dolly</span>
        </div>
      </div>

      <style>{`
        .hero-3d-stage-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: var(--space-5);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }
        .stage-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-base);
          flex-wrap: wrap;
          gap: 8px;
        }
        .stage-top-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-primary);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(217, 119, 6, 0.5);
        }
        .stage-title {
          font-weight: 600;
          color: var(--ink-primary);
        }
        .stage-sub {
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .stage-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(217, 119, 6, 0.15);
          border: 1px solid rgba(217, 119, 6, 0.35);
          color: var(--accent-primary);
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 80ms ease;
        }
        .stage-action-btn:hover {
          background: var(--accent-primary);
          color: #0E1116;
        }
        .canvas-viewport {
          position: relative;
          height: 320px;
          width: 100%;
          background: radial-gradient(circle at center, #161B22 0%, #0E1116 100%);
          cursor: grab;
          outline: none;
        }
        .canvas-viewport:active {
          cursor: grabbing;
        }
        .stage-overlay-hint {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 12px;
          background: rgba(14, 17, 22, 0.75);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.6875rem;
          color: var(--ink-muted);
          pointer-events: none;
          backdrop-filter: blur(4px);
        }
        .stage-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 10px;
        }
        .stage-label-box {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
        }
        .label-caption {
          color: var(--ink-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .label-text {
          color: var(--ink-primary);
          font-weight: 500;
        }
        .stage-chips {
          display: flex;
          gap: 6px;
        }
        .stage-chip {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          padding: 2px 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--ink-muted);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
