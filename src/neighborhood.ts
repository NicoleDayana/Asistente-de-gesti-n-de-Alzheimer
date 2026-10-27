// Modelo compartido del barrio: calles, edificios, árboles, puntos de interés y ruta.
// Lo usan por igual la escena 3D del paciente y el mapa del cuidador.

export const WORLD_BOUND = 36; // límites caminables en X y Z
export const STREET_HALF = 4; // media anchura de las avenidas (cruce en x=0, z=0)

export interface Building {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  wall: string;
  roof: string;
  label?: string;
  landmark?: string;
}

export interface TreeSpec {
  x: number;
  z: number;
  scale: number;
}

export interface LampSpec {
  x: number;
  z: number;
}

export interface Landmark {
  id: string;
  name: string;
  /** Posición del anillo / punto de llegada (no del edificio) */
  x: number;
  z: number;
  color: string;
}

export const LANDMARKS: Landmark[] = [
  { id: "casa", name: "Casa", x: -16, z: -11, color: "#f59e0b" },
  { id: "tienda", name: "Tienda", x: -24, z: 16, color: "#38bdf8" },
  { id: "parque", name: "Parque", x: 16, z: 16, color: "#34d399" },
  { id: "salud", name: "Centro de salud", x: 24, z: -15, color: "#f472b6" },
];

/** Ruta del paseo: sale de casa, va a la tienda, al parque y vuelve a casa. */
export const ROUTE_IDS = ["casa", "tienda", "parque", "casa"];
export const FIRST_OBJECTIVE_INDEX = 1;

export const SPAWN = { x: -16, z: -11, yaw: 0 };

const WALL_COLORS = ["#fde8d0", "#e7eefc", "#fde2e4", "#e2f4e8", "#f3e8ff", "#fff4cc"];
const ROOF_COLORS = ["#c2410c", "#9a3412", "#7c2d12", "#b45309", "#be123c", "#7e22ce"];

// Edificios especiales (puntos de interés)
const SPECIAL: Building[] = [
  { id: "b-casa", x: -16, z: -18, w: 6, d: 5, h: 3.4, wall: "#ffd9a8", roof: "#c2410c", label: "Casa", landmark: "casa" },
  { id: "b-tienda", x: -24, z: 9, w: 6, d: 6, h: 3.8, wall: "#bae6fd", roof: "#0369a1", label: "Tienda", landmark: "tienda" },
  { id: "b-salud", x: 24, z: -22, w: 7, d: 6, h: 4.2, wall: "#fbcfe8", roof: "#9d174d", label: "Centro de salud", landmark: "salud" },
];

interface Block {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const BLOCKS: Block[] = [
  { minX: -33, maxX: -9, minZ: -33, maxZ: -9 }, // noroeste (casas)
  { minX: 9, maxX: 33, minZ: -33, maxZ: -9 }, // noreste (salud + casas)
  { minX: -33, maxX: -9, minZ: 9, maxZ: 33 }, // suroeste (tienda + casas)
  // sureste: parque, sin edificios residenciales
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function generateHouses(): Building[] {
  const houses: Building[] = [];
  let seed = 1;
  for (const block of BLOCKS) {
    const cols = 2;
    const rows = 2;
    const stepX = (block.maxX - block.minX) / cols;
    const stepZ = (block.maxZ - block.minZ) / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = block.minX + stepX * (i + 0.5) + (pseudoRandom(seed) - 0.5) * 1.6;
        const z = block.minZ + stepZ * (j + 0.5) + (pseudoRandom(seed + 50) - 0.5) * 1.6;
        seed += 1;
        // No colocar casas demasiado cerca de un edificio especial
        const tooClose = SPECIAL.some((b) => Math.hypot(b.x - x, b.z - z) < 8);
        if (tooClose) continue;
        const w = 4 + pseudoRandom(seed) * 1.2;
        const d = 4 + pseudoRandom(seed + 10) * 1.2;
        houses.push({
          id: `casa-${houses.length + 1}`,
          x,
          z,
          w,
          d,
          h: 2.8 + pseudoRandom(seed + 20) * 1.1,
          wall: WALL_COLORS[houses.length % WALL_COLORS.length],
          roof: ROOF_COLORS[houses.length % ROOF_COLORS.length],
        });
      }
    }
  }
  return houses;
}

export const HOUSES: Building[] = [...generateHouses(), ...SPECIAL];

/** Obstáculos con colisión (edificios + fuente del parque). */
export const OBSTACLES: Array<{ x: number; z: number; w: number; d: number }> = [
  ...HOUSES.map((h) => ({ x: h.x, z: h.z, w: h.w, d: h.d })),
  { x: 20, z: 20, w: 3.4, d: 3.4 }, // fuente
];

function generateTrees(): TreeSpec[] {
  const trees: TreeSpec[] = [];
  // Arbolado alineado junto a las avenidas
  for (let p = -30; p <= 30; p += 10) {
    if (Math.abs(p) > 8) {
      trees.push({ x: -6.2, z: p, scale: 1 });
      trees.push({ x: 6.2, z: p, scale: 1 });
      trees.push({ x: p, z: -6.2, scale: 1 });
      trees.push({ x: p, z: 6.2, scale: 1 });
    }
  }
  // Arboleda del parque (sureste)
  for (let i = 0; i < 14; i++) {
    const x = 10 + pseudoRandom(200 + i) * 22;
    const z = 10 + pseudoRandom(400 + i) * 22;
    if (Math.hypot(x - 20, z - 20) < 4.5) continue; // dejar espacio a la fuente
    trees.push({ x, z, scale: 0.9 + pseudoRandom(i) * 0.5 });
  }
  return trees;
}

export const TREES: TreeSpec[] = generateTrees();

export const LAMPS: LampSpec[] = (() => {
  const lamps: LampSpec[] = [];
  for (let p = -25; p <= 25; p += 12.5) {
    lamps.push({ x: -5.2, z: p });
    lamps.push({ x: 5.2, z: p });
  }
  return lamps;
})();

export const PARK = { minX: 8, maxX: 34, minZ: 8, maxZ: 34 };
export const FOUNTAIN = { x: 20, z: 20 };

export function landmarkById(id: string): Landmark {
  const found = LANDMARKS.find((l) => l.id === id);
  if (!found) throw new Error(`Punto de interés desconocido: ${id}`);
  return found;
}

export function nearestLandmarkName(x: number, z: number): string {
  let best = LANDMARKS[0];
  let bestDistance = Infinity;
  for (const landmark of LANDMARKS) {
    const distance = Math.hypot(landmark.x - x, landmark.z - z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = landmark;
    }
  }
  return best.name;
}

/** Empuja al jugador fuera de los edificios y mantiene la posición dentro del barrio. */
export function resolveCollisions(x: number, z: number, radius = 0.5): [number, number] {
  let nx = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, x));
  let nz = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, z));
  for (const o of OBSTACLES) {
    const dx = nx - o.x;
    const dz = nz - o.z;
    const hx = o.w / 2 + radius;
    const hz = o.d / 2 + radius;
    if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
      const pushX = hx - Math.abs(dx);
      const pushZ = hz - Math.abs(dz);
      if (pushX < pushZ) {
        nx = o.x + (dx >= 0 ? 1 : -1) * hx;
      } else {
        nz = o.z + (dz >= 0 ? 1 : -1) * hz;
      }
    }
  }
  return [nx, nz];
}
