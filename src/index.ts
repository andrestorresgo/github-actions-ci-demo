import { Hono } from "hono";
import usersApp from "./users";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }, 200));

app.route("/users", usersApp);

// ruleset test commit

export default app;
