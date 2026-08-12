const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");

describe("GET /api/health", () => {
  it("responde 200 con el JSON exacto esperado", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      service: "taskflow-backend",
    });
  });
});

describe("GET /api/ready", () => {
  it("responde 503 cuando Mongoose no está conectado", async () => {
    expect(mongoose.connection.readyState).toBe(0);

    const res = await request(app).get("/api/ready");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: "unavailable",
      database: "disconnected",
    });
  });
});
