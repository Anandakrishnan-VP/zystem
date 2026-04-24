import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Lightweight 3D backdrop for the auth page.
 * - Wireframe geometric primitives
 * - Reacts to mouse via parallax + per-mesh tilt
 * - Theme-aware: reads --foreground / --primary at mount
 */

const readHsl = (varName: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `hsl(${v})` : fallback;
};

type ShapeProps = {
  position: [number, number, number];
  geometry: 'icosahedron' | 'octahedron' | 'torus' | 'box' | 'tetra' | 'ring';
  scale?: number;
  speed?: number;
  color: string;
};

const Shape = ({ position, geometry, scale = 1, speed = 1, color }: ShapeProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  const geo = useMemo(() => {
    switch (geometry) {
      case 'icosahedron': return new THREE.IcosahedronGeometry(1, 0);
      case 'octahedron': return new THREE.OctahedronGeometry(1, 0);
      case 'torus': return new THREE.TorusGeometry(0.8, 0.25, 8, 24);
      case 'box': return new THREE.BoxGeometry(1.2, 1.2, 1.2);
      case 'tetra': return new THREE.TetrahedronGeometry(1.1, 0);
      case 'ring': return new THREE.RingGeometry(0.7, 1, 32);
    }
  }, [geometry]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    // Continuous gentle rotation
    ref.current.rotation.x += delta * 0.15 * speed;
    ref.current.rotation.y += delta * 0.2 * speed;

    // Parallax — drift toward mouse
    const targetX = position[0] + mouse.x * 0.6;
    const targetY = position[1] + mouse.y * 0.6;
    ref.current.position.x += (targetX - ref.current.position.x) * 0.04;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.04;

    // Subtle bobbing
    const t = state.clock.elapsedTime;
    ref.current.position.z = position[2] + Math.sin(t * 0.6 * speed + position[0]) * 0.15;
  });

  return (
    <mesh ref={ref} position={position} scale={scale} geometry={geo}>
      <meshBasicMaterial color={color} wireframe transparent opacity={0.55} />
    </mesh>
  );
};

const SceneContent = () => {
  const fg = readHsl('--foreground', '#ffffff');
  const accent = readHsl('--primary', '#ffffff');

  const shapes: ShapeProps[] = useMemo(() => [
    { position: [-5, 2, -2], geometry: 'icosahedron', scale: 1.2, speed: 0.8, color: fg },
    { position: [5, -1.5, -1], geometry: 'octahedron', scale: 1.4, speed: 0.6, color: accent },
    { position: [-4, -2.5, -3], geometry: 'torus', scale: 1, speed: 1, color: fg },
    { position: [4, 2.5, -4], geometry: 'box', scale: 0.9, speed: 0.7, color: accent },
    { position: [0, -3, -5], geometry: 'tetra', scale: 1.1, speed: 0.9, color: fg },
    { position: [-6, 0, -6], geometry: 'ring', scale: 1.3, speed: 0.5, color: accent },
    { position: [6, 1, -7], geometry: 'icosahedron', scale: 0.8, speed: 1.1, color: fg },
    { position: [2, 3.5, -3], geometry: 'tetra', scale: 0.7, speed: 1.2, color: accent },
    { position: [-2, 3, -8], geometry: 'octahedron', scale: 1.6, speed: 0.4, color: fg },
    { position: [3, -3, -6], geometry: 'torus', scale: 0.9, speed: 0.85, color: accent },
  ], [fg, accent]);

  // Group-level micro tilt that follows cursor for an extra parallax layer
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ mouse }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (mouse.x * 0.15 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.x += (-mouse.y * 0.1 - groupRef.current.rotation.x) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {shapes.map((s, i) => <Shape key={i} {...s} />)}
    </group>
  );
};

export const AuthScene3D = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};
