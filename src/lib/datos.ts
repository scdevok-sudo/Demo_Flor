import {
  SLOTS_AF,
  SLOTS_SERIE,
  cuotasVacias,
  serieAFVacia,
  serieVacia,
  type Cuota,
  type FotoSlot,
  type Paciente,
} from "@/lib/tipos"
import { fotoDemo } from "@/lib/util"

/** Completa los primeros `cuantos` slots de la serie con fotos de relleno. */
function serie(semilla: string, cuantos = SLOTS_SERIE.length): FotoSlot[] {
  return SLOTS_SERIE.map((s, i) => ({
    slot: s.id,
    url: i < cuantos ? fotoDemo(`${semilla}-${s.id}`) : null,
  }))
}

/** Las 3 tomas de armonizacion facial, con las primeras `cuantos` cargadas. */
function serieAF(semilla: string, cuantos: number = SLOTS_AF.length): FotoSlot[] {
  return SLOTS_AF.map((s, i) => ({
    slot: s.id,
    url: i < cuantos ? fotoDemo(`${semilla}-${s.id}`) : null,
  }))
}

/** Marca como efectuadas las primeras `pagas` cuotas. */
function cuotas(pagas: number, medio: Cuota["medio"] = "Transferencia"): Cuota[] {
  return cuotasVacias().map((c) => ({
    ...c,
    medio,
    efectuado: c.mes <= pagas,
  }))
}

export const PACIENTES_DEMO: Paciente[] = [
  {
    id: "pac-1",
    nombre: "Bautista",
    apellido: "Fernández",
    dni: "54892117",
    ocupacion: "Estudiante — 4.º grado",
    edad: "9",
    fechaNacimiento: "2017-04-22",
    categoria: "Ortopedia",
    sede: "La Plata",
    anamnesis:
      "Respirador bucal. Amígdalas operadas a los 6 años. Sin alergias conocidas ni medicación habitual. Buena higiene, con supervisión de la mamá.",
    obraSocial: "",
    nroAfiliado: "",
    particularidades:
      "Mamá: Verónica (3412-556677). Papá: Diego. Juega al fútbol los sábados, conviene no darle turnos temprano ese día. Le da impresión el aspirador.",
    derivadoPor: "Dra. Lucía Bertoni (odontopediatra)",
    activo: true,
    fotosIniciales: serie("bautista-ini"),
    fotosIntra: [
      {
        id: "fi-b1",
        url: fotoDemo("bautista-intra-1", 480, 600),
        fecha: "2026-06-10",
        nota: "Colocación de placa de expansión",
      },
      {
        id: "fi-b2",
        url: fotoDemo("bautista-intra-2", 480, 600),
        fecha: "2026-08-05",
        nota: "Control de expansión — 2 meses",
      },
    ],
    fotosFinales: serieVacia(),
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    radiografias: [
      {
        id: "rx-b1",
        nombre: "panoramica-inicial.jpg",
        momento: "Inicial",
        formato: "imagen",
        url: fotoDemo("rx-bautista-1", 600, 400),
      },
      {
        id: "rx-b2",
        nombre: "teleperfil-inicial.jpg",
        momento: "Inicial",
        formato: "imagen",
        url: fotoDemo("rx-bautista-2", 600, 400),
      },
    ],
    estudios: [
      {
        id: "es-b1",
        nombre: "cefalometria-inicial.pdf",
        momento: "Inicial",
        formato: "pdf",
        url: null,
      },
    ],
    diagnostico:
      "Clase II esquelética por retrusión mandibular. Mordida cruzada posterior bilateral con compresión del maxilar superior. Hábito de respiración bucal.",
    plan:
      "Fase 1 de ortopedia funcional: expansión del maxilar superior y avance mandibular. Reeducación de la respiración con fonoaudiología. Control cada 45 días. Reevaluación a los 12 meses para definir la fase 2.",
    tecnica: "Placa de expansión tipo Haas + pistas indirectas Planas",
    montoTotal: "780000",
    condiciones:
      "Incluye aparatología, controles cada 45 días y urgencias. No incluye estudios radiográficos ni la reparación por rotura del aparato. 12 cuotas sin interés.",
    cuotas: cuotas(4, "Efectivo"),
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
    dni: "38451902",
    ocupacion: "Contadora",
    edad: "27",
    fechaNacimiento: "1999-02-11",
    categoria: "Ortodoncia",
    sede: "Tandil",
    anamnesis:
      "Bruxismo nocturno. Sin antecedentes quirúrgicos. Refiere chasquido en la ATM derecha al abrir, sin dolor.",
    obraSocial: "OSDE 210",
    nroAfiliado: "62004518301",
    particularidades:
      "Trabaja en Buenos Aires y viaja a Tandil un fin de semana al mes: agendar los controles los viernes a la tarde. Se casa en noviembre de 2027 y quiere terminar antes.",
    derivadoPor: "Consulta espontánea (Instagram)",
    activo: true,
    fotosIniciales: serie("carla-ini"),
    fotosIntra: [],
    fotosFinales: serieVacia(),
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    radiografias: [
      {
        id: "rx-c1",
        nombre: "panoramica-inicial.jpg",
        momento: "Inicial",
        formato: "imagen",
        url: fotoDemo("rx-carla-1", 600, 400),
      },
    ],
    estudios: [],
    diagnostico:
      "Clase I molar y canina. Apiñamiento anteroinferior severo, con 8 mm de discrepancia. Desvío de línea media inferior de 2 mm a la izquierda. Bruxismo.",
    plan:
      "Ortodoncia fija superior e inferior sin extracciones, con desgaste interproximal en el sector anteroinferior. Duración estimada de 18 meses. Contención fija inferior y placa removible superior al finalizar.",
    tecnica: "Brackets de autoligado pasivo, prescripción Roth 0.022",
    montoTotal: "1450000",
    condiciones:
      "Incluye colocación, controles mensuales, alambres y contención al finalizar. El reintegro de la obra social lo gestiona la paciente. Anticipo del 20% y 12 cuotas.",
    cuotas: cuotas(1),
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
    dni: "34207665",
    ocupacion: "Chef",
    edad: "34",
    fechaNacimiento: "1992-07-30",
    categoria: "Ortodoncia",
    sede: "La Plata",
    anamnesis:
      "Periodontitis leve tratada en 2024, con alta del periodoncista. Fumador de 10 cigarrillos por día. Hipertensión controlada con medicación.",
    obraSocial: "Particular",
    nroAfiliado: "",
    particularidades:
      "Trabaja de noche, prefiere turnos antes de las 11. Muy constante con los controles. Le interesa mucho ver el avance en fotos.",
    derivadoPor: "Dr. Ariel Souto (periodoncista)",
    activo: true,
    fotosIniciales: serie("martin-ini"),
    fotosIntra: [
      { id: "fi-m1", url: fotoDemo("martin-intra-1", 480, 600), fecha: "2025-11-12", nota: "Cementado inferior" },
      { id: "fi-m2", url: fotoDemo("martin-intra-2", 480, 600), fecha: "2026-01-20", nota: "Cambio de arco a 016x022 NiTi" },
      { id: "fi-m3", url: fotoDemo("martin-intra-3", 480, 600), fecha: "2026-03-17", nota: "Cierre de espacios — 4 meses" },
      { id: "fi-m4", url: fotoDemo("martin-intra-4", 480, 600), fecha: "2026-05-26", nota: "Control de torque anterosuperior" },
      { id: "fi-m5", url: fotoDemo("martin-intra-5", 480, 600), fecha: "2026-07-14", nota: "Arco de acero 019x025" },
      { id: "fi-m6", url: fotoDemo("martin-intra-6", 480, 600), fecha: "2026-09-08", nota: "Detallado final. Se evalúa fecha de retiro." },
    ],
    fotosFinales: serie("martin-fin", 6),
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    radiografias: [
      {
        id: "rx-m1",
        nombre: "panoramica-inicial.jpg",
        momento: "Inicial",
        formato: "imagen",
        url: fotoDemo("rx-martin-1", 600, 400),
      },
      {
        id: "rx-m2",
        nombre: "teleperfil-inicial.jpg",
        momento: "Inicial",
        formato: "imagen",
        url: fotoDemo("rx-martin-2", 600, 400),
      },
      {
        id: "rx-m3",
        nombre: "panoramica-control-12m.jpg",
        momento: "Intermedio",
        formato: "imagen",
        url: fotoDemo("rx-martin-3", 600, 400),
      },
    ],
    estudios: [
      { id: "es-m1", nombre: "cefalometria-inicial.pdf", momento: "Inicial", formato: "pdf", url: null },
      { id: "es-m2", nombre: "periodontograma-2024.pdf", momento: "Inicial", formato: "pdf", url: null },
      { id: "es-m3", nombre: "cefalometria-control.pdf", momento: "Intermedio", formato: "pdf", url: null },
    ],
    diagnostico:
      "Clase II división 1, subdivisión derecha. Resalte aumentado de 6 mm. Ausencia de la pieza 46 con migración mesial de la 47. Soporte periodontal reducido, estable.",
    plan:
      "Ortodoncia fija con anclaje esquelético (microtornillo en el sector posterior derecho) para verticalizar la pieza 47 y cerrar el espacio. Fuerzas livianas por el soporte periodontal reducido. Duración estimada de 20 meses. Contención fija superior e inferior.",
    tecnica: "Brackets metálicos MBT 0.022 + microtornillo de anclaje 1.5 x 8 mm",
    montoTotal: "1980000",
    condiciones:
      "Incluye aparatología, microtornillo, controles mensuales y contención. Pago particular en 12 cuotas sin interés. Las urgencias fuera de horario se cobran aparte.",
    cuotas: cuotas(9, "Efectivo"),
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
    dni: "51336480",
    ocupacion: "Estudiante — 1.º año",
    edad: "12",
    fechaNacimiento: "2014-09-03",
    categoria: "Ortopedia",
    sede: "Tandil",
    anamnesis:
      "Deglución atípica con interposición lingual. Sin antecedentes relevantes. Alergia a la penicilina.",
    obraSocial: "",
    nroAfiliado: "",
    particularidades:
      "Mamá: Sandra (2494-887766). Hermana de Bautista Fernández, vienen juntos a los controles cuando la familia está en Tandil. Toca el violín.",
    derivadoPor: "Derivación familiar",
    activo: true,
    fotosIniciales: serie("julieta-ini", 6),
    fotosIntra: [],
    fotosFinales: serieVacia(),
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    radiografias: [],
    estudios: [],
    diagnostico:
      "Mordida abierta anterior por hábito de interposición lingual. Dentición mixta, segunda fase.",
    plan: "Rejilla lingual fija y terapia miofuncional. Reevaluación a los 8 meses.",
    tecnica: "Rejilla lingual soldada a bandas en molares superiores",
    montoTotal: "",
    condiciones: "",
    cuotas: cuotasVacias(),
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
    dni: "29884310",
    ocupacion: "Docente",
    edad: "41",
    fechaNacimiento: "1985-01-19",
    categoria: "Alineadores",
    sede: "La Plata",
    anamnesis:
      "Tratamiento de ortodoncia en la adolescencia, sin contención posterior. Sin antecedentes médicos de relevancia.",
    obraSocial: "IOMA",
    nroAfiliado: "4-2288130-7",
    particularidades: "Terminó el tratamiento en 2025. Queda en control anual de contención.",
    derivadoPor: "Consulta espontánea",
    activo: false,
    fotosIniciales: serie("rocio-ini"),
    fotosIntra: [
      { id: "fi-r1", url: fotoDemo("rocio-intra-1", 480, 600), fecha: "2025-02-10", nota: "Control de alineación" },
    ],
    fotosFinales: serie("rocio-fin"),
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    radiografias: [
      {
        id: "rx-r1",
        nombre: "panoramica-final.jpg",
        momento: "Final",
        formato: "imagen",
        url: fotoDemo("rx-rocio-1", 600, 400),
      },
    ],
    estudios: [],
    diagnostico: "Recidiva de apiñamiento anteroinferior posterior al tratamiento, por falta de contención.",
    plan:
      "Realineación con alineadores removibles. Contención fija definitiva de la 33 a la 43. Finalizado en julio de 2025.",
    tecnica: "Alineadores removibles — 14 etapas",
    montoTotal: "990000",
    condiciones:
      "Tratamiento finalizado y abonado en su totalidad. Control de contención anual sin cargo.",
    cuotas: cuotas(12),
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
    dni: "35120884",
    ocupacion: "",
    edad: "34",
    fechaNacimiento: "",
    categoria: "Armonización facial",
    sede: "La Plata",
    anamnesis: "",
    obraSocial: "",
    nroAfiliado: "",
    particularidades:
      "Sin alergias conocidas. Primera vez con relleno: pidió expresamente algo sutil, que no se note. Trabaja en un estudio jurídico, prefiere turnos a la tarde.",
    derivadoPor: "Consulta espontánea (Instagram)",
    activo: true,
    fotosIniciales: serieVacia(),
    fotosIntra: [],
    fotosFinales: serieVacia(),
    fotosAntes: serieAF("malena-antes"),
    fotosDespues: serieAF("malena-despues", 2),
    radiografias: [],
    estudios: [],
    diagnostico:
      "Pérdida de volumen en el tercio medio. Surcos nasogenianos marcados y leve descenso de la cola de la ceja.",
    plan:
      "Relleno con ácido hialurónico en pómulos y surcos nasogenianos, en dos sesiones separadas por 30 días. Control de resultado al mes de la segunda.",
    tecnica: "",
    montoTotal: "420000",
    condiciones:
      "Incluye las dos sesiones, el producto y el control posterior. Los retoques después de los 6 meses se presupuestan aparte.",
    cuotas: cuotas(3),
    seguimiento: [],
  },
]
