require("dotenv").config();

const mongoose = require("mongoose");

const { connectDB, buildMongoUri } = require("../src/config/database");
const Usuario = require("../src/models/Usuario");
const Tarea = require("../src/models/Tarea");
const { hashPassword } = require("../src/utils/password");

function diasDesdeHoy(offset) {
  const fecha = new Date();
  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCDate(fecha.getUTCDate() + offset);
  return fecha;
}

const USUARIOS_DEMO = [
  {
    nombre: "Ana Demo",
    email: "demo1@taskflow.test",
    password: "demo1234",
    tareas: [
      {
        titulo: "Preparar presentación TaskFlow",
        descripcion: "Diapositivas y guion para la exposición",
        estado: "Pendiente",
        prioridad: "Alta",
        fecha: diasDesdeHoy(1),
        horaInicio: "09:00",
        horaFin: "10:00",
      },
      {
        titulo: "Revisar pull requests",
        descripcion: "Revisar cambios del equipo antes del standup",
        estado: "En progreso",
        prioridad: "Media",
        fecha: diasDesdeHoy(0),
        horaInicio: "14:00",
        horaFin: "15:00",
      },
      {
        titulo: "Backup semanal de base de datos",
        descripcion: "Automatizar respaldo de MongoDB",
        estado: "Pendiente",
        prioridad: "Baja",
        fecha: diasDesdeHoy(0),
        repeticion: { tipo: "semanal", intervalo: 1, diasSemana: [1], fechaFin: null },
      },
      {
        titulo: "Actualizar dependencias",
        descripcion: "Tarea vencida de ejemplo",
        estado: "Pendiente",
        prioridad: "Media",
        fecha: diasDesdeHoy(-3),
      },
      {
        titulo: "Entrega de informe",
        descripcion: "Informe mensual de avance",
        estado: "Completada",
        prioridad: "Alta",
        fecha: diasDesdeHoy(-1),
      },
    ],
  },
  {
    nombre: "Lautaro Demo",
    email: "lautaro@taskflow.test",
    password: "quintero1234",
    tareas: [
      {
        titulo: "Diseñar wireframes",
        descripcion: "Wireframes de las pantallas principales",
        estado: "Pendiente",
        prioridad: "Alta",
        fecha: diasDesdeHoy(2),
        horaInicio: "11:00",
        horaFin: "12:30",
      },
      {
        titulo: "Reunión diaria de equipo",
        descripcion: "Sync rápido de avances",
        estado: "Pendiente",
        prioridad: "Media",
        fecha: diasDesdeHoy(0),
        horaInicio: "08:30",
        horaFin: "08:45",
        repeticion: { tipo: "diaria", intervalo: 1, diasSemana: [], fechaFin: null },
      },
      {
        titulo: "Pagar servicios",
        descripcion: "Pago mensual de servicios",
        estado: "Pendiente",
        prioridad: "Baja",
        fecha: diasDesdeHoy(5),
        repeticion: { tipo: "mensual", intervalo: 1, diasSemana: [], fechaFin: null },
      },
      {
        titulo: "Configurar ambiente de desarrollo",
        descripcion: "Instalar dependencias y herramientas locales",
        estado: "Completada",
        prioridad: "Media",
        fecha: diasDesdeHoy(-2),
      },
    ],
  },
];

async function limpiarUsuarioDemo(email) {
  const usuario = await Usuario.findOne({ email });
  if (!usuario) return;

  await Tarea.deleteMany({ usuarioId: usuario._id });
  await Usuario.deleteOne({ _id: usuario._id });
}

async function crearUsuarioDemo({ nombre, email, password, tareas }) {
  const passwordHash = await hashPassword(password);
  const usuario = await Usuario.create({ nombre, email, passwordHash });

  await Tarea.insertMany(
    tareas.map((tarea) => ({ ...tarea, usuarioId: usuario._id, serieId: null })),
  );

  return usuario;
}

async function main() {
  console.log(`Conectando a: ${buildMongoUri().replace(/:[^:@]*@/, ":***@")}`);
  await connectDB();

  for (const datos of USUARIOS_DEMO) {
    await limpiarUsuarioDemo(datos.email);
    await crearUsuarioDemo(datos);
    console.log(`Usuario sembrado: ${datos.email} / password "${datos.password}" (${datos.tareas.length} tareas)`);
  }

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Error al sembrar datos:", err);
  process.exit(1);
});
