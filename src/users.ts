import { Hono } from "hono";

export interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Andres" },
  { id: 2, name: "Maria" },
  { id: 3, name: "Pedro" },
];

const usersApp = new Hono();

usersApp.get("/", (c) => c.json({ users }, 200));

usersApp.get("/:id", (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  const user = users.find((u) => u.id === id);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ user }, 200);
});

usersApp.post("/", async (c) => {
  const body = await c.req.json<{ name: string }>();
  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const newUser: User = {
    id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
    name: body.name,
  };
  users.push(newUser);
  return c.json({ user: newUser }, 201);
});

usersApp.put("/:id", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ name: string }>();
  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return c.json({ error: "User not found" }, 404);
  }

  users[userIndex].name = body.name;
  return c.json({ user: users[userIndex] }, 200);
});

usersApp.delete("/:id", (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return c.json({ error: "User not found" }, 404);
  }

  const deletedUser = users.splice(userIndex, 1)[0];
  return c.json({ user: deletedUser }, 200);
});

export default usersApp;
