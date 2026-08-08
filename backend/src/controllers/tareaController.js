const Tarea = require("../models/Tarea");
const { calcularSiguienteFecha } = require("../utils/recurrence");

const CAMPOS_EDITABLES = [
  "titulo",
  "descripcion",
  "estado",
  "prioridad",
  "fecha",
  "horaInicio",
  "horaFin",
  "repeticion",
];

function apiError(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

function extraerCamposEditables(body) {
  const datos = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) {
      datos[campo] = body[campo];
    }
  }
  return datos;
}

async function listar(req, res, next) {
  try {
    const tareas = await Tarea.find({ usuarioId: req.usuario.id }).sort({ fecha: 1, createdAt: 1 });
    res.status(200).json({ tareas });
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const tarea = await Tarea.findOne({ _id: req.params.id, usuarioId: req.usuario.id });
    if (!tarea) {
      return next(apiError(404, "Tarea no encontrada"));
    }
    res.status(200).json(tarea);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const datos = extraerCamposEditables(req.body);
    const tarea = await Tarea.create({
      ...datos,
      usuarioId: req.usuario.id,
      serieId: null,
    });
    res.status(201).json(tarea);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const tarea = await Tarea.findOne({ _id: req.params.id, usuarioId: req.usuario.id });
    if (!tarea) {
      return next(apiError(404, "Tarea no encontrada"));
    }

    const datos = extraerCamposEditables(req.body);
    Object.assign(tarea, datos);
    await tarea.save();

    res.status(200).json(tarea);
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const tarea = await Tarea.findOneAndDelete({ _id: req.params.id, usuarioId: req.usuario.id });
    if (!tarea) {
      return next(apiError(404, "Tarea no encontrada"));
    }
    res.status(200).json({ mensaje: "Tarea eliminada" });
  } catch (err) {
    next(err);
  }
}

async function completar(req, res, next) {
  try {
    const tarea = await Tarea.findOne({ _id: req.params.id, usuarioId: req.usuario.id });
    if (!tarea) {
      return next(apiError(404, "Tarea no encontrada"));
    }

    if (!tarea.serieId) {
      tarea.serieId = tarea._id.toString();
    }
    tarea.estado = "Completada";
    await tarea.save();

    const siguienteFecha = calcularSiguienteFecha(tarea.fecha, tarea.repeticion);
    if (siguienteFecha) {
      await Tarea.create({
        usuarioId: tarea.usuarioId,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        estado: "Pendiente",
        prioridad: tarea.prioridad,
        fecha: siguienteFecha,
        horaInicio: tarea.horaInicio,
        horaFin: tarea.horaFin,
        repeticion: tarea.repeticion,
        serieId: tarea.serieId,
      });
    }

    res.status(200).json(tarea);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, completar };
