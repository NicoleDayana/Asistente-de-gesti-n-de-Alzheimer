import { ROUTE_IDS, landmarkById } from "../../neighborhood";
import { dismissMessage, resetMission, useCareState, type HudMessage, type MessageKind } from "../../store";
import { Button } from "../ui";

const KIND_STYLE: Record<MessageKind, { ring: string; icon: string }> = {
  mensaje: { ring: "border-sky-400/50 bg-sky-950/85", icon: "💬" },
  recordatorio: { ring: "border-amber-400/50 bg-amber-950/85", icon: "⏰" },
  alarma: { ring: "border-rose-400/60 bg-rose-950/90", icon: "🚨" },
  logro: { ring: "border-emerald-400/50 bg-emerald-950/85", icon: "🏆" },
  sistema: { ring: "border-slate-400/40 bg-slate-900/85", icon: "ℹ️" },
};

function Toast({ message }: { message: HudMessage }) {
  const style = KIND_STYLE[message.kind];
  return (
    <div className={`animate-fade-in pointer-events-auto flex w-80 max-w-[80vw] items-start gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur ${style.ring}`}>
      <span className="text-xl leading-none">{style.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{message.title}</p>
        {message.body && <p className="mt-0.5 text-sm text-slate-200">{message.body}</p>}
      </div>
      <button
        onClick={() => dismissMessage(message.id)}
        className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
        aria-label="Cerrar mensaje"
      >
        ✕
      </button>
    </div>
  );
}

export default function PatientHud({
  onExit,
  vrButton,
  autoWalk,
  onToggleWalk,
}: {
  onExit: () => void;
  vrButton: React.ReactNode;
  autoWalk: boolean;
  onToggleWalk: () => void;
}) {
  const care = useCareState();
  const target = care.missionDone ? null : landmarkById(ROUTE_IDS[care.objectiveIndex]);
  const freshMessages = care.messages.filter((m) => Date.now() - m.at < 12000);
  const batteryWarn = care.battery < 25;
  const heartWarn = care.heartRate > 100;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
      {/* Barra superior */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <Button variant="ghost" onClick={onExit} className="!bg-slate-900/70">
            ← Cambiar rol
          </Button>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
            🧓🏼 {care.patientName}
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">{vrButton}</div>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        {/* Objetivo del paseo */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 text-white shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-widest text-contigo-300">Objetivo</p>
          {target ? (
            <>
              <p className="mt-1 text-lg font-bold">
                Dirígete a <span style={{ color: target.color }}>{target.name}</span>
              </p>
              <p className="mt-1 text-xs text-slate-300">Estás cerca de: {care.place}</p>
              <div className="mt-2 flex gap-1.5">
                {ROUTE_IDS.map((id, i) => (
                  <span
                    key={`${id}-${i}`}
                    className={`h-2 w-6 rounded-full ${
                      care.missionDone || i < care.objectiveIndex
                        ? "bg-emerald-400"
                        : i === care.objectiveIndex
                          ? "bg-contigo-400"
                          : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-lg font-bold text-emerald-300">¡Paseo completado! 🎉</p>
          )}
        </div>

        {/* Signos vitales compactos */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/75 p-3 text-white shadow-xl backdrop-blur">
          <div className="px-2 text-center">
            <p className="text-xs text-slate-400">Ritmo</p>
            <p className={`text-lg font-bold ${heartWarn ? "text-rose-300" : ""}`}>
              {care.heartRate}
              <span className="ml-0.5 text-[10px] text-slate-400">bpm</span>
            </p>
          </div>
          <div className="px-2 text-center">
            <p className="text-xs text-slate-400">Oxígeno</p>
            <p className="text-lg font-bold">
              {care.spo2}
              <span className="ml-0.5 text-[10px] text-slate-400">%</span>
            </p>
          </div>
          <div className="px-2 text-center">
            <p className="text-xs text-slate-400">Batería</p>
            <p className={`text-lg font-bold ${batteryWarn ? "text-amber-300" : ""}`}>
              {Math.round(care.battery)}
              <span className="ml-0.5 text-[10px] text-slate-400">%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Centro: alarma SOS */}
      {care.sos && (
        <div className="animate-blink pointer-events-none mx-auto rounded-2xl border-2 border-rose-400 bg-rose-950/90 px-6 py-3 text-center text-white shadow-2xl">
          <p className="text-xl font-black tracking-wide">🚨 ALARMA DE AYUDA ACTIVA 🚨</p>
          <p className="text-sm text-rose-200">Tu cuidador viene en camino. Queda donde estás.</p>
        </div>
      )}

      {/* Capa inferior */}
      <div className="flex items-end justify-between gap-3">
        <div className="hidden rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 backdrop-blur sm:block">
          Clic para mirar · <b>WASD</b> para caminar · <b>Shift</b> para correr
        </div>
        <Button variant="secondary" className="pointer-events-auto sm:hidden" active={autoWalk} onClick={onToggleWalk}>
          {autoWalk ? "⏸ Detenerse" : "▶ Caminar"}
        </Button>
        <div className="flex max-w-md flex-col items-end gap-2">
          {freshMessages.map((message) => (
            <Toast key={message.id} message={message} />
          ))}
        </div>
      </div>

      {/* Modal de misión cumplida */}
      {care.missionDone && (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-slate-950/60 p-6">
          <div className="animate-fade-in max-w-sm rounded-3xl border border-emerald-400/30 bg-slate-900/95 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-4xl">
              🏆
            </div>
            <h2 className="text-2xl font-extrabold text-white">¡Muy bien, Carmen!</h2>
            <p className="mt-2 text-slate-300">
              Completaste toda la ruta y regresaste a casa. Tu cuidador ha sido notificado.
            </p>
            <Button variant="success" className="mt-5 w-full" onClick={resetMission}>
              Repetir el paseo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
