import {
  SLOTS_AF,
  serieAFVacia,
  type FotoSlot,
  type ConfigAgenda,
  type Paciente,
  type Tramite,
  type Turno,
} from "@/lib/tipos"
import { aISO, fotoDemo, lunesDe, sumarDias } from "@/lib/util"

/** Las 3 tomas de armonizacion facial, con las primeras `cuantos` cargadas. */
function serieAF(semilla: string, cuantos: number = SLOTS_AF.length): FotoSlot[] {
  return SLOTS_AF.map((s, i) => ({
    slot: s.id,
    url: i < cuantos ? fotoDemo(`${semilla}-${s.id}`) : null,
  }))
}

export const PACIENTES_DEMO: Paciente[] = [
  {
    id: "pac-1",
    nombre: "Bautista",
    apellido: "Fernández",
    mail: "familia.fernandez@example.com",
    dni: "54892117",
    ocupacion: "Estudiante — 4.º grado",
    edad: "9",
    fechaNacimiento: "2017-04-22",
    categoria: "Ortopedia",
    sede: "La Plata",
    anamnesis:
      "Respirador bucal. Amígdalas operadas a los 6 años. Sin alergias conocidas ni medicación habitual. Buena higiene, con supervisión de la mamá.",
    obraSocial: "",
    particularidades:
      "Mamá: Verónica (3412-556677). Papá: Diego. Juega al fútbol los sábados, conviene no darle turnos temprano ese día. Le da impresión el aspirador.",
    derivadoPor: "Dra. Lucía Bertoni (odontopediatra)",
    activo: true,
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    seguimiento: [
      {
        id: "sg-b3",
        fecha: "2026-08-05",
        texto:
          "Control de expansión. Se activa el tornillo un cuarto de vuelta. La mamá refiere buena adaptación al aparato.",
      },
      {
        id: "sg-b2",
        fecha: "2026-06-10",
        texto:
          "Colocación de placa de expansión. Se dan indicaciones de uso y limpieza por escrito.",
      },
      {
        id: "sg-b1",
        fecha: "2026-05-18",
        texto:
          "Toma de impresiones y registro de mordida. Se pide interconsulta con fonoaudiología.",
      },
    ],
  },
  {
    id: "pac-2",
    nombre: "Carla",
    apellido: "Domínguez",
    mail: "carla.dominguez@example.com",
    dni: "38451902",
    ocupacion: "Contadora",
    edad: "27",
    fechaNacimiento: "1999-02-11",
    categoria: "Ortodoncia",
    sede: "Tandil",
    anamnesis:
      "Bruxismo nocturno. Sin antecedentes quirúrgicos. Refiere chasquido en la ATM derecha al abrir, sin dolor.",
    obraSocial: "OSDE 210",
    particularidades:
      "Trabaja en Buenos Aires y viaja a Tandil un fin de semana al mes: agendar los controles los viernes a la tarde. Se casa en noviembre de 2027 y quiere terminar antes.",
    derivadoPor: "Consulta espontánea (Instagram)",
    activo: true,
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    seguimiento: [
      {
        id: "sg-c1",
        fecha: "2026-09-04",
        texto: "Cementado superior. Arco 014 NiTi. Se entregan indicaciones y cera.",
      },
    ],
  },
  {
    id: "pac-3",
    nombre: "Martín",
    apellido: "Alsogaray",
    mail: "martin.alsogaray@example.com",
    dni: "34207665",
    ocupacion: "Chef",
    edad: "34",
    fechaNacimiento: "1992-07-30",
    categoria: "Ortodoncia",
    sede: "La Plata",
    anamnesis:
      "Periodontitis leve tratada en 2024, con alta del periodoncista. Fumador de 10 cigarrillos por día. Hipertensión controlada con medicación.",
    obraSocial: "Particular",
    particularidades:
      "Trabaja de noche, prefiere turnos antes de las 11. Muy constante con los controles. Le interesa mucho ver el avance en fotos.",
    derivadoPor: "Dr. Ariel Souto (periodoncista)",
    activo: true,
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    seguimiento: [
      {
        id: "sg-m5",
        fecha: "2026-09-08",
        texto: "Detallado final con dobleces de segundo orden. Se proyecta el retiro para noviembre.",
      },
      {
        id: "sg-m4",
        fecha: "2026-07-14",
        texto: "Se coloca arco de acero 019x025 superior e inferior. Espacio de la 46 cerrado.",
      },
      {
        id: "sg-m3",
        fecha: "2026-03-17",
        texto: "Control de cierre de espacios. Cadena elastomérica del 45 al 47.",
      },
      {
        id: "sg-m2",
        fecha: "2026-01-20",
        texto: "Cambio de arco a 016x022 NiTi. Se refuerza la indicación de dejar de fumar.",
      },
      {
        id: "sg-m1",
        fecha: "2025-11-12",
        texto: "Cementado inferior y colocación del microtornillo de anclaje. Sin complicaciones.",
      },
    ],
  },
  {
    id: "pac-4",
    nombre: "Julieta",
    apellido: "Fernández",
    mail: "padres.fernandez@example.com",
    dni: "51336480",
    ocupacion: "Estudiante — 1.º año",
    edad: "12",
    fechaNacimiento: "2014-09-03",
    categoria: "Ortopedia",
    sede: "Tandil",
    anamnesis:
      "Deglución atípica con interposición lingual. Sin antecedentes relevantes. Alergia a la penicilina.",
    obraSocial: "",
    particularidades:
      "Mamá: Sandra (2494-887766). Hermana de Bautista Fernández, vienen juntos a los controles cuando la familia está en Tandil. Toca el violín.",
    derivadoPor: "Derivación familiar",
    activo: true,
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    seguimiento: [
      {
        id: "sg-j1",
        fecha: "2026-09-01",
        texto: "Primera consulta. Se explica el plan a la mamá y se pide la panorámica.",
      },
    ],
  },
  {
    id: "pac-5",
    nombre: "Rocío",
    apellido: "Peralta",
    mail: "rocio.peralta@example.com",
    dni: "29884310",
    ocupacion: "Docente",
    edad: "41",
    fechaNacimiento: "1985-01-19",
    categoria: "Alineadores",
    sede: "La Plata",
    anamnesis:
      "Tratamiento de ortodoncia en la adolescencia, sin contención posterior. Sin antecedentes médicos de relevancia.",
    obraSocial: "IOMA",
    particularidades: "Terminó el tratamiento en 2025. Queda en control anual de contención.",
    derivadoPor: "Consulta espontánea",
    activo: false,
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    seguimiento: [
      {
        id: "sg-r2",
        fecha: "2025-07-22",
        texto: "Alta del tratamiento. Se coloca contención fija inferior y se entrega la placa superior.",
      },
      { id: "sg-r1", fecha: "2025-02-10", texto: "Control de alineación. Buen calce de los alineadores." },
    ],
  },
  {
    id: "pac-6",
    nombre: "Malena",
    apellido: "Quiroga",
    mail: "malena.quiroga@example.com",
    dni: "35120884",
    ocupacion: "",
    edad: "34",
    fechaNacimiento: "",
    categoria: "Armonización facial",
    sede: "La Plata",
    anamnesis: "",
    obraSocial: "",
    particularidades:
      "Sin alergias conocidas. Primera vez con relleno: pidió expresamente algo sutil, que no se note. Trabaja en un estudio jurídico, prefiere turnos a la tarde.",
    derivadoPor: "Consulta espontánea (Instagram)",
    activo: true,
    fotosAntes: serieAF("malena-antes"),
    fotosDespues: serieAF("malena-despues", 2),
    seguimiento: [],
  },
]

/**
 * Horarios de ejemplo. La Plata atiende todas las semanas; Tandil sólo los días
 * puntuales que Florencia carga (acá, dos días que caen en la semana actual y la próxima).
 */
export function configAgendaDemo(): ConfigAgenda {
  const lunes = lunesDe(new Date())
  return {
    bloques: [
      { id: "bl-general", sede: "La Plata", dias: [1, 3, 4], desde: "14:00", hasta: "20:00", etiqueta: "Turnos generales" },
      { id: "bl-lun", sede: "La Plata", dias: [1], desde: "11:00", hasta: "13:00", etiqueta: "Turnos especiales" },
      { id: "bl-jue", sede: "La Plata", dias: [4], desde: "12:00", hasta: "13:00", etiqueta: "Turnos especiales" },
      { id: "bl-tan-1", sede: "Tandil", dias: [], fecha: aISO(lunes), desde: "14:00", hasta: "19:00", etiqueta: "Visita a Tandil" },
      { id: "bl-tan-2", sede: "Tandil", dias: [], fecha: aISO(sumarDias(lunes, 10)), desde: "14:00", hasta: "19:00", etiqueta: "Visita a Tandil" },
    ],
  }
}

/**
 * Turnos de ejemplo, relativos a la semana en que se abre la demo para que
 * la agenda nunca arranque vacía. Lun/Mié/Jue = offsets 0/2/3 desde el lunes.
 */
export function turnosDemo(): Turno[] {
  const lunes = lunesDe(new Date())
  const t = (
    sem: number,
    dia: number,
    hora: string,
    duracion: number,
    pacienteId: string,
    sede: Turno["sede"],
    estado: Turno["estado"] = "ocupado"
  ): Turno => ({
    id: `tur-${sem}-${dia}-${hora}-${sede}`,
    pacienteId,
    sede,
    fecha: aISO(sumarDias(lunes, sem * 7 + dia)),
    hora,
    duracion,
    estado,
  })

  return [
    // Semana actual — el lunes mezcla 15, 30 y 45 minutos
    t(0, 0, "11:00", 45, "pac-3", "La Plata"),
    t(0, 0, "11:45", 15, "pac-4", "La Plata"),
    t(0, 0, "14:00", 30, "pac-1", "La Plata"),
    t(0, 0, "14:30", 15, "pac-6", "La Plata"),
    t(0, 0, "14:45", 45, "pac-2", "La Plata"),
    t(0, 0, "15:30", 30, "pac-5", "La Plata"),
    t(0, 0, "16:15", 15, "pac-4", "La Plata", "no-asistio"),
    t(0, 0, "16:00", 30, "pac-2", "Tandil"),
    t(0, 2, "15:30", 30, "pac-3", "La Plata", "cancelado"),
    t(0, 0, "14:30", 45, "pac-4", "Tandil", "no-asistio"),
    t(0, 3, "12:00", 30, "pac-5", "La Plata"),
    t(0, 3, "18:00", 30, "pac-1", "La Plata"),
    // Semana próxima
    t(1, 0, "14:30", 30, "pac-1", "La Plata"),
    t(1, 3, "15:00", 45, "pac-4", "Tandil"),
    t(1, 2, "15:00", 15, "pac-3", "La Plata"),
    t(1, 2, "17:30", 30, "pac-3", "La Plata", "cancelado"),
    t(1, 3, "17:00", 45, "pac-2", "Tandil"),
    t(1, 3, "18:00", 30, "pac-1", "La Plata"),
  ]
}

/** Trámites de ejemplo: algunos pacientes figuran en las dos listas. */
export function tramitesDemo(): Tramite[] {
  const hace = (dias: number) => aISO(sumarDias(new Date(), -dias))
  const tr = (id: string, pacienteId: string, tipo: Tramite["tipo"], dias: number): Tramite => ({
    id,
    pacienteId,
    tipo,
    agregado: hace(dias),
    resuelto: false,
  })
  return [
    tr("tra-1", "pac-2", "obra-social", 2),
    tr("tra-2", "pac-3", "obra-social", 6),
    tr("tra-3", "pac-5", "obra-social", 11),
    tr("tra-4", "pac-1", "facturacion", 1),
    tr("tra-5", "pac-3", "facturacion", 4),
    tr("tra-6", "pac-5", "facturacion", 9),
  ]
}
