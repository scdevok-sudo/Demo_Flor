import {
  SLOTS_AF,
  serieAFVacia,
  type FotoSlot,
  type Paciente,
} from "@/lib/tipos"
import { fotoDemo } from "@/lib/util"

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
  },
]
