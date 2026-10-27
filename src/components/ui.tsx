import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-contigo-600 hover:bg-contigo-500 text-white shadow-lg shadow-contigo-900/40",
  secondary: "bg-slate-700/80 hover:bg-slate-600 text-slate-100",
  ghost: "bg-transparent hover:bg-white/10 text-slate-200",
  danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  active?: boolean;
}

export function Button({ variant = "primary", active, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        active && "ring-2 ring-white/70",
        className,
      )}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-2xl border border-white/10 bg-slate-800/70 p-4 shadow-xl backdrop-blur", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-300">
      {icon}
      {children}
    </h3>
  );
}

const TONE: Record<string, string> = {
  info: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  aviso: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  urgente: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

export function Badge({ tone = "info", children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONE[tone])}>
      {children}
    </span>
  );
}

export function Stat({
  icon,
  label,
  value,
  unit,
  warn,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3">
      <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl", warn ? "bg-rose-500/20" : "bg-contigo-500/15")}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">{label}</p>
        <p className={clsx("text-lg font-bold leading-tight", warn && "text-rose-300")}>
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = "bg-contigo-500" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
      <div className={clsx("h-full rounded-full transition-all", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
