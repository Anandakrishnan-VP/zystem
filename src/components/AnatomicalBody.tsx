import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { HumanBodyModel, computeBodyShape } from './three/HumanBodyModel';

interface Props {
  bmi: number | null;
  bodyFat: number | null;
  sex: 'male' | 'female';
  heightCm?: number;
  waistCm?: number | null;
  hipCm?: number | null;
}

/**
 * Clean anatomical body for the Body Metrics panel.
 * No muscle highlighting — just shows realistic gendered proportions
 * shaped by the user's measurements.
 */
export const AnatomicalBody = ({ bmi, bodyFat, sex, heightCm, waistCm, hipCm }: Props) => {
  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs text-muted-foreground">3D not supported</p>
      </div>
    );
  }

  const shape = computeBodyShape({ bmi, bodyFat, sex, heightCm, waistCm, hipCm });

  return (
    <div className="w-full h-full min-h-[320px]">
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 5], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 4]} intensity={1.0} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          <HumanBodyModel shape={shape} visual={{ mode: 'none', intensity: () => 0, isToday: () => false }} />
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
