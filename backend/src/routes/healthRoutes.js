const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "taskflow-backend",
  });
});

router.get("/ready", (req, res) => {
  const mongoConectado = mongoose.connection.readyState === 1;

  res.status(mongoConectado ? 200 : 503).json({
    status: mongoConectado ? "ready" : "unavailable",
    database: mongoConectado ? "connected" : "disconnected",
  });
});

module.exports = router;
