import { CalendarDays, ClipboardCheck, LogOut, UserPlus, Users } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"
import { cn } from "cn"

import { Firma, Isotipo } from "@/components/marca"
import { useAuth } from "@/lib/auth"

const NAV = [
  { a: "/pacientes", etiqueta: "Pacientes", icono: Users, exacto: true },
  { a: "/agenda", etiqueta: "Agenda", icono: CalendarDays, exacto: true },
  { a: "/tramites", etiqueta: "Trámites", icono: ClipboardCheck, exacto: true },
  { a: "/pacientes/nuevo", etiqueta: "Nuevo paciente", icono: UserPlus, exacto: false },
]

function enlaceClases(activo: boolean) {
  return cn(
    "flex items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:justify-start",
    activo
      ? "bg-brand-coral text-[#3A3F47]"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  )
}

export function AppLayout() {
  const { salir } = useAuth()

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Barra lateral — tablet: sólo íconos; notebook (xl): con textos */}
      <aside className="bg-sidebar sticky top-0 hidden h-svh w-16 shrink-0 flex-col justify-between px-2 py-6 md:flex xl:w-60 xl:px-4">
        <div>
          <div className="hidden xl:block">
            <Firma className="px-1" />
          </div>
          <div className="text-center xl:hidden">
            <Isotipo className="text-2xl" />
          </div>
          <nav className="mt-9 space-y-1">
            {NAV.map(({ a, etiqueta, icono: Icono, exacto }) => (
              <NavLink
                key={a}
                to={a}
                end={exacto}
                title={etiqueta}
                aria-label={etiqueta}
                className={({ isActive }) => enlaceClases(isActive)}
              >
                <Icono className="size-5 shrink-0 xl:size-4" />
                <span className="hidden xl:inline">{etiqueta}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-center gap-2.5 xl:justify-start xl:px-1">
            <div className="bg-brand-coral flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#3A3F47]">
              FI
            </div>
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-sm font-medium text-white">Dra. F. Inveninato</p>
              <p className="truncate text-xs text-white/50">Ortodoncista</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void salir()}
            title="Salir"
            aria-label="Salir"
            className="flex w-full items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white xl:justify-start"
          >
            <LogOut className="size-5 shrink-0 xl:size-4" />
            <span className="hidden xl:inline">Salir</span>
          </button>
        </div>
      </aside>

      {/* Barra superior — mobile */}
      <header className="bg-sidebar sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 md:hidden">
        <Isotipo className="text-2xl" />
        <nav className="flex items-center gap-1">
          {NAV.map(({ a, etiqueta, icono: Icono, exacto }) => (
            <NavLink
              key={a}
              to={a}
              end={exacto}
              className={({ isActive }) => cn(enlaceClases(isActive), "px-3 py-2.5 text-xs")}
            >
              <Icono className="size-4" />
              <span className="sr-only sm:not-sr-only">{etiqueta}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
