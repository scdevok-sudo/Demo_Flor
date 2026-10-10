import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/AppLayout"
import { RutaProtegida } from "@/components/RutaProtegida"
import { AuthProvider, useAuth } from "@/lib/auth"
import { FicheroProvider } from "@/lib/store"
import { Agenda } from "@/pages/Agenda"
import { FichaPaciente } from "@/pages/FichaPaciente"
import { Login } from "@/pages/Login"
import { NuevoPaciente } from "@/pages/NuevoPaciente"
import { Pacientes } from "@/pages/Pacientes"
import { Tramites } from "@/pages/Tramites"

function Rutas() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/pacientes" replace /> : <Login />} />
      <Route element={<RutaProtegida />}>
        <Route
          element={
            <FicheroProvider>
              <AppLayout />
            </FicheroProvider>
          }
        >
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/tramites" element={<Tramites />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<NuevoPaciente />} />
          <Route path="/pacientes/:id" element={<FichaPaciente />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  )
}
