import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/AppLayout"
import { FicheroProvider } from "@/lib/store"
import { Agenda } from "@/pages/Agenda"
import { FichaPaciente } from "@/pages/FichaPaciente"
import { Login } from "@/pages/Login"
import { NuevoPaciente } from "@/pages/NuevoPaciente"
import { Pacientes } from "@/pages/Pacientes"

export function App() {
  return (
    <FicheroProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<NuevoPaciente />} />
          <Route path="/pacientes/:id" element={<FichaPaciente />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </FicheroProvider>
  )
}
