import { getUserFromRequest } from "./api.js";

import { dirname, join } from "node:path";

const projectRoot = dirname(import.meta.dir);

export const pageRoutes = {
  "/": (req) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.redirect("/login", 302);
    }
    return new Response(Bun.file(join(projectRoot, "public", "index.html")));
  },

  "/login": () => {
    return new Response(Bun.file(join(projectRoot, "public", "login.html")));
  },

  "/register": () => {
    return new Response(Bun.file(join(projectRoot, "public", "register.html")));
  },

  "/profile": (req) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.redirect("/login", 302);
    }
    return new Response(Bun.file(join(projectRoot, "public", "profile.html")));
  },
};
