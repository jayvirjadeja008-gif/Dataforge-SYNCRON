'use client';
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GitPullRequest } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface VectorNode {
  id: number;
  issueNumber: number;
  title: string;
  category: string;
  coords: [number, number, number];
  color: string;
  size: number;
  isIncoming?: boolean;
  duplicateOf?: number;
  similarity?: number;
}

const HISTORICAL_NODES: VectorNode[] = [
  {
    id: 1,
    issueNumber: 412,
    title: 'WebSocket connection drops state on cellular handover',
    category: 'Networking Bug',
    coords: [1.2, 0.4, 0.8],
    color: '#D97706',
    size: 0.16,
    isIncoming: true,
    duplicateOf: 384,
    similarity: 0.92
  },
  {
    id: 2,
    issueNumber: 384,
    title: 'Socket connection state loss during network switch',
    category: 'Networking Bug',
    coords: [1.05, 0.35, 0.72],
    color: '#B45309',
    size: 0.14
  },
  {
    id: 3,
    issueNumber: 413,
    title: 'Worker thread pool retains memory references on reject',
    category: 'Memory Leak',
    coords: [-1.4, -0.6, 0.5],
    color: '#EF4444',
    size: 0.15
  },
  {
    id: 4,
    issueNumber: 295,
    title: 'Linear heap allocation increase during unhandled rejections',
    category: 'Memory Leak',
    coords: [-1.3, -0.5, 0.42],
    color: '#DC2626',
    size: 0.13
  },
  {
    id: 5,
    issueNumber: 414,
    title: 'Add code example for passing custom authorization headers',
    category: 'Documentation',
    coords: [0.2, 1.4, -0.9],
    color: '#2563EB',
    size: 0.14
  },
  {
    id: 6,
    issueNumber: 350,
    title: 'Update quick start guide with bearer token authentication',
    category: 'Documentation',
    coords: [0.3, 1.35, -0.85],
    color: '#1D4ED8',
    size: 0.13
  },
  {
    id: 7,
    issueNumber: 405,
    title: 'Fix typo in README contributing guidelines for newcomers',
    category: 'Good First Issue',
    coords: [0.6, 1.1, -1.2],
    color: '#10B981',
    size: 0.13
  },
  {
    id: 8,
    issueNumber: 420,
    title: 'Data pipeline ingestion stalls on corrupted UTF-8 payloads',
    category: 'Data Pipeline',
    coords: [-0.8, 0.2, 1.3],
    color: '#F59E0B',
    size: 0.15
  }
];

function VectorSpaceScene({
  selectedNode,
  onSelectNode
}: {
  selectedNode: VectorNode | null;
  onSelectNode: (node: VectorNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pointerPos = useRef({ x: 0, y: 0 });

  // Sphere geometry shared
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);

  // Connection line between duplicate pair (Issue 412 -> 384)
  const lineGeometry = useMemo(() => {
    const p1 = new THREE.Vector3(1.2, 0.4, 0.8);
    const p2 = new THREE.Vector3(1.05, 0.35, 0.72);
    const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      lineGeometry.dispose();
    };
  }, [sphereGeo, lineGeometry]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      pointerPos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerPos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Slow ambient orbital rotation plus mouse tilt
      const targetY = time * 0.15 + pointerPos.current.x * 0.4;
      const targetX = pointerPos.current.y * 0.25;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <>
      <hemisphereLight args={['#21262D', '#0E1116', 0.6]} />
      <directionalLight position={[4, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, -3, -2]} intensity={0.4} color="#F59E0B" />

      {/* Axis Guide Grid */}
      <gridHelper args={[6, 12, '#30363D', '#161B22']} position={[0, -1.8, 0]} />

      <group ref={groupRef}>
        {/* Pulsing duplicate laser connection line */}
        <primitive object={new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial({ color: '#F59E0B', linewidth: 2 })
        )} />

        {/* Vector Nodes */}
        {HISTORICAL_NODES.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          return (
            <mesh
              key={node.id}
              position={node.coords}
              scale={[node.size, node.size, node.size]}
              geometry={sphereGeo}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
                playClickSound();
              }}
            >
              <meshPhysicalMaterial
                color={node.color}
                roughness={0.35}
                metalness={0.3}
                clearcoat={0.3}
                emissive={isSelected ? '#F59E0B' : '#000000'}
                emissiveIntensity={isSelected ? 0.6 : 0}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

export default function VectorSpace3D() {
  const [selectedNode, setSelectedNode] = useState<VectorNode | null>(HISTORICAL_NODES[0]);

  return (
    <div className="vector-space-card">
      <div className="vector-header">
        <div className="vector-header-left">
          <GitPullRequest size={15} className="vector-icon" />
          <span className="vector-title">3D Vector Embedding Space</span>
          <span className="vector-badge font-mono">1536-dim text-embedding-3-small</span>
        </div>
        <div className="vector-header-right">
          <span className="vector-metric font-mono">Similarity Threshold: 0.88 Cosine Distance</span>
        </div>
      </div>

      <div className="vector-canvas-wrapper" role="region" aria-label="3D Vector Space Visualization">
        <Canvas
          camera={{ position: [0, 0, 4.6], fov: 42 }}
          dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'high-performance'
          }}
        >
          <VectorSpaceScene
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        </Canvas>

        {/* Floating HUD Panel */}
        {selectedNode && (
          <div className="vector-hud-card">
            <div className="hud-top">
              <span className="hud-tag" style={{ borderColor: selectedNode.color, color: selectedNode.color }}>
                {selectedNode.category}
              </span>
              <span className="hud-issue font-mono">Issue #{selectedNode.issueNumber}</span>
            </div>
            <div className="hud-title">{selectedNode.title}</div>
            
            {selectedNode.duplicateOf && (
              <div className="hud-duplicate-alert">
                <span>Flagged Duplicate of Issue #{selectedNode.duplicateOf}</span>
                <span className="hud-sim font-mono">Cosine Similarity: {(selectedNode.similarity! * 100).toFixed(0)}%</span>
              </div>
            )}

            <div className="hud-coords font-mono">
              Vector Coordinates: [{selectedNode.coords.join(', ')}]
            </div>
          </div>
        )}

        <div className="vector-hint-bar">
          <span>Click any 3D node to inspect semantic embedding metadata and duplicate proximity</span>
        </div>
      </div>

      <div className="vector-legend">
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#D97706' }}></span>
          <span>Bugs &amp; Networking</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#EF4444' }}></span>
          <span>Memory &amp; Leaks</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#2563EB' }}></span>
          <span>Documentation</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#10B981' }}></span>
          <span>Good First Issues</span>
        </div>
      </div>

      <style>{`
        .vector-space-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: var(--space-4);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }
        .vector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-base);
          flex-wrap: wrap;
          gap: 10px;
        }
        .vector-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vector-icon {
          color: var(--accent-primary);
        }
        .vector-title {
          font-weight: 600;
          color: var(--ink-primary);
          font-size: 0.875rem;
        }
        .vector-badge {
          font-size: 0.6875rem;
          padding: 2px 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 2px;
          color: var(--ink-muted);
        }
        .vector-metric {
          font-size: 0.75rem;
          color: var(--accent-primary);
        }
        .vector-canvas-wrapper {
          position: relative;
          height: 380px;
          width: 100%;
          background: radial-gradient(circle at center, #161B22 0%, #0E1116 100%);
          cursor: grab;
        }
        .vector-canvas-wrapper:active {
          cursor: grabbing;
        }
        .vector-hud-card {
          position: absolute;
          top: 16px;
          left: 16px;
          max-width: 320px;
          background: rgba(14, 17, 22, 0.88);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 14px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .hud-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .hud-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 1px 6px;
          border: 1px solid;
          border-radius: 2px;
        }
        .hud-issue {
          font-size: 0.75rem;
          color: var(--ink-muted);
          font-weight: 600;
        }
        .hud-title {
          font-size: 0.8125rem;
          color: var(--ink-primary);
          font-weight: 500;
          line-height: 1.35;
          margin-bottom: 8px;
        }
        .hud-duplicate-alert {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 8px;
          background: rgba(217, 119, 6, 0.12);
          border: 1px solid rgba(217, 119, 6, 0.3);
          border-radius: 2px;
          font-size: 0.6875rem;
          color: var(--accent-primary);
          margin-bottom: 8px;
        }
        .hud-sim {
          font-weight: 700;
        }
        .hud-coords {
          font-size: 0.625rem;
          color: var(--ink-faint);
        }
        .vector-hint-bar {
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
        .vector-legend {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 10px 16px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--ink-secondary);
        }
        .legend-swatch {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
