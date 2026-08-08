require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/database");

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("No se pudo conectar a MongoDB:", err.message));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`taskflow-backend escuchando en 0.0.0.0:${PORT}`);
});
