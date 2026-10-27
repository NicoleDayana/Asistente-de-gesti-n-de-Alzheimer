import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import {
  FOUNTAIN,
  HOUSES,
  LAMPS,
  PARK,
  ROUTE_IDS,
  STREET_HALF,
  TREES,
  WORLD_BOUND,
  landmarkById,
  type Building,
} from "../../neighborhood";
import { useCareState } from "../../store";
import { Label } from "./labels";

const GROUND_COLOR = "#79b873";
const PARK_COLOR = "#5fae68";
const ASPHALT = "#414957";
const SIDEWALK = "#a7b0bd";

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={GROUND_COLOR} />
      </mesh>
      {/* Parque (barrio sureste) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(PARK.minX + PARK.maxX) / 2, 0.005, (PARK.minZ + PARK.maxZ) / 2]}
        receiveShadow
      >
        <planeGeometry args={[PARK.maxX - PARK.minX, PARK.maxZ - PARK.minZ]} />
        <meshStandardMaterial color={PARK_COLOR} />
      </mesh>
    </>
  );
}

function Streets() {
  const length = WORLD_BOUND * 2 + 12;
  const dashes = useMemo(() => Array.from({ length: 15 }, (_, i) => -35 + i * 5), []);
  return (
    <group>
      {/* Avenida longitudinal (eje Z) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[STREET_HALF * 2, length]} />
        <meshStandardMaterial color={ASPHALT} />
      </mesh>
      {/* Avenida transversal (eje X) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[length, STREET_HALF * 2]} />
        <meshStandardMaterial color={ASPHALT} />
      </mesh>
      {/* Aceras */}
      {[-1, 1].map((side) => (
        <group key={`sidewalk-${side}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * (STREET_HALF + 0.9), 0.006, 0]}>
            <planeGeometry args={[1.8, length]} />
            <meshStandardMaterial color={SIDEWALK} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, side * (STREET_HALF + 0.9)]}>
            <planeGeometry args={[length, 1.8]} />
            <meshStandardMaterial color={SIDEWALK} />
          </mesh>
        </group>
      ))}
      {/* Líneas discontinuas centrales */}
      {dashes.map((p) => (
        <group key={`dash-${p}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, p]}>
            <planeGeometry args={[0.35, 2.2]} />
            <meshStandardMaterial color="#e8edf4" emissive="#94a3b8" emissiveIntensity={0.25} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p, 0.02, 0]}>
            <planeGeometry args={[2.2, 0.35]} />
            <meshStandardMaterial color="#e8edf4" emissive="#94a3b8" emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function House({ building }: { building: Building }) {
  const roofRadius = Math.max(building.w, building.d) * 0.72;
  return (
    <group position={[building.x, 0, building.z]}>
      <mesh position={[0, building.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[building.w, building.h, building.d]} />
        <meshStandardMaterial color={building.wall} />
      </mesh>
      <mesh position={[0, building.h + 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[roofRadius, 1.5, 4]} />
        <meshStandardMaterial color={building.roof} roughness={0.8} />
      </mesh>
      {/* Puerta (mirando hacia la avenida más cercana) */}
      <mesh position={[0, 0.95, building.d / 2 + 0.03]}>
        <boxGeometry args={[1, 1.9, 0.1]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      {/* Ventanas */}
      {[-building.w * 0.28, building.w * 0.28].map((wx) => (
        <mesh key={wx} position={[wx, building.h * 0.62, building.d / 2 + 0.03]}>
          <boxGeometry args={[0.9, 0.9, 0.08]} />
          <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.35} />
        </mesh>
      ))}
      {building.label && (
        <Label
          text={building.label}
          position={[0, building.h + 2.6, 0]}
          scale={1.7}
          bg="rgba(15,23,42,0.82)"
          fg="#ffffff"
        />
      )}
    </group>
  );
}

function Tree({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.2, 8]} />
        <meshStandardMaterial color="#7c4a21" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.95, 1.8, 9]} />
        <meshStandardMaterial color="#2f8f4e" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.7, 1.4, 9]} />
        <meshStandardMaterial color="#3aa75f" />
      </mesh>
    </group>
  );
}

function Lamps() {
  return (
    <group>
      {LAMPS.map((lamp, i) => (
        <group key={`lamp-${i}`} position={[lamp.x, 0, lamp.z]}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 4, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 4.05, 0]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color="#fff7cc" emissive="#fde68a" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Fountain() {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const t = clock.getElapsedTime();
      waterRef.current.scale.y = 1 + Math.sin(t * 2.4) * 0.12;
      const material = waterRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.75 + Math.sin(t * 2.4) * 0.1;
    }
  });
  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2.1, 0.7, 24]} />
        <meshStandardMaterial color="#b8c0cc" roughness={0.9} />
      </mesh>
      <mesh ref={waterRef} position={[0, 0.72, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.18, 24]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 1.1, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

function Benches() {
  const spots: Array<[number, number]> = [
    [12, 13],
    [26, 12],
    [13, 27],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={`bench-${i}`} position={[x, 0, z]} rotation={[0, (i * Math.PI) / 2.5, 0]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[2, 0.18, 0.6]} />
            <meshStandardMaterial color="#8a5a2b" />
          </mesh>
          <mesh position={[0, 0.8, -0.28]} castShadow>
            <boxGeometry args={[2, 0.6, 0.12]} />
            <meshStandardMaterial color="#8a5a2b" />
          </mesh>
          {[-0.8, 0.8].map((lx) => (
            <mesh key={lx} position={[lx, 0.22, 0]}>
              <boxGeometry args={[0.12, 0.45, 0.5]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Boundary() {
  const span = WORLD_BOUND * 2 + 4;
  const position = WORLD_BOUND + 1.5;
  return (
    <group>
      {[
        { pos: [0, 0.5, -position] as const, size: [span, 1, 0.6] as const },
        { pos: [0, 0.5, position] as const, size: [span, 1, 0.6] as const },
        { pos: [-position, 0.5, 0] as const, size: [0.6, 1, span] as const },
        { pos: [position, 0.5, 0] as const, size: [0.6, 1, span] as const },
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Waypoint({ landmarkId, index }: { landmarkId: string; index: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const diamondRef = useRef<THREE.Mesh>(null);
  const objectiveIndex = useCareState().objectiveIndex;
  const missionDone = useCareState().missionDone;
  const landmark = landmarkById(landmarkId);
  const isActive = !missionDone && index === objectiveIndex;
  const isDone = missionDone || index < objectiveIndex;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const base = isActive ? 1 + Math.sin(t * 4) * 0.18 : 1;
      ringRef.current.scale.setScalar(base);
      const material = ringRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isActive ? 1.4 + Math.sin(t * 4) * 0.5 : 0.35;
    }
    if (diamondRef.current) {
      diamondRef.current.rotation.y = t * 1.2;
      diamondRef.current.position.y = 2.4 + Math.sin(t * 2) * 0.25;
    }
  });

  const color = isDone ? "#34d399" : landmark.color;

  return (
    <group position={[landmark.x, 0, landmark.z]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <torusGeometry args={[1.35, 0.12, 12, 36]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={isActive || isDone ? 1 : 0.45} />
      </mesh>
      <mesh ref={diamondRef} position={[0, 2.4, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
      <Label
        text={isDone ? `✓ ${landmark.name}` : landmark.name}
        position={[0, 3.5, 0]}
        scale={1.5}
        bg={isDone ? "rgba(6,78,59,0.9)" : "rgba(15,23,42,0.85)"}
      />
    </group>
  );
}

export default function Neighborhood() {
  return (
    <group>
      <Sky sunPosition={[60, 80, 30]} turbidity={6} rayleigh={1.2} />
      <fog attach="fog" args={["#bcd7ee", 55, 130]} />
      <hemisphereLight args={["#dff1ff", "#6b8f5e", 0.85]} />
      <directionalLight
        position={[28, 42, 18]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-far={120}
      />
      <Ground />
      <Streets />
      <Boundary />
      {HOUSES.map((building) => (
        <House key={building.id} building={building} />
      ))}
      {TREES.map((tree, i) => (
        <Tree key={`tree-${i}`} x={tree.x} z={tree.z} scale={tree.scale} />
      ))}
      <Lamps />
      <Fountain />
      <Benches />
      {ROUTE_IDS.map((id, index) => (
        <Waypoint key={`${id}-${index}`} landmarkId={id} index={index} />
      ))}
    </group>
  );
}
