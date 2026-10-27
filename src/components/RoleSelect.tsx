import { Button, Card } from "./ui";

export type Role = "patient" | "caregiver";

export default function RoleSelect({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-8 overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(900px 500px at 15% 0%, rgba(50,157,255,0.25), transparent 60%), radial-gradient(700px 500px at 90% 100%, rgba(52,211,153,0.18), transparent 60%)",
        }}
      />
      <header className="relative z-10 max-w-2xl text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-contigo-300">Contigo</p>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Asistente de gestión del Alzheimer
        </h1>
        <p className="mt-3 text-slate-300">
          Simulación de un brazalete asistencial con realidad mixta. Elige cómo quieres entrar al
          barrio: como paciente, con un paseo guiado en 3D o gafas VR, o como cuidador, con el
          panel de monitoreo en tiempo real.
        </p>
      </header>

      <div className="relative z-10 grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        <Card className="flex flex-col gap-4 p-6 transition-transform hover:-translate-y-1">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-contigo-500/20 text-3xl">🧓🏼</div>
          <div>
            <h2 className="text-xl font-bold text-white">Paciente</h2>
            <p className="mt-1 text-sm text-slate-300">
              Paseo en primera persona por el barrio con instrucciones sencillas, recordatorios y
              botón para entrar en VR con gafas WebXR.
            </p>
          </div>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>✅ Ruta guiada casa → tienda → parque → casa</li>
            <li>✅ Mensajes y alarmas del cuidador en pantalla</li>
            <li>✅ Controles de teclado, ratón y táctiles</li>
          </ul>
          <Button className="mt-auto" onClick={() => onSelect("patient")}>
            Entrar como paciente
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-6 transition-transform hover:-translate-y-1">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/20 text-3xl">🧑🏽‍⚕️</div>
          <div>
            <h2 className="text-xl font-bold text-white">Cuidador</h2>
            <p className="mt-1 text-sm text-slate-300">
              Panel de monitoreo con signos vitales, ubicación en el mapa, recordatorios, alertas y
              comunicación directa con el brazalete.
            </p>
          </div>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>✅ Ritmo cardíaco, oxígeno, batería y estrés</li>
            <li>✅ Mapa en vivo con la posición de la paciente</li>
            <li>✅ SOS, mensajes rápidos y localización</li>
          </ul>
          <Button variant="success" className="mt-auto" onClick={() => onSelect("caregiver")}>
            Entrar como cuidador
          </Button>
        </Card>
      </div>

      <footer className="relative z-10 text-center text-xs text-slate-500">
        Proyecto educativo · React, Three.js, WebXR y Tailwind CSS
      </footer>
    </div>
  );
}
