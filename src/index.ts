import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }, 200));

app.get("/users", (c) =>
  c.json(
    {
      users: [
        { id: 1, name: "Andres" },
        { id: 2, name: "Maria" },
        { id: 3, name: "Pedro" },
      ],
    },
    200
  )
);

const unusedVariable = "esto causara un error de linting";

export default app;
