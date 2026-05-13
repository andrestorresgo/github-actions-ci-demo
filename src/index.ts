import { Hono } from "hono";
import usersApp from "./users";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", version: "v2.0.0" }, 200));

app.route("/users", usersApp);

// ruleset test commit

export default app;
