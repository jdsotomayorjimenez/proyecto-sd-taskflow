const { conectarDB, limpiarColecciones, cerrarDB } = require("./helpers/db");

const request = require("supertest");
const app = require("../src/app");
const Usuario = require("../src/models/Usuario");

beforeAll(async () => {
  await conectarDB();
});

afterEach(async () => {
  await limpiarColecciones();
});

afterAll(async () => {
  await cerrarDB();
});

const usuarioValido = {
  nombre: "Ana",
  email: "ana@test.com",
  password: "clave123",
};

describe("POST /api/auth/register", () => {
  it("registra un usuario válido y no expone passwordHash", async () => {
    const res = await request(app).post("/api/auth/register").send(usuarioValido);

    expect(res.status).toBe(201);
    expect(res.body.usuario).toEqual({
      id: expect.any(String),
      nombre: "Ana",
      email: "ana@test.com",
    });
    expect(res.body.usuario.passwordHash).toBeUndefined();

    const enDB = await Usuario.findOne({ email: "ana@test.com" }).select("+passwordHash");
    expect(enDB.passwordHash).not.toBe("clave123");
  });

  it("rechaza registro con nombre faltante", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "sin-nombre@test.com", password: "clave123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it("rechaza registro con email inválido", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ nombre: "X", email: "no-es-email", password: "clave123" });

    expect(res.status).toBe(400);
  });

  it("rechaza registro con password menor a 6 caracteres", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ nombre: "X", email: "x@test.com", password: "123" });

    expect(res.status).toBe(400);
  });

  it("rechaza email duplicado con 409", async () => {
    await request(app).post("/api/auth/register").send(usuarioValido);
    const res = await request(app).post("/api/auth/register").send(usuarioValido);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(usuarioValido);
  });

  it("inicia sesión con credenciales correctas y no expone passwordHash", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuarioValido.email, password: usuarioValido.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual({
      id: expect.any(String),
      nombre: "Ana",
      email: "ana@test.com",
    });
    expect(res.body.usuario.passwordHash).toBeUndefined();
  });

  it("rechaza password incorrecta con 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuarioValido.email, password: "incorrecta" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it("rechaza email inexistente con 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "no-existe@test.com", password: "clave123" });

    expect(res.status).toBe(401);
  });
});
