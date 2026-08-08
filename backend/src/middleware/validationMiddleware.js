const mongoose = require("mongoose");
const { ESTADOS, PRIORIDADES, TIPOS_RECURRENCIA } = require("../models/Tarea");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function badRequest(mensaje) {
  const err = new Error(mensaje);
  err.status = 400;
  return err;
}

function validateRegisterBody(req, res, next) {
  const { nombre, email, password } = req.body || {};

  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    return next(badRequest("El nombre es obligatorio"));
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return next(badRequest("El email es obligatorio y debe ser válido"));
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return next(badRequest("La contraseña debe tener al menos 6 caracteres"));
  }

  next();
}

function validateLoginBody(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string") {
    return next(badRequest("El email es obligatorio"));
  }
  if (!password || typeof password !== "string") {
    return next(badRequest("La contraseña es obligatoria"));
  }

  next();
}

function validateTareaBody(req, res, next) {
  const { titulo, estado, prioridad, fecha, horaInicio, horaFin, repeticion } = req.body || {};

  if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
    return next(badRequest("El título es obligatorio"));
  }
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    return next(badRequest(`El estado debe ser uno de: ${ESTADOS.join(", ")}`));
  }
  if (prioridad !== undefined && !PRIORIDADES.includes(prioridad)) {
    return next(badRequest(`La prioridad debe ser una de: ${PRIORIDADES.join(", ")}`));
  }
  if (fecha !== undefined && fecha !== null && Number.isNaN(Date.parse(fecha))) {
    return next(badRequest("La fecha no tiene un formato válido"));
  }
  if (horaInicio !== undefined && horaInicio !== null && !HORA_REGEX.test(horaInicio)) {
    return next(badRequest("horaInicio debe tener formato HH:MM"));
  }
  if (horaFin !== undefined && horaFin !== null && !HORA_REGEX.test(horaFin)) {
    return next(badRequest("horaFin debe tener formato HH:MM"));
  }
  if (repeticion !== undefined && repeticion !== null) {
    if (repeticion.tipo !== undefined && !TIPOS_RECURRENCIA.includes(repeticion.tipo)) {
      return next(badRequest(`repeticion.tipo debe ser uno de: ${TIPOS_RECURRENCIA.join(", ")}`));
    }
    if (repeticion.fechaFin !== undefined && repeticion.fechaFin !== null && Number.isNaN(Date.parse(repeticion.fechaFin))) {
      return next(badRequest("repeticion.fechaFin no tiene un formato válido"));
    }
  }

  next();
}

function validateObjectIdParam(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(badRequest("ID inválido"));
  }
  next();
}

module.exports = {
  validateRegisterBody,
  validateLoginBody,
  validateTareaBody,
  validateObjectIdParam,
};
