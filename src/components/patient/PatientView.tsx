import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { SPAWN } from "../../neighborhood";
import Neighborhood from "./Neighborhood";
import Player, { type PatientControls } from "./Player";
import PatientHud from "./PatientHud";
import { Button } from "../ui";

export default function PatientView({ onExit }: { onExit: () => void }) {
  const xrStore = useMemo(() => createXRStore(), []);
  const controlsRef = useRef<PatientControls>({ autoWalk: false });
  const [autoWalk, setAutoWalk] = useState(false);
  const [vrSupported, setVrSupported] = useState<boolean | null>(null);
  const [inSession, setInSession] = useState(false);

  useEffect(() => {
    controlsRef.current.autoWalk = autoWalk;
  }, [autoWalk]);

  useEffect(() => {
    let mounted = true;
    navigator.xr
      ?.isSessionSupported?.("immersive-vr")
      .then((supported) => mounted && setVrSupported(!!supported))
      .catch(() => mounted && setVrSupported(false));
    const unsubscribe = xrStore.subscribe((s) => setInSession(!!s.session));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [xrStore]);

  const vrButton = (
    <Button
      variant={inSession ? "danger" : "primary"}
      disabled={vrSupported === false}
      title={vrSupported === false ? "Este navegador o dispositivo no admite WebXR inmersivo" : undefined}
      onClick={() => {
        if (inSession) {
          xrStore.getState().session?.end();
        } else {
          xrStore.enterVR().catch(() => undefined);
        }
      }}
    >
      {inSession ? "Salir de VR" : vrSupported === false ? "VR no disponible" : "🥽 Entrar en VR"}
    </Button>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-200">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 72, near: 0.1, far: 220, position: [SPAWN.x, 1.62, SPAWN.z] }}
      >
        <XR store={xrStore}>
          <Neighborhood />
          <Player xrStore={xrStore} controlsRef={controlsRef} />
        </XR>
      </Canvas>

      <PatientHud
        onExit={onExit}
        vrButton={vrButton}
        autoWalk={autoWalk}
        onToggleWalk={() => setAutoWalk((value) => !value)}
      />
    </div>
  );
}
