import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { HumanBodyModel, computeBodyShape } from './three/HumanBodyModel';
import type { MuscleGroup } from '@/hooks/useMuscleTraining';

interface Props {
  sex: 'male' | 'female';
  bmi?: number | null;
  bodyFat?: number | null;
  muscleCounts: Record<string, number>;
  maxCount: number;
  isTodayTrained: (mg: MuscleGroup) => boolean;
}

/**
 * Realistic 3D body with muscles highlighted by training frequency.
 * Uses heatmap colors: purple (most) → gold → green → red (low).
 */
export const MuscleBody3D = ({
  sex,
  bmi = null,
  bodyFat = null,
  muscleCounts,
  maxCount,
  isTodayTrained,
}: Props) => {
  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs text-muted-foreground">3D not supported</p>
      </div>
    );
  }

  const shape = computeBodyShape({ bmi, bodyFat, sex });

  const visual = {
    mode: 'heat' as const,
    intensity: (mg: MuscleGroup) => Math.min(1, (muscleCounts[mg] || 0) / 8),
    isToday: (mg: MuscleGroup) => isTodayTrained(mg),
    ratio: (mg: MuscleGroup) => (maxCount > 0 ? (muscleCounts[mg] || 0) / maxCount : 0),
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 5], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 5, 4]} intensity={1.0} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          <HumanBodyModel shape={shape} visual={visual} />
          <ContactShadows position={[0, -1.75, 0]} opacity={0.45} scale={6} blur={2.5} far={3} />
          <Environment preset="studio" />
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
