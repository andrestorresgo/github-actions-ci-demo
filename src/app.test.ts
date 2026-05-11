import { describe, expect, it, test } from "vitest";
import app from "./index";

describe("API tests", () => {
  test("GET /health should return status ok", async () => {
    const response = await app.request("/health");
    const data = await response.json();
    expect(data).toEqual({ status: "ok" });
  });

  it("GET /users should return list of users", async () => {
    const response = await app.request("/users");
    const data = await response.json();
    expect(data).toEqual({
      users: [
        { id: 1, name: "Andres" },
        { id: 2, name: "Maria" },
        { id: 3, name: "Pedro" },
      ],
    });
  });
});
