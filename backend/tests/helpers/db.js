require("dotenv").config();

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-solo-para-tests";
process.env.MONGO_DATABASE = process.env.MONGO_DATABASE || "taskflow_test";

const mongoose = require("mongoose");
const { connectDB } = require("../../src/config/database");

async function conectarDB() {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
}

async function limpiarColecciones() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((coleccion) => coleccion.deleteMany({})),
  );
}

async function cerrarDB() {
  await mongoose.connection.close();
}

module.exports = { conectarDB, limpiarColecciones, cerrarDB };
