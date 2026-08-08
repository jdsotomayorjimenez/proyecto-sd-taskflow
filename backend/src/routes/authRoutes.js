const express = require("express");

const authController = require("../controllers/authController");
const { validateRegisterBody, validateLoginBody } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", validateRegisterBody, authController.register);
router.post("/login", validateLoginBody, authController.login);

module.exports = router;
