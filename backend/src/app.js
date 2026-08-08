const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const tareaRoutes = require("./routes/tareaRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const ORIGENES_PERMITIDOS = [
  "http://localhost:5173",
  "http://localhost:30081",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || ORIGENES_PERMITIDOS.includes(origin)) {
      return callback(null, true);
    }
    const err = new Error("Origen no permitido por CORS");
    err.status = 403;
    callback(err);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tareas", tareaRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorMiddleware);

module.exports = app;
