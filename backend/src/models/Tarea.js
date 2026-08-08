const mongoose = require("mongoose");

const ESTADOS = ["Pendiente", "En progreso", "Completada"];
const PRIORIDADES = ["Baja", "Media", "Alta"];
const TIPOS_RECURRENCIA = ["ninguna", "diaria", "semanal", "mensual"];

const repeticionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: TIPOS_RECURRENCIA,
      default: "ninguna",
    },
    intervalo: {
      type: Number,
      default: 1,
    },
    diasSemana: {
      type: [Number],
      default: [],
    },
    fechaFin: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const tareaSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },
    estado: {
      type: String,
      enum: ESTADOS,
      default: "Pendiente",
    },
    prioridad: {
      type: String,
      enum: PRIORIDADES,
      default: "Media",
    },
    fecha: {
      type: Date,
      default: null,
    },
    horaInicio: {
      type: String,
      default: null,
    },
    horaFin: {
      type: String,
      default: null,
    },
    repeticion: {
      type: repeticionSchema,
      default: () => ({}),
    },
    serieId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Tarea", tareaSchema);
module.exports.ESTADOS = ESTADOS;
module.exports.PRIORIDADES = PRIORIDADES;
module.exports.TIPOS_RECURRENCIA = TIPOS_RECURRENCIA;
