import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface BodyShape {
  sex: 'male' | 'female';
  girth: number;        // 0.78 lean → 1.45 heavy
  muscleDef: number;    // 0.85 soft → 1.3 ripped
  heightScale: number;  // 0.88 short → 1.12 tall
  waistRatio: number;   // waist/hip ratio
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
  const waistRatio = waistCm && hipCm
    ? Math.min(1.05, Math.max(0.7, waistCm / hipCm))
    : (sex === 'female' ? 0.75 : 0.9);
  return { sex, girth, muscleDef, heightScale, waistRatio };
}

// Kept for backwards compat with existing imports — body model no longer
// reads any visual state; muscle highlighting is handled by the 2D SVG tracker.
export interface MuscleVisualState {
  intensity: (mg: any) => number;
  isToday: (mg: any) => boolean;
  ratio?: (mg: any) => number;
  mode: 'heat' | 'training' | 'none';
}

const SKIN_MALE = '#d6a888';
const SKIN_FEMALE = '#e8bca3';

/**
 * Build a smooth torso silhouette using LatheGeometry. Profile points go
 * from hips → waist → chest → shoulders, giving a gendered, organic curve.
 */
function buildTorsoProfile(shape: BodyShape): THREE.Vector2[] {
  const { sex, girth, waistRatio } = shape;
  const shoulderW = (sex === 'male' ? 0.95 : 0.78) * girth;
  const chestW = (sex === 'male' ? 0.82 : 0.78) * girth;
  const waistW = chestW * waistRatio * (sex === 'female' ? 0.85 : 0.95);
  const hipW = (sex === 'male' ? 0.75 : 0.88) * girth;
  const upperHipW = hipW * 0.95;

  // y goes 0 (hip bottom) → 2.4 (shoulder top)
  return [
    new THREE.Vector2(0.02, 0.0),
    new THREE.Vector2(hipW * 0.95, 0.05),
    new THREE.Vector2(hipW, 0.25),       // hip widest
    new THREE.Vector2(upperHipW, 0.55),
    new THREE.Vector2(waistW * 1.05, 0.85),
    new THREE.Vector2(waistW, 1.05),     // waist narrowest
    new THREE.Vector2(waistW * 1.08, 1.25),
    new THREE.Vector2(chestW * 0.92, 1.55),
    new THREE.Vector2(chestW, 1.85),     // chest
    new THREE.Vector2(chestW * 0.95, 2.05),
    new THREE.Vector2(shoulderW * 0.85, 2.25),
    new THREE.Vector2(shoulderW * 0.5, 2.4),
    new THREE.Vector2(0.18, 2.45),       // neck base
  ];
}

/** Build a tapered limb (arm/leg) using LatheGeometry for smooth organic shape */
function buildLimbProfile(
  topRadius: number,
  midRadius: number,
  bottomRadius: number,
  length: number,
): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(topRadius * 0.95, 0.02 * length),
    new THREE.Vector2(topRadius, 0.15 * length),
    new THREE.Vector2(midRadius * 1.05, 0.4 * length),
    new THREE.Vector2(midRadius, 0.6 * length),
    new THREE.Vector2(bottomRadius * 1.1, 0.85 * length),
    new THREE.Vector2(bottomRadius, length),
    new THREE.Vector2(0.01, length + 0.01),
  ];
}

interface SkinMatProps {
  color: string;
}
function SkinMaterial({ color }: SkinMatProps) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.62}
      metalness={0.02}
      flatShading={false}
    />
  );
}

interface Props {
  shape: BodyShape;
  /** Kept for API back-compat; ignored. */
  visual?: MuscleVisualState;
  autoRotate?: boolean;
}

/**
 * Smooth, anatomical human body built from lathe-revolved profiles.
 * No more boxy capsules — the torso flows from hips → waist → chest →
 * shoulders in one continuous mesh, and limbs taper organically.
 * Subtle breathing animation makes it feel alive.
 */
export function HumanBodyModel({ shape, autoRotate = true }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const { sex, girth, heightScale } = shape;
  const skin = sex === 'male' ? SKIN_MALE : SKIN_FEMALE;

  const torsoProfile = useMemo(() => buildTorsoProfile(shape), [shape]);

  // Limb profiles
  const upperArmProfile = useMemo(
    () => buildLimbProfile(0.16 * girth, 0.14 * girth, 0.11 * girth, 0.7 * heightScale),
    [girth, heightScale],
  );
  const forearmProfile = useMemo(
    () => buildLimbProfile(0.11 * girth, 0.105 * girth, 0.08 * girth, 0.65 * heightScale),
    [girth, heightScale],
  );
  const thighProfile = useMemo(
    () => buildLimbProfile(0.24 * girth, 0.2 * girth, 0.14 * girth, 0.9 * heightScale),
    [girth, heightScale],
  );
  const shinProfile = useMemo(
    () => buildLimbProfile(0.14 * girth, 0.13 * girth, 0.08 * girth, 0.85 * heightScale),
    [girth, heightScale],
  );

  // Soft animation: breathing + gentle rotation
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
    if (torsoRef.current) {
      const t = state.clock.elapsedTime;
      const breath = 1 + Math.sin(t * 1.2) * 0.012;
      torsoRef.current.scale.set(breath, 1, breath);
    }
  });

  // Anatomical anchor points (y measured from feet, scaled at the end)
  const torsoBaseY = 1.6 * heightScale;        // hip-bottom
  const torsoTopY = torsoBaseY + 2.45 * heightScale; // shoulder top (~y=4.05)
  const shoulderY = torsoBaseY + 2.2 * heightScale;
  const hipY = torsoBaseY + 0.2 * heightScale;
  const headRadius = 0.32 * heightScale;
  const headY = torsoTopY + 0.35 * heightScale + headRadius;
  const shoulderX = (sex === 'male' ? 0.78 : 0.62) * girth;
  const hipX = (sex === 'male' ? 0.42 : 0.5) * girth;

  return (
    <group ref={groupRef} position={[0, -2.6, 0]}>
      {/* ============ TORSO (lathe-revolved) ============ */}
      <mesh ref={torsoRef} position={[0, torsoBaseY, 0]} castShadow receiveShadow>
        <latheGeometry args={[torsoProfile, 48]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* Subtle chest definition — pec planes for males, breast curves for females */}
      {sex === 'male' ? (
        <>
          <mesh position={[-0.18 * girth, shoulderY - 0.25, 0.55 * girth]} castShadow>
            <sphereGeometry args={[0.22 * girth, 24, 24]} />
            <SkinMaterial color={skin} />
          </mesh>
          <mesh position={[0.18 * girth, shoulderY - 0.25, 0.55 * girth]} castShadow>
            <sphereGeometry args={[0.22 * girth, 24, 24]} />
            <SkinMaterial color={skin} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.2 * girth, shoulderY - 0.35, 0.6 * girth]} castShadow>
            <sphereGeometry args={[0.2 * girth, 24, 24]} />
            <SkinMaterial color={skin} />
          </mesh>
          <mesh position={[0.2 * girth, shoulderY - 0.35, 0.6 * girth]} castShadow>
            <sphereGeometry args={[0.2 * girth, 24, 24]} />
            <SkinMaterial color={skin} />
          </mesh>
        </>
      )}

      {/* Glutes (back) */}
      <mesh position={[-0.22 * girth, hipY + 0.05, -0.4 * girth]} castShadow>
        <sphereGeometry args={[0.28 * girth, 20, 20]} />
        <SkinMaterial color={skin} />
      </mesh>
      <mesh position={[0.22 * girth, hipY + 0.05, -0.4 * girth]} castShadow>
        <sphereGeometry args={[0.28 * girth, 20, 20]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* ============ NECK ============ */}
      <mesh position={[0, torsoTopY + 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.28, 24]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* ============ HEAD ============ */}
      <mesh position={[0, headY, 0]} scale={[0.92, 1.05, 0.95]} castShadow>
        <sphereGeometry args={[headRadius, 32, 32]} />
        <SkinMaterial color={skin} />
      </mesh>
      {/* Jaw hint */}
      <mesh position={[0, headY - headRadius * 0.45, headRadius * 0.15]} scale={[0.7, 0.45, 0.85]} castShadow>
        <sphereGeometry args={[headRadius * 0.78, 24, 24]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* ============ SHOULDER CAPS (deltoids) ============ */}
      <mesh position={[-shoulderX, shoulderY - 0.05, 0]} castShadow>
        <sphereGeometry args={[0.22 * girth, 24, 24]} />
        <SkinMaterial color={skin} />
      </mesh>
      <mesh position={[shoulderX, shoulderY - 0.05, 0]} castShadow>
        <sphereGeometry args={[0.22 * girth, 24, 24]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* ============ ARMS ============ */}
      {/* Upper arm — lathe profile, hung downward */}
      <group position={[-shoulderX - 0.02, shoulderY - 0.05, 0]} rotation={[0, 0, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[upperArmProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>
      <group position={[shoulderX + 0.02, shoulderY - 0.05, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[upperArmProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>

      {/* Elbow */}
      <mesh position={[-shoulderX - 0.02, shoulderY - 0.05 - 0.7 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.11 * girth, 16, 16]} />
        <SkinMaterial color={skin} />
      </mesh>
      <mesh position={[shoulderX + 0.02, shoulderY - 0.05 - 0.7 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.11 * girth, 16, 16]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* Forearm */}
      <group position={[-shoulderX - 0.02, shoulderY - 0.05 - 0.7 * heightScale, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[forearmProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>
      <group position={[shoulderX + 0.02, shoulderY - 0.05 - 0.7 * heightScale, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[forearmProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>

      {/* Hands */}
      <mesh position={[-shoulderX - 0.02, shoulderY - 0.05 - (0.7 + 0.65) * heightScale - 0.04, 0]} scale={[0.8, 1.15, 0.45]} castShadow>
        <sphereGeometry args={[0.11, 18, 18]} />
        <SkinMaterial color={skin} />
      </mesh>
      <mesh position={[shoulderX + 0.02, shoulderY - 0.05 - (0.7 + 0.65) * heightScale - 0.04, 0]} scale={[0.8, 1.15, 0.45]} castShadow>
        <sphereGeometry args={[0.11, 18, 18]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* ============ LEGS ============ */}
      {/* Thigh */}
      <group position={[-hipX, hipY - 0.05, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[thighProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>
      <group position={[hipX, hipY - 0.05, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[thighProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>

      {/* Knee */}
      <mesh position={[-hipX, hipY - 0.05 - 0.9 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.16 * girth, 20, 20]} />
        <SkinMaterial color={skin} />
      </mesh>
      <mesh position={[hipX, hipY - 0.05 - 0.9 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.16 * girth, 20, 20]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* Shin / calf */}
      <group position={[-hipX, hipY - 0.05 - 0.9 * heightScale, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[shinProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>
      <group position={[hipX, hipY - 0.05 - 0.9 * heightScale, 0]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[shinProfile, 32]} />
          <SkinMaterial color={skin} />
        </mesh>
      </group>

      {/* Calf bulge (back) */}
      <mesh position={[-hipX, hipY - 0.05 - 0.9 * heightScale - 0.3, -0.06]} scale={[0.8, 1.1, 0.7]} castShadow>
        <sphereGeometry args={[0.15 * girth, 18, 18]} />
        <SkinMaterial color={skin} />
      </mesh>
      <mesh position={[hipX, hipY - 0.05 - 0.9 * heightScale - 0.3, -0.06]} scale={[0.8, 1.1, 0.7]} castShadow>
        <sphereGeometry args={[0.15 * girth, 18, 18]} />
        <SkinMaterial color={skin} />
      </mesh>

      {/* Feet */}
      <mesh position={[-hipX, hipY - 0.05 - (0.9 + 0.85) * heightScale - 0.02, 0.08]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.36]} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} />
      </mesh>
      <mesh position={[hipX, hipY - 0.05 - (0.9 + 0.85) * heightScale - 0.02, 0.08]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.36]} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} />
      </mesh>
    </group>
  );
}
