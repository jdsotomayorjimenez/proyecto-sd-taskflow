const { conectarDB, limpiarColecciones, cerrarDB } = require("./helpers/db");

const request = require("supertest");
const app = require("../src/app");

let tokenA;
let tokenB;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function registrarYLoguear(email) {
  await request(app)
    .post("/api/auth/register")
    .send({ nombre: "Test", email, password: "clave123" });
  const res = await request(app).post("/api/auth/login").send({ email, password: "clave123" });
  return res.body.token;
}

beforeAll(async () => {
  await conectarDB();
});

beforeEach(async () => {
  tokenA = await registrarYLoguear("usuarioA@test.com");
  tokenB = await registrarYLoguear("usuarioB@test.com");
});

afterEach(async () => {
  await limpiarColecciones();
});

afterAll(async () => {
  await cerrarDB();
});

describe("CRUD de tareas", () => {
  it("crea una tarea y asigna usuarioId del token, ignorando el body", async () => {
    const res = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({ titulo: "Tarea A", usuarioId: "000000000000000000000000" });

    expect(res.status).toBe(201);
    expect(res.body.titulo).toBe("Tarea A");
    expect(res.body.usuarioId).not.toBe("000000000000000000000000");
    expect(res.body.estado).toBe("Pendiente");
    expect(res.body.prioridad).toBe("Media");
  });

  it("rechaza crear sin token con 401", async () => {
    const res = await request(app).post("/api/tareas").send({ titulo: "Sin token" });
    expect(res.status).toBe(401);
  });

  it("rechaza token inválido con 401", async () => {
    const res = await request(app)
      .post("/api/tareas")
      .set("Authorization", "Bearer token-falso")
      .send({ titulo: "x" });
    expect(res.status).toBe(401);
  });

  it("rechaza tarea sin titulo con 400", async () => {
    const res = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({});
    expect(res.status).toBe(400);
  });

  it("rechaza estado inválido con 400", async () => {
    const res = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({ titulo: "x", estado: "Inventado" });
    expect(res.status).toBe(400);
  });

  it("rechaza prioridad inválida con 400", async () => {
    const res = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({ titulo: "x", prioridad: "Urgentisima" });
    expect(res.status).toBe(400);
  });

  it("rechaza horaInicio con formato inválido con 400", async () => {
    const res = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({ titulo: "x", horaInicio: "25:99" });
    expect(res.status).toBe(400);
  });

  it("rechaza fecha con formato inválido con 400", async () => {
    const res = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({ titulo: "x", fecha: "no-es-fecha" });
    expect(res.status).toBe(400);
  });

  it("lista solo las tareas del usuario autenticado", async () => {
    await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "De A" });
    await request(app).post("/api/tareas").set(authHeader(tokenB)).send({ titulo: "De B" });

    const res = await request(app).get("/api/tareas").set(authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.tareas).toHaveLength(1);
    expect(res.body.tareas[0].titulo).toBe("De A");
  });

  it("obtiene una tarea propia por id", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "De A" });
    const res = await request(app).get(`/api/tareas/${creada.body._id}`).set(authHeader(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe("De A");
  });

  it("responde 400 si el id tiene formato inválido", async () => {
    const res = await request(app).get("/api/tareas/no-es-un-id").set(authHeader(tokenA));
    expect(res.status).toBe(400);
  });

  it("responde 404 si el id es válido pero no existe", async () => {
    const res = await request(app)
      .get("/api/tareas/665f1a2b3c4d5e6f7a8b9c0d")
      .set(authHeader(tokenA));
    expect(res.status).toBe(404);
  });

  it("usuario B no puede ver una tarea de A (404)", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "De A" });
    const res = await request(app).get(`/api/tareas/${creada.body._id}`).set(authHeader(tokenB));
    expect(res.status).toBe(404);
  });

  it("usuario B no puede editar una tarea de A (404)", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "De A" });
    const res = await request(app)
      .put(`/api/tareas/${creada.body._id}`)
      .set(authHeader(tokenB))
      .send({ titulo: "Hackeada" });
    expect(res.status).toBe(404);
  });

  it("usuario B no puede eliminar una tarea de A (404)", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "De A" });
    const res = await request(app).delete(`/api/tareas/${creada.body._id}`).set(authHeader(tokenB));
    expect(res.status).toBe(404);
  });

  it("edita una tarea propia con PUT", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "Original" });
    const res = await request(app)
      .put(`/api/tareas/${creada.body._id}`)
      .set(authHeader(tokenA))
      .send({ titulo: "Editada", prioridad: "Alta" });

    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe("Editada");
    expect(res.body.prioridad).toBe("Alta");
  });

  it("elimina una tarea propia con DELETE", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "Para borrar" });
    const res = await request(app).delete(`/api/tareas/${creada.body._id}`).set(authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mensaje: "Tarea eliminada" });

    const consulta = await request(app).get(`/api/tareas/${creada.body._id}`).set(authHeader(tokenA));
    expect(consulta.status).toBe(404);
  });
});

describe("PATCH /api/tareas/:id/completar - recurrencia", () => {
  it("tarea sin recurrencia: pasa a Completada y no crea una nueva", async () => {
    const creada = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({ titulo: "Simple", fecha: "2026-08-10T00:00:00.000Z" });

    const res = await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("Completada");

    const listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    expect(listado.body.tareas).toHaveLength(1);
  });

  it("tarea diaria: genera exactamente una siguiente ocurrencia un día después, con el mismo serieId", async () => {
    const creada = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({
        titulo: "Diaria",
        fecha: "2026-08-10T00:00:00.000Z",
        repeticion: { tipo: "diaria", intervalo: 1, diasSemana: [], fechaFin: null },
      });

    const res = await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenA));
    expect(res.body.estado).toBe("Completada");
    expect(res.body.serieId).toBeTruthy();

    const listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    expect(listado.body.tareas).toHaveLength(2);

    const siguiente = listado.body.tareas.find((t) => t.estado === "Pendiente");
    expect(siguiente.serieId).toBe(res.body.serieId);
    expect(new Date(siguiente.fecha).toISOString()).toBe("2026-08-11T00:00:00.000Z");
  });

  it("tarea semanal con diasSemana: la siguiente ocurrencia cae en el próximo día indicado", async () => {
    // 2026-08-10 es lunes (dia UTC 1); diasSemana [1,3,5] -> siguiente es miércoles 12
    const creada = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({
        titulo: "Semanal",
        fecha: "2026-08-10T00:00:00.000Z",
        repeticion: { tipo: "semanal", intervalo: 1, diasSemana: [1, 3, 5], fechaFin: null },
      });

    const res = await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenA));
    const listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    const siguiente = listado.body.tareas.find((t) => t.estado === "Pendiente");

    expect(new Date(siguiente.fecha).toISOString()).toBe("2026-08-12T00:00:00.000Z");
    expect(siguiente.serieId).toBe(res.body.serieId);
  });

  it("tarea mensual: la siguiente ocurrencia cae un mes después", async () => {
    const creada = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({
        titulo: "Mensual",
        fecha: "2026-08-10T00:00:00.000Z",
        repeticion: { tipo: "mensual", intervalo: 1, diasSemana: [], fechaFin: null },
      });

    await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenA));
    const listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    const siguiente = listado.body.tareas.find((t) => t.estado === "Pendiente");

    expect(new Date(siguiente.fecha).toISOString()).toBe("2026-09-10T00:00:00.000Z");
  });

  it("conserva el mismo serieId a través de varias completaciones y no genera duplicados", async () => {
    const creada = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({
        titulo: "Cadena",
        fecha: "2026-08-10T00:00:00.000Z",
        repeticion: { tipo: "diaria", intervalo: 1, diasSemana: [], fechaFin: null },
      });

    const primera = await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenA));
    const serieId = primera.body.serieId;

    let listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    const segunda = listado.body.tareas.find((t) => t.estado === "Pendiente");

    const resultadoSegunda = await request(app)
      .patch(`/api/tareas/${segunda._id}/completar`)
      .set(authHeader(tokenA));
    expect(resultadoSegunda.body.serieId).toBe(serieId);

    listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    expect(listado.body.tareas).toHaveLength(3);
    expect(listado.body.tareas.filter((t) => t.estado === "Completada")).toHaveLength(2);
    expect(listado.body.tareas.filter((t) => t.estado === "Pendiente")).toHaveLength(1);
    expect(listado.body.tareas.every((t) => t.serieId === serieId)).toBe(true);
  });

  it("no genera siguiente ocurrencia si fechaFin ya pasó", async () => {
    const creada = await request(app)
      .post("/api/tareas")
      .set(authHeader(tokenA))
      .send({
        titulo: "Con fin",
        fecha: "2026-08-10T00:00:00.000Z",
        repeticion: { tipo: "diaria", intervalo: 1, diasSemana: [], fechaFin: "2026-08-10T00:00:00.000Z" },
      });

    await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenA));
    const listado = await request(app).get("/api/tareas").set(authHeader(tokenA));
    expect(listado.body.tareas).toHaveLength(1);
  });

  it("responde 404 al completar una tarea de otro usuario", async () => {
    const creada = await request(app).post("/api/tareas").set(authHeader(tokenA)).send({ titulo: "De A" });
    const res = await request(app).patch(`/api/tareas/${creada.body._id}/completar`).set(authHeader(tokenB));
    expect(res.status).toBe(404);
  });
});
