import { useState, type FormEvent } from "react";
import {
  HOUSES,
  LANDMARKS,
  PARK,
  STREET_HALF,
  WORLD_BOUND,
} from "../neighborhood";
import {
  addReminder,
  pingPatient,
  sendQuickMessage,
  toggleReminder,
  toggleSos,
  useCareState,
  type AlertLevel,
} from "../store";
import { Badge, Button, Card, CardTitle, ProgressBar, Stat } from "./ui";

const QUICK_MESSAGES = [
  "Recuerda tomar tu medicamento",
  "¿Necesitas ayuda? Te llamo en un momento",
  "Respira profundo, todo va a estar bien",
  "Te espero en casa, no te apures",
];

const ALERT_TONE: Record<AlertLevel, "info" | "aviso" | "urgente"> = {
  info: "info",
  aviso: "aviso",
  urgente: "urgente",
};

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LiveMap() {
  const care = useCareState();
  const span = WORLD_BOUND + 4;
  // Dirección de la mirada de la paciente (la misma fórmula que en la escena 3D).
  const tipX = care.x + -Math.sin(care.yaw) * 2.6;
  const tipZ = care.z + -Math.cos(care.yaw) * 2.6;

  return (
    <svg viewBox={`${-span} ${-span} ${span * 2} ${span * 2}`} className="h-full w-full rounded-xl bg-[#10281a]">
      {/* Suelo */}
      <rect x={-span} y={-span} width={span * 2} height={span * 2} fill="#173d24" />
      {/* Parque */}
      <rect x={PARK.minX} y={PARK.minZ} width={PARK.maxX - PARK.minX} height={PARK.maxZ - PARK.minZ} fill="#1f6b3b" rx={2} />
      {/* Aceras y avenidas */}
      <rect x={-span} y={-STREET_HALF - 1.8} width={span * 2} height={(STREET_HALF + 1.8) * 2} fill="#4b5563" />
      <rect x={-STREET_HALF - 1.8} y={-span} width={(STREET_HALF + 1.8) * 2} height={span * 2} fill="#4b5563" />
      <rect x={-span} y={-STREET_HALF} width={span * 2} height={STREET_HALF * 2} fill="#374151" />
      <rect x={-STREET_HALF} y={-span} width={STREET_HALF * 2} height={span * 2} fill="#374151" />
      {/* Edificios */}
      {HOUSES.map((house) => (
        <g key={house.id}>
          <rect
            x={house.x - house.w / 2}
            y={house.z - house.d / 2}
            width={house.w}
            height={house.d}
            rx={0.6}
            fill={house.roof}
            opacity={house.landmark ? 1 : 0.75}
            stroke={house.landmark ? "#f8fafc" : "transparent"}
            strokeWidth={house.landmark ? 0.4 : 0}
          />
        </g>
      ))}
      {/* Puntos de interés */}
      {LANDMARKS.map((landmark) => (
        <g key={landmark.id}>
          <circle cx={landmark.x} cy={landmark.z} r={1.1} fill={landmark.color} stroke="#0f172a" strokeWidth={0.3} />
          <text
            x={landmark.x}
            y={landmark.z - 1.8}
            textAnchor="middle"
            fontSize={2.1}
            fontWeight={700}
            fill="#e2e8f0"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {landmark.name}
          </text>
        </g>
      ))}
      {/* Alarma SOS: halo pulsante */}
      {care.sos && (
        <circle cx={care.x} cy={care.z} r={3.4} fill="none" stroke="#f43f5e" strokeWidth={0.8} className="animate-blink" />
      )}
      {/* Paciente */}
      <g>
        <line x1={care.x} y1={care.z} x2={tipX} y2={tipZ} stroke="#7dd3fc" strokeWidth={0.7} strokeLinecap="round" />
        <circle cx={care.x} cy={care.z} r={1.5} fill="#f8fafc" stroke="#0ea5e9" strokeWidth={0.6} />
        <circle cx={care.x} cy={care.z} r={0.7} fill="#0ea5e9" />
        <text
          x={care.x + 2.2}
          y={care.z + 0.8}
          fontSize={2.2}
          fontWeight={700}
          fill="#ffffff"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {care.patientName}
        </text>
      </g>
    </svg>
  );
}

function NewReminderForm() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addReminder(title.trim(), "Recordatorio enviado desde el panel del cuidador.", time || "Sin hora");
    setTitle("");
    setTime("");
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nuevo recordatorio…"
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-contigo-400 focus:outline-none"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-contigo-400 focus:outline-none"
      />
      <Button type="submit" variant="secondary">
        Enviar
      </Button>
    </form>
  );
}

export default function CaregiverView({ onExit }: { onExit: () => void }) {
  const care = useCareState();
  const [customMessage, setCustomMessage] = useState("");
  const heartWarn = care.heartRate > 100 || care.heartRate < 58;
  const spo2Warn = care.spo2 < 94;
  const batteryWarn = care.battery < 25;
  const stressWarn = care.stress > 60;

  return (
    <div className="min-h-full bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
        {/* Encabezado */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onExit}>
              ← Cambiar rol
            </Button>
            <div>
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">
                Panel del cuidador · <span className="text-contigo-300">Contigo</span>
              </h1>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 text-emerald-400 pulse-dot" />
                Monitoreo en vivo de {care.patientName} · {care.place}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={pingPatient}>
              📍 Localizar
            </Button>
            <Button variant={care.sos ? "success" : "danger"} onClick={toggleSos}>
              {care.sos ? "✓ Cancelar SOS" : "🚨 Activar SOS"}
            </Button>
          </div>
        </header>

        {care.sos && (
          <div className="animate-blink flex items-center gap-3 rounded-2xl border-2 border-rose-400 bg-rose-950/80 px-5 py-3 text-white">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-black">Alarma SOS activa</p>
              <p className="text-sm text-rose-200">
                La paciente recibió la alarma en su brazalete. Se registró la ubicación actual: {care.place}.
              </p>
            </div>
          </div>
        )}

        {/* Signos vitales */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat icon="❤️" label="Ritmo cardíaco" value={care.heartRate} unit="bpm" warn={heartWarn} />
          <Stat icon="🫧" label="Oxígeno" value={care.spo2} unit="%" warn={spo2Warn} />
          <Stat icon="🔋" label="Batería brazalete" value={Math.round(care.battery)} unit="%" warn={batteryWarn} />
          <Stat icon="🧠" label="Nivel de estrés" value={care.stress} unit="/100" warn={stressWarn} />
          <Stat icon="👣" label="Pasos hoy" value={care.steps} />
          <Stat icon="🚶🏽‍♀️" label="Actividad" value={care.activity} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Mapa */}
          <Card className="lg:col-span-2">
            <CardTitle icon="🗺️">Ubicación en tiempo real</CardTitle>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10">
              <LiveMap />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Batería del brazalete</span>
                <span>{Math.round(care.battery)} %</span>
              </div>
              <ProgressBar value={care.battery} tone={batteryWarn ? "bg-amber-400" : "bg-emerald-400"} />
              <div className="mb-1 mt-3 flex justify-between text-xs text-slate-400">
                <span>Nivel de estrés</span>
                <span>{care.stress} / 100</span>
              </div>
              <ProgressBar value={care.stress} tone={stressWarn ? "bg-rose-400" : "bg-contigo-500"} />
            </div>
          </Card>

          <div className="space-y-4">
            {/* Recordatorios */}
            <Card>
              <CardTitle icon="⏰">Recordatorios</CardTitle>
              <ul className="nice-scroll max-h-64 space-y-2 overflow-y-auto pr-1">
                {care.reminders.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3"
                  >
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs ${
                        reminder.done
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                          : "border-slate-500 text-transparent hover:border-contigo-300"
                      }`}
                      aria-label={reminder.done ? "Marcar como pendiente" : "Marcar como cumplido"}
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${reminder.done ? "text-slate-400 line-through" : "text-white"}`}>
                        {reminder.title}
                      </p>
                      <p className="text-xs text-slate-400">{reminder.detail}</p>
                      <p className="mt-0.5 text-xs font-semibold text-contigo-300">🕒 {reminder.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <NewReminderForm />
            </Card>

            {/* Comunicación */}
            <Card>
              <CardTitle icon="💬">Mensajes rápidos</CardTitle>
              <div className="flex flex-wrap gap-2">
                {QUICK_MESSAGES.map((message) => (
                  <Button key={message} variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => sendQuickMessage(message)}>
                    {message}
                  </Button>
                ))}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customMessage.trim()) return;
                  sendQuickMessage(customMessage.trim());
                  setCustomMessage("");
                }}
              >
                <input
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Escribe un mensaje personalizado…"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-contigo-400 focus:outline-none"
                />
                <Button type="submit">Enviar</Button>
              </form>
            </Card>
          </div>
        </div>

        {/* Alertas */}
        <Card>
          <CardTitle icon="🔔">Registro de alertas y eventos</CardTitle>
          <ul className="nice-scroll max-h-72 space-y-2 overflow-y-auto pr-1">
            {care.alerts.map((alert) => (
              <li key={alert.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/60 px-3 py-2">
                <div className="flex items-center gap-3">
                  <Badge tone={ALERT_TONE[alert.level]}>
                    {alert.level === "urgente" ? "Urgente" : alert.level === "aviso" ? "Aviso" : "Info"}
                  </Badge>
                  <p className="text-sm text-slate-200">{alert.message}</p>
                </div>
                <time className="shrink-0 text-xs text-slate-500">{formatTime(alert.at)}</time>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
