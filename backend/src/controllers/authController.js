const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");
const { hashPassword } = require("../utils/password");

const JWT_EXPIRES_IN = "7d";

function apiError(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

function serializarUsuario(usuario) {
  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    email: usuario.email,
  };
}

async function register(req, res, next) {
  try {
    const { nombre, email, password } = req.body;
    const emailNormalizado = email.toLowerCase().trim();

    const existente = await Usuario.findOne({ email: emailNormalizado });
    if (existente) {
      return next(apiError(409, "El correo ya está registrado"));
    }

    const passwordHash = await hashPassword(password);
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      email: emailNormalizado,
      passwordHash,
    });

    res.status(201).json({ usuario: serializarUsuario(usuario) });
  } catch (err) {
    if (err.code === 11000) {
      return next(apiError(409, "El correo ya está registrado"));
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const emailNormalizado = email.toLowerCase().trim();

    const usuario = await Usuario.findOne({ email: emailNormalizado }).select("+passwordHash");
    if (!usuario) {
      return next(apiError(401, "Credenciales inválidas"));
    }

    const coincide = await bcrypt.compare(password, usuario.passwordHash);
    if (!coincide) {
      return next(apiError(401, "Credenciales inválidas"));
    }

    const token = jwt.sign({ id: usuario._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({ token, usuario: serializarUsuario(usuario) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
