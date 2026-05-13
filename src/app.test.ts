import { describe, expect, it, test } from "vitest";
import { app } from "./index";

describe("API tests", () => {
  test("GET /health should return status ok and version", async () => {
    const response = await app.request("/health");
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok", version: "v3.0.0" });
  });

  describe("Users CRUD", () => {
    it("GET /users should return list of users", async () => {
      const response = await app.request("/users");
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({
        users: [
          { id: 1, name: "Andres" },
          { id: 2, name: "Maria" },
          { id: 3, name: "Pedro" },
        ],
      });
    });

    it("GET /users/:id should return a user", async () => {
      const response = await app.request("/users/1");
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({ user: { id: 1, name: "Andres" } });
    });

    it("GET /users/:id should return 404 for non-existent user", async () => {
      const response = await app.request("/users/999");
      expect(response.status).toBe(404);
    });

    it("POST /users should create a user", async () => {
      const response = await app.request("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Juan" }),
      });
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data).toEqual({ user: { id: 4, name: "Juan" } });
    });

    it("PUT /users/:id should update a user", async () => {
      const response = await app.request("/users/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Andres Updated" }),
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({ user: { id: 1, name: "Andres Updated" } });
    });

    it("DELETE /users/:id should delete a user", async () => {
      const response = await app.request("/users/1", {
        method: "DELETE",
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({ user: { id: 1, name: "Andres Updated" } });

      const getResponse = await app.request("/users/1");
      expect(getResponse.status).toBe(404);
    });
  });
});
