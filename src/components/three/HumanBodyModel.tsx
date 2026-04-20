import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MuscleGroup } from '@/hooks/useMuscleTraining';

export interface BodyShape {
  sex: 'male' | 'female';
  /** girth multiplier for torso/limbs (~0.8 lean → 1.4 heavy) */
  girth: number;
  /** muscle definition multiplier (0.85 soft → 1.3 ripped) */
  muscleDef: number;
  /** overall height scale (~0.9 short → 1.1 tall) */
  heightScale: number;
  /** waist relative to hips (1.0 = even, lower = narrower waist) */
  waistRatio: number;
}

export function computeBodyShape({
  bmi,
  bodyFat,
  sex,
  heightCm,
  waistCm,
  hipCm,
}: {
  bmi: number | null;
  bodyFat: number | null;
  sex: 'male' | 'female';
  heightCm?: number;
  waistCm?: number | null;
  hipCm?: number | null;
}): BodyShape {
  const bmiFactor = bmi ? Math.min(1.45, Math.max(0.78, (bmi - 12) / 16)) : 1;
  const bfFactor = bodyFat !== null ? Math.min(1.4, Math.max(0.8, bodyFat / 22)) : bmiFactor;
  const girth = (bmiFactor + bfFactor) / 2;
  const muscleDef = bodyFat !== null
    ? Math.min(1.3, Math.max(0.85, (28 - bodyFat) / 18 + 0.85))
    : 1;
  const heightScale = heightCm ? Math.min(1.12, Math.max(0.88, heightCm / 175)) : 1;
  const waistRatio = waistCm && hipCm ? Math.min(1.05, Math.max(0.7, waistCm / hipCm)) : (sex === 'female' ? 0.78 : 0.92);
  return { sex, girth, muscleDef, heightScale, waistRatio };
}

export interface MuscleVisualState {
  /** count → intensity (0..1) per muscle group */
  intensity: (mg: MuscleGroup) => number;
  /** is this muscle trained today? */
  isToday: (mg: MuscleGroup) => boolean;
  /** ratio for heatmap mode (count/maxCount) */
  ratio?: (mg: MuscleGroup) => number;
  /** color mode: 'heat' uses purple/gold/green/red, 'training' uses skin→red */
  mode: 'heat' | 'training' | 'none';
}

const SKIN_MALE = '#d6a888';
const SKIN_FEMALE = '#e6b9a0';

function heatColor(ratio: number): THREE.Color {
  if (ratio >= 0.75) return new THREE.Color('#a855f7'); // purple
  if (ratio >= 0.5) return new THREE.Color('#eab308');  // gold
  if (ratio >= 0.25) return new THREE.Color('#22c55e'); // green
  if (ratio > 0) return new THREE.Color('#ef4444');     // red
  return new THREE.Color(0); // sentinel
}

function getMuscleColor(
  mg: MuscleGroup,
  visual: MuscleVisualState | undefined,
  baseSkin: string,
): { color: THREE.Color; emissive: THREE.Color; emissiveIntensity: number; bulgeBoost: number } {
  const baseColor = new THREE.Color(baseSkin);
  if (!visual || visual.mode === 'none') {
    return { color: baseColor, emissive: new THREE.Color(0), emissiveIntensity: 0, bulgeBoost: 0 };
  }
  const today = visual.isToday(mg);
  const i = visual.intensity(mg);
  const todayColor = new THREE.Color('#22c55e');

  if (visual.mode === 'heat' && visual.ratio) {
    const r = visual.ratio(mg);
    const heat = heatColor(r);
    if (r === 0 && !today) {
      return { color: baseColor, emissive: new THREE.Color(0), emissiveIntensity: 0, bulgeBoost: 0 };
    }
    const blended = baseColor.clone().lerp(heat, 0.85);
    return {
      color: today ? todayColor : blended,
      emissive: today ? todayColor : heat,
      emissiveIntensity: today ? 0.55 : 0.35,
      bulgeBoost: i,
    };
  }

  // training mode (default)
  const activeColor = new THREE.Color('#b85450');
  const color = today ? todayColor : baseColor.clone().lerp(activeColor, i * 0.6);
  return {
    color,
    emissive: today ? todayColor : new THREE.Color(0),
    emissiveIntensity: today ? 0.4 : 0,
    bulgeBoost: i,
  };
}

/**
 * Capsule-based limb. Smooth & rounded — looks far more like real anatomy
 * than stretched spheres.
 */
function Limb({
  position,
  rotation = [0, 0, 0],
  radius,
  length,
  color,
  emissive,
  emissiveIntensity = 0,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  length: number;
  color: THREE.Color | string;
  emissive?: THREE.Color | string;
  emissiveIntensity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation as any} castShadow receiveShadow>
      <capsuleGeometry args={[radius, length, 8, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.02}
        emissive={emissive || '#000000'}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

/** A muscle bulge laid over a limb — sphere stretched along the limb axis. */
function Bulge({
  position,
  rotation = [0, 0, 0],
  scale,
  mg,
  visual,
  baseSkin,
  defMult,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  mg: MuscleGroup;
  visual?: MuscleVisualState;
  baseSkin: string;
  defMult: number;
}) {
  const { color, emissive, emissiveIntensity, bulgeBoost } = getMuscleColor(mg, visual, baseSkin);
  const bulge = 1 + bulgeBoost * 0.22 * defMult;
  return (
    <mesh
      position={position}
      rotation={rotation as any}
      scale={[scale[0] * bulge, scale[1] * bulge, scale[2] * bulge]}
      castShadow
    >
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.5}
        metalness={0.03}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

interface Props {
  shape: BodyShape;
  visual?: MuscleVisualState;
  autoRotate?: boolean;
}

/**
 * Realistic-ish anatomical human body:
 * - Capsule limbs (smooth, no boxy joints)
 * - Gendered proportions: shoulders, hips, chest, waist
 * - Measurement-driven scaling (girth + waistRatio)
 * - Muscle bulges overlaid for visualization
 */
export function HumanBodyModel({ shape, visual, autoRotate = true }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { sex, girth, muscleDef, heightScale, waistRatio } = shape;
  const skin = sex === 'male' ? SKIN_MALE : SKIN_FEMALE;

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Gendered proportions
  const shoulderW = sex === 'male' ? 0.62 * girth : 0.5 * girth;
  const hipW = sex === 'male' ? 0.42 * girth : 0.5 * girth;
  const waistW = hipW * waistRatio;
  const chestDepth = sex === 'male' ? 0.32 * girth : 0.3 * girth;

  // Vertical anchors (root at feet level y=0)
  const headY = 3.5 * heightScale;
  const neckY = 3.0 * heightScale;
  const chestY = 2.55 * heightScale;
  const waistY = 1.85 * heightScale;
  const hipY = 1.4 * heightScale;
  const kneeY = 0.55 * heightScale;
  const footY = -0.15 * heightScale;

  // Common skin material props for body trunk pieces
  const skinMat = (
    <meshStandardMaterial color={skin} roughness={0.55} metalness={0.02} />
  );

  return (
    <group ref={groupRef} position={[0, -1.6, 0]}>
      {/* ======================== HEAD & NECK ======================== */}
      {/* Head — slightly oval */}
      <mesh position={[0, headY, 0]} scale={[0.42, 0.5, 0.45]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        {skinMat}
      </mesh>
      {/* Jaw hint */}
      <mesh position={[0, headY - 0.18, 0.05]} scale={[0.32, 0.18, 0.36]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        {skinMat}
      </mesh>
      {/* Neck */}
      <Limb position={[0, neckY, 0]} radius={0.16} length={0.28} color={skin} />

      {/* Traps */}
      <Bulge mg="traps" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.18, 0.1, 0.16]} position={[-0.18, neckY - 0.05, -0.05]}
      />
      <Bulge mg="traps" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.18, 0.1, 0.16]} position={[0.18, neckY - 0.05, -0.05]}
      />

      {/* ======================== TORSO ======================== */}
      {/* Upper torso (chest cavity) — wider at shoulders, tapers to waist */}
      <mesh position={[0, chestY, 0]} castShadow>
        <cylinderGeometry args={[shoulderW * 0.85, waistW, 1.1 * heightScale, 32, 1, false]} />
        {skinMat}
      </mesh>
      {/* Front chest plane (slightly forward for depth) */}
      <mesh position={[0, chestY, chestDepth * 0.4]} scale={[shoulderW * 0.78, 0.55 * heightScale, chestDepth * 0.4]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        {skinMat}
      </mesh>
      {/* Back plane */}
      <mesh position={[0, chestY, -chestDepth * 0.4]} scale={[shoulderW * 0.82, 0.6 * heightScale, chestDepth * 0.4]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        {skinMat}
      </mesh>

      {/* Waist (mid section) */}
      <mesh position={[0, waistY, 0]} castShadow>
        <cylinderGeometry args={[waistW, hipW * 0.9, 0.5 * heightScale, 32]} />
        {skinMat}
      </mesh>

      {/* Pelvis / hips */}
      <mesh position={[0, hipY, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
        <group scale={[hipW, 0.32 * heightScale, hipW * 0.75]} />
      </mesh>
      <mesh position={[0, hipY, 0]} scale={[hipW, 0.35 * heightScale, hipW * 0.78]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        {skinMat}
      </mesh>

      {/* ======================== CHEST MUSCLES (pecs / breasts) ======================== */}
      {sex === 'male' ? (
        <>
          <Bulge mg="chest" visual={visual} baseSkin={skin} defMult={muscleDef}
            scale={[shoulderW * 0.42, 0.18 * heightScale, 0.16]}
            position={[-shoulderW * 0.35, chestY + 0.2, chestDepth * 0.7]}
          />
          <Bulge mg="chest" visual={visual} baseSkin={skin} defMult={muscleDef}
            scale={[shoulderW * 0.42, 0.18 * heightScale, 0.16]}
            position={[shoulderW * 0.35, chestY + 0.2, chestDepth * 0.7]}
          />
        </>
      ) : (
        <>
          <Bulge mg="chest" visual={visual} baseSkin={skin} defMult={muscleDef}
            scale={[0.22, 0.22, 0.22]}
            position={[-shoulderW * 0.32, chestY + 0.05, chestDepth * 0.95]}
          />
          <Bulge mg="chest" visual={visual} baseSkin={skin} defMult={muscleDef}
            scale={[0.22, 0.22, 0.22]}
            position={[shoulderW * 0.32, chestY + 0.05, chestDepth * 0.95]}
          />
        </>
      )}

      {/* ======================== ABS (front) ======================== */}
      {sex === 'male' && [0.15, -0.05, -0.25].map((dy, idx) => (
        <group key={idx}>
          <Bulge mg="abs" visual={visual} baseSkin={skin} defMult={muscleDef}
            scale={[0.11, 0.08, 0.08]}
            position={[-0.12, waistY + dy, chestDepth * 0.85]}
          />
          <Bulge mg="abs" visual={visual} baseSkin={skin} defMult={muscleDef}
            scale={[0.11, 0.08, 0.08]}
            position={[0.12, waistY + dy, chestDepth * 0.85]}
          />
        </group>
      ))}
      {sex === 'female' && (
        <Bulge mg="abs" visual={visual} baseSkin={skin} defMult={muscleDef}
          scale={[0.18, 0.28, 0.1]}
          position={[0, waistY - 0.05, chestDepth * 0.85]}
        />
      )}

      {/* Obliques */}
      <Bulge mg="obliques" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.1, 0.28, 0.16]}
        position={[-waistW * 0.95, waistY, chestDepth * 0.4]}
      />
      <Bulge mg="obliques" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.1, 0.28, 0.16]}
        position={[waistW * 0.95, waistY, chestDepth * 0.4]}
      />

      {/* ======================== BACK ======================== */}
      <Bulge mg="upper_back" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[shoulderW * 0.45, 0.32 * heightScale, 0.14]}
        position={[-shoulderW * 0.3, chestY + 0.05, -chestDepth * 0.7]}
      />
      <Bulge mg="upper_back" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[shoulderW * 0.45, 0.32 * heightScale, 0.14]}
        position={[shoulderW * 0.3, chestY + 0.05, -chestDepth * 0.7]}
      />
      <Bulge mg="lower_back" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.18, 0.2, 0.13]}
        position={[-0.14, waistY - 0.05, -chestDepth * 0.75]}
      />
      <Bulge mg="lower_back" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.18, 0.2, 0.13]}
        position={[0.14, waistY - 0.05, -chestDepth * 0.75]}
      />

      {/* ======================== SHOULDERS (deltoids) ======================== */}
      <Bulge mg="shoulders" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.22, 0.22, 0.22]}
        position={[-shoulderW - 0.05, chestY + 0.32 * heightScale, 0]}
      />
      <Bulge mg="shoulders" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.22, 0.22, 0.22]}
        position={[shoulderW + 0.05, chestY + 0.32 * heightScale, 0]}
      />

      {/* ======================== ARMS — capsule limbs + muscle bulges ======================== */}
      {/* Upper arm (humerus area) — left */}
      <Limb position={[-shoulderW - 0.12, chestY - 0.05, 0]} radius={0.13} length={0.55 * heightScale} color={skin} />
      <Limb position={[shoulderW + 0.12, chestY - 0.05, 0]} radius={0.13} length={0.55 * heightScale} color={skin} />

      {/* Biceps (front of upper arm) */}
      <Bulge mg="biceps" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.13, 0.22, 0.13]}
        position={[-shoulderW - 0.12, chestY - 0.05, 0.08]}
      />
      <Bulge mg="biceps" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.13, 0.22, 0.13]}
        position={[shoulderW + 0.12, chestY - 0.05, 0.08]}
      />
      {/* Triceps (back of upper arm) */}
      <Bulge mg="triceps" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.13, 0.24, 0.13]}
        position={[-shoulderW - 0.12, chestY - 0.05, -0.08]}
      />
      <Bulge mg="triceps" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.13, 0.24, 0.13]}
        position={[shoulderW + 0.12, chestY - 0.05, -0.08]}
      />

      {/* Forearms */}
      <Limb position={[-shoulderW - 0.18, chestY - 0.7 * heightScale, 0]} radius={0.1} length={0.5 * heightScale} color={skin} />
      <Limb position={[shoulderW + 0.18, chestY - 0.7 * heightScale, 0]} radius={0.1} length={0.5 * heightScale} color={skin} />
      <Bulge mg="forearms" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.12, 0.22, 0.12]}
        position={[-shoulderW - 0.18, chestY - 0.55 * heightScale, 0]}
      />
      <Bulge mg="forearms" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.12, 0.22, 0.12]}
        position={[shoulderW + 0.18, chestY - 0.55 * heightScale, 0]}
      />

      {/* Hands */}
      <mesh position={[-shoulderW - 0.22, chestY - 1.05 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.11, 16, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[shoulderW + 0.22, chestY - 1.05 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.11, 16, 16]} />
        {skinMat}
      </mesh>

      {/* ======================== GLUTES ======================== */}
      <Bulge mg="glutes" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[hipW * 0.55, 0.22, 0.25]}
        position={[-hipW * 0.4, hipY - 0.05, -chestDepth * 0.5]}
      />
      <Bulge mg="glutes" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[hipW * 0.55, 0.22, 0.25]}
        position={[hipW * 0.4, hipY - 0.05, -chestDepth * 0.5]}
      />

      {/* ======================== LEGS ======================== */}
      {/* Thighs */}
      <Limb position={[-hipW * 0.55, (hipY + kneeY) / 2, 0]} radius={0.18} length={0.7 * heightScale} color={skin} />
      <Limb position={[hipW * 0.55, (hipY + kneeY) / 2, 0]} radius={0.18} length={0.7 * heightScale} color={skin} />

      {/* Quads (front) */}
      <Bulge mg="quads" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.18, 0.4 * heightScale, 0.16]}
        position={[-hipW * 0.55, (hipY + kneeY) / 2, 0.12]}
      />
      <Bulge mg="quads" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.18, 0.4 * heightScale, 0.16]}
        position={[hipW * 0.55, (hipY + kneeY) / 2, 0.12]}
      />
      {/* Hamstrings (back) */}
      <Bulge mg="hamstrings" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.16, 0.38 * heightScale, 0.15]}
        position={[-hipW * 0.55, (hipY + kneeY) / 2, -0.13]}
      />
      <Bulge mg="hamstrings" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.16, 0.38 * heightScale, 0.15]}
        position={[hipW * 0.55, (hipY + kneeY) / 2, -0.13]}
      />

      {/* Knees */}
      <mesh position={[-hipW * 0.55, kneeY, 0]} castShadow>
        <sphereGeometry args={[0.16, 20, 20]} />
        {skinMat}
      </mesh>
      <mesh position={[hipW * 0.55, kneeY, 0]} castShadow>
        <sphereGeometry args={[0.16, 20, 20]} />
        {skinMat}
      </mesh>

      {/* Lower legs */}
      <Limb position={[-hipW * 0.55, (kneeY + footY) / 2, 0]} radius={0.13} length={0.55 * heightScale} color={skin} />
      <Limb position={[hipW * 0.55, (kneeY + footY) / 2, 0]} radius={0.13} length={0.55 * heightScale} color={skin} />

      {/* Calves */}
      <Bulge mg="calves" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.15, 0.3 * heightScale, 0.16]}
        position={[-hipW * 0.55, (kneeY + footY) / 2 + 0.05, -0.08]}
      />
      <Bulge mg="calves" visual={visual} baseSkin={skin} defMult={muscleDef}
        scale={[0.15, 0.3 * heightScale, 0.16]}
        position={[hipW * 0.55, (kneeY + footY) / 2 + 0.05, -0.08]}
      />

      {/* Feet */}
      <mesh position={[-hipW * 0.55, footY - 0.18, 0.1]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.34]} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} />
      </mesh>
      <mesh position={[hipW * 0.55, footY - 0.18, 0.1]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.34]} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} />
      </mesh>
    </group>
  );
}
