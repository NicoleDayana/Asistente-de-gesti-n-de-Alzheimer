import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { XROrigin, useXRControllerLocomotion, type XRStore } from "@react-three/xr";
import * as THREE from "three";
import { ROUTE_IDS, SPAWN, landmarkById, resolveCollisions } from "../../neighborhood";
import { arriveAtLandmark, getState, setPlayerPose } from "../../store";

export interface PatientControls {
  autoWalk: boolean;
}

const EYE_HEIGHT = 1.62;
const WALK_SPEED = 2.8;
const RUN_SPEED = 4.4;
const LOOK_SENSITIVITY = 0.0024;

export default function Player({
  xrStore,
  controlsRef,
}: {
  xrStore: XRStore;
  controlsRef: MutableRefObject<PatientControls>;
}) {
  const originRef = useRef<THREE.Group>(null);
  const pingRingRef = useRef<THREE.Mesh>(null);
  const keys = useRef<Set<string>>(new Set());
  const yaw = useRef(SPAWN.yaw);
  const pitch = useRef(0);
  const inXR = useRef(false);
  const touchLook = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastReport = useRef(0);
  const lastPingAt = useRef(0);
  const pingAge = useRef(99);
  const lastNonce = useRef(getState().poseNonce);
  const lastPosition = useRef(new THREE.Vector3(SPAWN.x, 0, SPAWN.z));
  const gl = useThree((state) => state.gl);

  // Locomoción con joystick de los mandos VR (sin efecto fuera de una sesión XR).
  useXRControllerLocomotion(
    originRef,
    { speed: 2.4 },
    { type: "snap", degrees: 30, deadZone: 0.25 },
    "left",
  );

  useEffect(() => {
    const unsubscribe = xrStore.subscribe((s) => {
      inXR.current = !!s.session;
      if (s.session) document.exitPointerLock?.();
    });
    return unsubscribe;
  }, [xrStore]);

  // Teclado para caminar (escritorio).
  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current.add(event.code);
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // Mirar con ratón (pointer lock) y con arrastre táctil, directamente sobre el canvas.
  useEffect(() => {
    const element = gl.domElement;

    const onPointerDown = (event: PointerEvent) => {
      if (inXR.current) return;
      if (event.pointerType === "touch") {
        touchLook.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        return;
      }
      if (document.pointerLockElement !== element) {
        element.requestPointerLock?.();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (inXR.current) return;
      if (event.pointerType === "touch") {
        if (touchLook.current?.id !== event.pointerId) return;
        const dx = event.clientX - touchLook.current.x;
        const dy = event.clientY - touchLook.current.y;
        touchLook.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        yaw.current -= dx * LOOK_SENSITIVITY * 1.4;
        pitch.current = THREE.MathUtils.clamp(pitch.current - dy * LOOK_SENSITIVITY * 1.4, -1.2, 1.2);
        return;
      }
      if (document.pointerLockElement === element) {
        yaw.current -= event.movementX * LOOK_SENSITIVITY;
        pitch.current = THREE.MathUtils.clamp(
          pitch.current - event.movementY * LOOK_SENSITIVITY,
          -1.2,
          1.2,
        );
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (touchLook.current?.id === event.pointerId) touchLook.current = null;
    };

    element.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl]);

  useFrame((rootState, delta) => {
    const origin = originRef.current;
    if (!origin) return;
    const dt = Math.min(delta, 0.05);
    const care = getState();

    // Reinicio de ruta pedido desde el HUD: vuelve al punto de partida.
    if (care.poseNonce !== lastNonce.current) {
      lastNonce.current = care.poseNonce;
      origin.position.set(SPAWN.x, 0, SPAWN.z);
      yaw.current = SPAWN.yaw;
      pitch.current = 0;
    }

    let moving = false;

    if (!inXR.current) {
      const forwardInput =
        (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0) -
        (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0);
      const strafeInput =
        (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0) -
        (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0);
      const forward = forwardInput !== 0 ? forwardInput : controlsRef.current.autoWalk ? 1 : 0;
      const speed = keys.current.has("ShiftLeft") || keys.current.has("ShiftRight") ? RUN_SPEED : WALK_SPEED;
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      const dx = (forward * -sin + strafeInput * cos) * speed * dt;
      const dz = (forward * -cos - strafeInput * sin) * speed * dt;
      const [nx, nz] = resolveCollisions(origin.position.x + dx, origin.position.z + dz);
      origin.position.x = nx;
      origin.position.z = nz;
      moving = forward !== 0 || strafeInput !== 0;

      rootState.camera.position.set(origin.position.x, EYE_HEIGHT, origin.position.z);
      rootState.camera.rotation.order = "YXZ";
      rootState.camera.rotation.set(pitch.current, yaw.current, 0);
    } else {
      moving = origin.position.distanceTo(lastPosition.current) > 0.005;
    }
    lastPosition.current.copy(origin.position);

    // ¿Se llegó al punto de interés objetivo?
    if (!care.missionDone) {
      const target = landmarkById(ROUTE_IDS[care.objectiveIndex]);
      if (Math.hypot(target.x - origin.position.x, target.z - origin.position.z) < 2.8) {
        arriveAtLandmark(target.id);
      }
    }

    // Telemetría unas 4 veces por segundo.
    lastReport.current += dt;
    if (lastReport.current >= 0.25) {
      lastReport.current = 0;
      setPlayerPose(origin.position.x, origin.position.z, yaw.current, moving);
    }

    // Anillo de "localizar paciente" activado por el cuidador.
    if (care.pingAt !== lastPingAt.current) {
      lastPingAt.current = care.pingAt;
      pingAge.current = 0;
    }
    const ring = pingRingRef.current;
    if (ring) {
      if (pingAge.current < 2.4) {
        pingAge.current += dt;
        ring.visible = true;
        const progress = pingAge.current / 2.4;
        ring.scale.setScalar(0.6 + progress * 3.2);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - progress);
      } else {
        ring.visible = false;
      }
    }
  });

  return (
    <XROrigin ref={originRef} position={[SPAWN.x, 0, SPAWN.z]}>
      <mesh ref={pingRingRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.75, 40]} />
        <meshBasicMaterial color="#facc15" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </XROrigin>
  );
}
