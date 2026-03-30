import "./backend/db.js";
import { apiRoutes } from "./backend/api.js";
import { pageRoutes } from "./backend/routes.js";
import { join } from "node:path";

const projectRoot = import.meta.dir;

Bun.serve({
  port: Number(process.env.PORT ?? 3000),

  routes: {
    ...pageRoutes,
    ...apiRoutes,
  },

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/public/") && !pathname.includes("..")) {
      const file = Bun.file(join(projectRoot, pathname.slice(1)));
      if (await file.exists()) {
        return new Response(file);
      }
    }

    return new Response("Not Found", { status: 404 });
  },

  error(err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(
  `Demo app running at http://localhost:${process.env.PORT ?? 3000}`
);
