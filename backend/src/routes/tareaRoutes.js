const express = require("express");

const tareaController = require("../controllers/tareaController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateTareaBody, validateObjectIdParam } = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", tareaController.listar);
router.get("/:id", validateObjectIdParam, tareaController.obtener);
router.post("/", validateTareaBody, tareaController.crear);
router.put("/:id", validateObjectIdParam, validateTareaBody, tareaController.actualizar);
router.delete("/:id", validateObjectIdParam, tareaController.eliminar);
router.patch("/:id/completar", validateObjectIdParam, tareaController.completar);

module.exports = router;
