require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const { connectDB } = require("./config/database");

const PORT = process.env.PORT || 3000;
const MONGO_RETRY_DELAY_MS = 5000;

async function connectWithRetry() {
  try {
    await connectDB();
    console.log("MongoDB conectado");
  } catch (err) {
    console.error(
      `No se pudo conectar a MongoDB (${err.message}). Reintentando en ${MONGO_RETRY_DELAY_MS / 1000}s...`,
    );
    setTimeout(connectWithRetry, MONGO_RETRY_DELAY_MS);
  }
}

// Solo se registran aquí (no en database.js) para que los tests, que abren y
// cierran la conexión intencionalmente, no disparen estos logs como si fueran errores.
mongoose.connection.on("error", (err) => {
  console.error("Error de conexión a MongoDB:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.error(
    `MongoDB desconectado. Reintentando en ${MONGO_RETRY_DELAY_MS / 1000}s...`,
  );
  setTimeout(connectWithRetry, MONGO_RETRY_DELAY_MS);
});

connectWithRetry();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`taskflow-backend escuchando en 0.0.0.0:${PORT}`);
});
