import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { MuscleGroup } from '@/hooks/useMuscleTraining';

interface Body3DProps {
  bmi: number | null;
  bodyFat: number | null;
  sex: 'male' | 'female';
  muscleCounts?: Record<string, number>;
  highlightToday?: (muscle: MuscleGroup) => boolean;
}

// Map BMI/body-fat to scale factors for proportions
function getScales(bmi: number | null, bodyFat: number | null) {
  // Torso/girth scale: thicker with higher BMI or body fat
  const bmiFactor = bmi ? Math.min(1.45, Math.max(0.78, (bmi - 12) / 16)) : 1;
  const bfFactor = bodyFat !== null ? Math.min(1.4, Math.max(0.8, bodyFat / 22)) : bmiFactor;
  const girth = (bmiFactor + bfFactor) / 2;
  // Muscle definition: lower body fat = more visible muscle bulges
  const muscleDef = bodyFat !== null ? Math.min(1.3, Math.max(0.85, (28 - bodyFat) / 18 + 0.85)) : 1;
  return { girth, muscleDef };
}

// A muscle "bulge" with intensity based on training
function MuscleBulge({
  position,
  size,
  intensity,
  highlighted,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  size: [number, number, number];
  intensity: number;
  highlighted: boolean;
  rotation?: [number, number, number];
}) {
  // Base color: skin tone, becomes more red/active with intensity
  const baseColor = new THREE.Color('#d4a584');
  const activeColor = new THREE.Color('#c44545');
  const todayColor = new THREE.Color('#22c55e');

  const color = highlighted
    ? todayColor
    : baseColor.clone().lerp(activeColor, Math.min(1, intensity));

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={0.5}
        metalness={0.05}
        emissive={highlighted ? todayColor : '#000000'}
        emissiveIntensity={highlighted ? 0.4 : 0}
      />
      <group scale={size} />
    </mesh>
  );
}

// Anatomical body built from primitives
function AnatomicalBody({ bmi, bodyFat, sex, muscleCounts = {}, highlightToday }: Body3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { girth, muscleDef } = useMemo(() => getScales(bmi, bodyFat), [bmi, bodyFat]);

  // Slow auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  const skin = '#d4a584';

  // Get intensity (0-1) for a muscle group based on training count
  const intensity = (mg: string) => {
    const count = muscleCounts[mg] || 0;
    return Math.min(1, count / 8);
  };

  const isToday = (mg: MuscleGroup) => (highlightToday ? highlightToday(mg) : false);

  // Helper to render a muscle as a stretched sphere
  const Muscle = ({
    pos,
    scale,
    rotation = [0, 0, 0],
    group,
  }: {
    pos: [number, number, number];
    scale: [number, number, number];
    rotation?: [number, number, number];
    group: MuscleGroup;
  }) => {
    const i = intensity(group);
    const today = isToday(group);
    const baseColor = new THREE.Color(skin);
    const activeColor = new THREE.Color('#b85450');
    const todayColor = new THREE.Color('#22c55e');
    const color = today ? todayColor : baseColor.clone().lerp(activeColor, i * 0.6);
    // Bulge scale with muscle definition
    const bulge = 1 + i * 0.25 * muscleDef;
    return (
      <mesh position={pos} rotation={rotation as any} scale={[scale[0] * bulge, scale[1] * bulge, scale[2] * bulge]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.45}
          emissive={today ? todayColor : '#000000'}
          emissiveIntensity={today ? 0.35 : 0}
        />
      </mesh>
    );
  };

  // Female adjustments: narrower shoulders, wider hips
  const shoulderWidth = sex === 'male' ? 1.05 * girth : 0.9 * girth;
  const hipWidth = sex === 'male' ? 0.85 * girth : 1.0 * girth;

  return (
    <group ref={groupRef} position={[0, -1.6, 0]}>
      {/* Head */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 3.0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.3, 16]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Traps (upper shoulders/neck) */}
      <Muscle pos={[-0.25, 2.85, 0]} scale={[0.18, 0.12, 0.15]} group="traps" />
      <Muscle pos={[0.25, 2.85, 0]} scale={[0.18, 0.12, 0.15]} group="traps" />

      {/* Shoulders (deltoids) */}
      <Muscle pos={[-shoulderWidth, 2.65, 0]} scale={[0.32, 0.28, 0.3]} group="shoulders" />
      <Muscle pos={[shoulderWidth, 2.65, 0]} scale={[0.32, 0.28, 0.3]} group="shoulders" />

      {/* Torso base (skin-toned trunk) */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.55 * girth, 0.45 * girth, 1.5, 24]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* Chest (pecs) - 2 mounds */}
      <Muscle pos={[-0.28 * girth, 2.4, 0.4 * girth]} scale={[0.28 * girth, 0.18, 0.18]} group="chest" />
      <Muscle pos={[0.28 * girth, 2.4, 0.4 * girth]} scale={[0.28 * girth, 0.18, 0.18]} group="chest" />

      {/* Abs - 6 pack (front) */}
      {[1.95, 1.7, 1.45].map((y, idx) => (
        <group key={idx}>
          <Muscle pos={[-0.13, y, 0.45 * girth]} scale={[0.12, 0.1, 0.1]} group="abs" />
          <Muscle pos={[0.13, y, 0.45 * girth]} scale={[0.12, 0.1, 0.1]} group="abs" />
        </group>
      ))}

      {/* Obliques (sides) */}
      <Muscle pos={[-0.5 * girth, 1.7, 0.2]} scale={[0.1, 0.3, 0.18]} group="obliques" />
      <Muscle pos={[0.5 * girth, 1.7, 0.2]} scale={[0.1, 0.3, 0.18]} group="obliques" />

      {/* Upper back */}
      <Muscle pos={[-0.25 * girth, 2.3, -0.4 * girth]} scale={[0.3, 0.35, 0.18]} group="upper_back" />
      <Muscle pos={[0.25 * girth, 2.3, -0.4 * girth]} scale={[0.3, 0.35, 0.18]} group="upper_back" />

      {/* Lower back */}
      <Muscle pos={[-0.18 * girth, 1.6, -0.42 * girth]} scale={[0.22, 0.25, 0.15]} group="lower_back" />
      <Muscle pos={[0.18 * girth, 1.6, -0.42 * girth]} scale={[0.22, 0.25, 0.15]} group="lower_back" />

      {/* Biceps */}
      <Muscle pos={[-shoulderWidth - 0.05, 2.15, 0.05]} scale={[0.16, 0.28, 0.16]} group="biceps" />
      <Muscle pos={[shoulderWidth + 0.05, 2.15, 0.05]} scale={[0.16, 0.28, 0.16]} group="biceps" />

      {/* Triceps (back of arm) */}
      <Muscle pos={[-shoulderWidth - 0.05, 2.15, -0.08]} scale={[0.15, 0.28, 0.14]} group="triceps" />
      <Muscle pos={[shoulderWidth + 0.05, 2.15, -0.08]} scale={[0.15, 0.28, 0.14]} group="triceps" />

      {/* Lower arms (forearms) */}
      <Muscle pos={[-shoulderWidth - 0.08, 1.55, 0]} scale={[0.13, 0.3, 0.13]} group="forearms" />
      <Muscle pos={[shoulderWidth + 0.08, 1.55, 0]} scale={[0.13, 0.3, 0.13]} group="forearms" />

      {/* Hands */}
      <mesh position={[-shoulderWidth - 0.1, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[shoulderWidth + 0.1, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* Pelvis */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.45 * girth, hipWidth * 0.6, 0.4, 24]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* Glutes (back) */}
      <Muscle pos={[-0.2 * hipWidth, 0.9, -0.3]} scale={[0.25, 0.22, 0.22]} group="glutes" />
      <Muscle pos={[0.2 * hipWidth, 0.9, -0.3]} scale={[0.25, 0.22, 0.22]} group="glutes" />

      {/* Quads (front of thigh) */}
      <Muscle pos={[-0.22, 0.45, 0.18]} scale={[0.2, 0.42, 0.2]} group="quads" />
      <Muscle pos={[0.22, 0.45, 0.18]} scale={[0.2, 0.42, 0.2]} group="quads" />

      {/* Hamstrings (back of thigh) */}
      <Muscle pos={[-0.22, 0.45, -0.18]} scale={[0.18, 0.4, 0.18]} group="hamstrings" />
      <Muscle pos={[0.22, 0.45, -0.18]} scale={[0.18, 0.4, 0.18]} group="hamstrings" />

      {/* Knees */}
      <mesh position={[-0.22, -0.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0.22, -0.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Calves */}
      <Muscle pos={[-0.22, -0.5, -0.05]} scale={[0.16, 0.32, 0.18]} group="calves" />
      <Muscle pos={[0.22, -0.5, -0.05]} scale={[0.16, 0.32, 0.18]} group="calves" />

      {/* Lower legs (shin front) */}
      <mesh position={[-0.22, -0.5, 0.05]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.6, 16]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[0.22, -0.5, 0.05]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.6, 16]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.22, -0.92, 0.08]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.32]} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} />
      </mesh>
      <mesh position={[0.22, -0.92, 0.08]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.32]} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} />
      </mesh>
    </group>
  );
}

export const Body3D = ({ bmi, bodyFat, sex, muscleCounts, highlightToday }: Body3DProps) => {
  // WebGPU/WebGL fallback check
  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs text-muted-foreground">3D not supported</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[320px]">
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 5], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 5]} intensity={1.0} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        <Suspense fallback={null}>
          <AnatomicalBody
            bmi={bmi}
            bodyFat={bodyFat}
            sex={sex}
            muscleCounts={muscleCounts}
            highlightToday={highlightToday}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};
