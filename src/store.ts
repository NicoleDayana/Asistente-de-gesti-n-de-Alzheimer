// Tienda de estado compartida entre el paciente (mundo 3D) y el cuidador (panel).
// Simula en tiempo real la telemetría del brazalete asistencial.
import { useSyncExternalStore } from "react";
import { FIRST_OBJECTIVE_INDEX, ROUTE_IDS, landmarkById, nearestLandmarkName } from "./neighborhood";

export type AlertLevel = "info" | "aviso" | "urgente";
export type ActivityKind = "Caminando" | "En reposo";
export type MessageKind = "mensaje" | "recordatorio" | "alarma" | "logro" | "sistema";

export interface Reminder {
  id: string;
  title: string;
  detail: string;
  time: string;
  done: boolean;
}

export interface AlertItem {
  id: string;
  level: AlertLevel;
  message: string;
  at: number;
}

export interface HudMessage {
  id: string;
  kind: MessageKind;
  title: string;
  body?: string;
  at: number;
}

export interface CareState {
  connected: boolean;
  sos: boolean;
  patientName: string;
  heartRate: number;
  spo2: number;
  battery: number;
  stress: number; // 0-100
  steps: number;
  activity: ActivityKind;
  x: number;
  z: number;
  yaw: number;
  place: string;
  objectiveIndex: number;
  missionDone: boolean;
  /** Cambia cada vez que el paciente reinicia la ruta, para reposicionar la cámara. */
  poseNonce: number;
  reminders: Reminder[];
  alerts: AlertItem[];
  messages: HudMessage[];
  pingAt: number; // timestamp del último "localizar paciente"
}

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function initialState(): CareState {
  const spawn = landmarkById(ROUTE_IDS[0]);
  return {
    connected: true,
    sos: false,
    patientName: "Doña Carmen",
    heartRate: 74,
    spo2: 97,
    battery: 86,
    stress: 14,
    steps: 0,
    activity: "En reposo",
    x: spawn.x,
    z: spawn.z,
    yaw: 0,
    place: spawn.name,
    objectiveIndex: FIRST_OBJECTIVE_INDEX,
    missionDone: false,
    poseNonce: 0,
    reminders: [
      { id: uid("rem"), title: "Medicamento de la mañana", detail: "1 pastilla de memantina con agua", time: "10:00", done: false },
      { id: uid("rem"), title: "Paseo supervisado", detail: "Ruta casa → tienda → parque → casa", time: "10:30", done: false },
      { id: uid("rem"), title: "Hidratación", detail: "Beber un vaso de agua", time: "11:00", done: false },
      { id: uid("rem"), title: "Llamada familiar", detail: "Videollamada con su hija", time: "12:00", done: true },
    ],
    alerts: [
      { id: uid("al"), level: "info", message: "Brazalete conectado y señal GPS estable.", at: Date.now() },
    ],
    messages: [
      {
        id: uid("msg"),
        kind: "sistema",
        title: "Bienvenida, Carmen",
        body: "Hoy daremos un paseo por el barrio. Yo te acompaño en cada paso.",
        at: Date.now(),
      },
    ],
    pingAt: 0,
  };
}

let state: CareState = initialState();
const listeners = new Set<() => void>();

function emit(patch: Partial<CareState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function pushAlert(level: AlertLevel, message: string): void {
  const alert: AlertItem = { id: uid("al"), level, message, at: Date.now() };
  emit({ alerts: [alert, ...state.alerts].slice(0, 30) });
}

function pushMessage(kind: MessageKind, title: string, body?: string): void {
  const message: HudMessage = { id: uid("msg"), kind, title, body, at: Date.now() };
  emit({ messages: [message, ...state.messages].slice(0, 12) });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getState(): CareState {
  return state;
}

export function useCareState(): CareState {
  return useSyncExternalStore(subscribe, getState);
}

/* ---------------- Acciones que reporta la experiencia del paciente ---------------- */

let lastPose = { x: state.x, z: state.z };

export function setPlayerPose(x: number, z: number, yaw: number, moving: boolean): void {
  const distance = Math.hypot(x - lastPose.x, z - lastPose.z);
  lastPose = { x, z };
  const steps = moving && distance > 0.05 ? state.steps + Math.round(distance * 1.4) : state.steps;
  emit({
    x,
    z,
    yaw,
    steps,
    activity: moving ? "Caminando" : "En reposo",
    place: nearestLandmarkName(x, z),
  });
}

export function arriveAtLandmark(landmarkId: string): void {
  if (state.missionDone) return;
  const target = ROUTE_IDS[state.objectiveIndex];
  if (target !== landmarkId) return;
  const nextIndex = state.objectiveIndex + 1;
  const landmark = landmarkById(landmarkId);
  if (nextIndex >= ROUTE_IDS.length) {
    emit({ objectiveIndex: ROUTE_IDS.length - 1, missionDone: true });
    pushMessage("logro", "¡Paseo completado!", "Has vuelto a casa sana y salva. ¡Muy bien, Carmen!");
    pushAlert("info", "La paciente completó la ruta del paseo y regresó a casa.");
    emit({
      reminders: state.reminders.map((r) =>
        r.title === "Paseo supervisado" ? { ...r, done: true } : r,
      ),
    });
    return;
  }
  emit({ objectiveIndex: nextIndex });
  pushMessage("logro", `Llegaste a ${landmark.name}`, "Qué bien. Ahora continúa hasta el siguiente punto.");
  pushAlert("info", `La paciente llegó a ${landmark.name}.`);
}

export function resetMission(): void {
  const spawn = landmarkById(ROUTE_IDS[0]);
  lastPose = { x: spawn.x, z: spawn.z };
  emit({
    objectiveIndex: FIRST_OBJECTIVE_INDEX,
    missionDone: false,
    x: spawn.x,
    z: spawn.z,
    poseNonce: state.poseNonce + 1,
  });
  pushMessage("sistema", "Nueva ruta", "El paseo se ha reiniciado. ¡Vamos con calma!");
}

/* ---------------- Acciones del panel del cuidador ---------------- */

export function toggleSos(): void {
  const sos = !state.sos;
  emit({ sos, stress: sos ? 88 : Math.min(state.stress, 35) });
  if (sos) {
    pushAlert("urgente", "Alarma SOS activada por el cuidador.");
    pushMessage("alarma", "Alarma de ayuda", "Tu cuidador viene en camino. Queda donde estás, Carmen.");
  } else {
    pushAlert("aviso", "Alarma SOS cancelada.");
    pushMessage("sistema", "Alarma cancelada", "Todo despejado. Puedes continuar con calma.");
  }
}

export function sendQuickMessage(text: string): void {
  pushMessage("mensaje", "Mensaje de tu cuidador", text);
  pushAlert("info", `Mensaje enviado: «${text}».`);
}

export function pingPatient(): void {
  emit({ pingAt: Date.now() });
  pushMessage("mensaje", "Tu cuidador te está localizando", "Mira el anillo luminoso en el suelo para orientarte.");
  pushAlert("aviso", "Señal de localización enviada al brazalete.");
}

export function toggleReminder(id: string): void {
  const reminder = state.reminders.find((r) => r.id === id);
  if (!reminder) return;
  const done = !reminder.done;
  emit({
    reminders: state.reminders.map((r) => (r.id === id ? { ...r, done } : r)),
  });
  if (done) {
    pushMessage("recordatorio", "Tarea completada", `${reminder.title} registrada. ¡Excelente!`);
    pushAlert("info", `Recordatorio «${reminder.title}» marcado como cumplido.`);
  }
}

export function addReminder(title: string, detail: string, time: string): void {
  const reminder: Reminder = { id: uid("rem"), title, detail, time, done: false };
  emit({ reminders: [reminder, ...state.reminders] });
  pushMessage("recordatorio", title, detail);
  pushAlert("info", `Nuevo recordatorio enviado: ${title}.`);
}

export function dismissMessage(id: string): void {
  emit({ messages: state.messages.filter((m) => m.id !== id) });
}

/* ---------------- Simulación continua del brazalete ---------------- */

let simulationStarted = false;
let tick = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function startSimulation(): void {
  if (simulationStarted) return;
  simulationStarted = true;
  window.setInterval(() => {
    tick += 1;
    const walking = state.activity === "Caminando";
    const targetHeartRate = state.sos ? 108 : walking ? 90 : 72;
    const heartRate = Math.round(
      clamp(state.heartRate + (targetHeartRate - state.heartRate) * 0.25 + (Math.random() - 0.5) * 3, 55, 125),
    );
    const spo2 = Math.round(clamp(state.spo2 + (Math.random() - 0.5) * 0.8 + (heartRate > 100 ? -0.4 : 0.2), 92, 99));
    const battery = Math.max(6, state.battery - 0.025);
    const stressTarget = state.sos ? 90 : walking ? 22 : 13;
    const stress = Math.round(clamp(state.stress + (stressTarget - state.stress) * 0.15, 2, 98));

    emit({ heartRate, spo2, battery, stress });

    // Avisos ambientales ocasionales
    if (battery <= 20 && battery > 19.9) {
      pushAlert("aviso", "Batería del brazalete por debajo del 20 %.");
      pushMessage("alarma", "Batería baja", "Recuerda cargar el brazalete al llegar a casa.");
    }
    if (tick % 75 === 0 && !state.reminders.find((r) => r.title === "Hidratación")?.done) {
      pushMessage("recordatorio", "Hora de beber agua", "Un vaso de agua te vendrá muy bien.");
      pushAlert("info", "Recordatorio de hidratación enviado.");
    }
  }, 1000);
}
