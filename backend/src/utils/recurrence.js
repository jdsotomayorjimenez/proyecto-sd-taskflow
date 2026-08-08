const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

function siguienteDiaSemana(base, diasSemana) {
  const dias = [...diasSemana].sort((a, b) => a - b);
  const diaActual = base.getUTCDay();

  const siguienteMismaSemana = dias.find((d) => d > diaActual);
  const offset = siguienteMismaSemana !== undefined
    ? siguienteMismaSemana - diaActual
    : 7 - diaActual + dias[0];

  return new Date(base.getTime() + offset * MILISEGUNDOS_POR_DIA);
}

function calcularSiguienteFecha(fechaActual, repeticion) {
  if (!repeticion || repeticion.tipo === "ninguna" || !fechaActual) {
    return null;
  }

  const base = new Date(fechaActual);
  const intervalo = repeticion.intervalo && repeticion.intervalo > 0 ? repeticion.intervalo : 1;
  let siguiente;

  switch (repeticion.tipo) {
    case "diaria":
      siguiente = new Date(base.getTime() + intervalo * MILISEGUNDOS_POR_DIA);
      break;

    case "semanal":
      // Con diasSemana definidos, cada ocurrencia avanza al próximo día de la lista
      // (ciclando semanalmente); intervalo solo aplica cuando no hay diasSemana.
      if (repeticion.diasSemana && repeticion.diasSemana.length > 0) {
        siguiente = siguienteDiaSemana(base, repeticion.diasSemana);
      } else {
        siguiente = new Date(base.getTime() + intervalo * 7 * MILISEGUNDOS_POR_DIA);
      }
      break;

    case "mensual":
      siguiente = new Date(base);
      siguiente.setUTCMonth(siguiente.getUTCMonth() + intervalo);
      break;

    default:
      return null;
  }

  if (repeticion.fechaFin && siguiente > new Date(repeticion.fechaFin)) {
    return null;
  }

  return siguiente;
}

module.exports = { calcularSiguienteFecha };
