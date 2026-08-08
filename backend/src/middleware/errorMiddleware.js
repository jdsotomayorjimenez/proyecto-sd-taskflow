// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const mensaje = status === 500 ? "Error interno del servidor" : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: mensaje });
}

module.exports = errorMiddleware;
