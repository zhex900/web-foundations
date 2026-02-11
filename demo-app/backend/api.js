import {
  getUserFromSession,
  createSession,
  deleteSession,
  getUserByUsername,
  getAllPosts,
  getLikeCounts,
  getUserLikes,
  createPost,
  toggleLike,
  updateUsername,
  updatePassword,
  getUserById,
  createUser,
  updateAvatar,
  getPostOwner,
  deletePost,
} from "./db.js";

import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";

const projectRoot = dirname(import.meta.dir);
const uploadsDir = join(projectRoot, "public", "uploads", "avatars");
mkdirSync(uploadsDir, { recursive: true });

async function handleAvatarUpload(formData) {
  const avatarFile = formData.get("avatar");
  if (!avatarFile || !(avatarFile instanceof File)) {
    return null;
  }
  if (avatarFile.size === 0) {
    return null;
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(avatarFile.type)) {
    return null;
  }
  if (avatarFile.size > 5 * 1024 * 1024) {
    return null;
  }
  const ext = avatarFile.name.split(".").pop() || "jpg";
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const filepath = join(uploadsDir, filename);
  const arrayBuffer = await avatarFile.arrayBuffer();
  writeFileSync(filepath, Buffer.from(arrayBuffer));
  return `/public/uploads/avatars/${filename}`;
}

export function sessionToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getUserFromRequest(req) {
  const token = req.cookies.get("session");
  return getUserFromSession(token);
}

export function requireUser(req) {
  return getUserFromRequest(req);
}

export async function parseBody(req) {
  const contentType = req.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return await req.json();
  }
  if (contentType.includes("multipart/form-data")) {
    return await req.formData();
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
}

export const apiRoutes = {
  "/api/me": (req) => {
    const user = getUserFromRequest(req);
    return Response.json({ user });
  },

  "/api/register": {
    POST: async (req) => {
      const body = await parseBody(req);
      const isFormData = body instanceof FormData;
      const username = isFormData
        ? String(body.get("username") ?? "").trim()
        : String(body.username ?? "").trim();
      const password = isFormData
        ? String(body.get("password") ?? "")
        : String(body.password ?? "");
      const confirmPassword = isFormData
        ? String(body.get("confirmPassword") ?? "")
        : String(body.confirmPassword ?? "");

      if (!username || username.length < 3) {
        return Response.redirect("/register?error=username_invalid", 302);
      }
      if (!password || password.length < 4) {
        return Response.redirect("/register?error=password_invalid", 302);
      }
      if (password !== confirmPassword) {
        return Response.redirect("/register?error=password_mismatch", 302);
      }

      const existing = getUserByUsername(username);
      if (existing) {
        return Response.redirect("/register?error=username_taken", 302);
      }

      const avatarUrl = isFormData ? await handleAvatarUpload(body) : null;

      const hash = await Bun.password.hash(password, {
        algorithm: "bcrypt",
        cost: 10,
      });
      const user = createUser(username, hash, avatarUrl);

      const token = sessionToken();
      createSession(user.id, token);
      req.cookies.set("session", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return Response.redirect("/", 302);
    },
  },

  "/api/login": {
    POST: async (req) => {
      const body = await parseBody(req);
      const isFormData = body instanceof FormData;
      const username = isFormData
        ? String(body.get("username") ?? "").trim()
        : String(body.username ?? "").trim();
      const password = isFormData
        ? String(body.get("password") ?? "")
        : String(body.password ?? "");
      const user = getUserByUsername(username);
      const valid =
        user && (await Bun.password.verify(password, user.password_hash));
      if (!valid) {
        return Response.redirect("/login?login=failed", 302);
      }
      const token = sessionToken();
      createSession(user.id, token);
      req.cookies.set("session", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return Response.redirect("/", 302);
    },
  },

  "/api/logout": {
    POST: (req) => {
      const token = req.cookies.get("session");
      deleteSession(token);
      req.cookies.delete("session", { path: "/" });
      return Response.redirect("/login", 302);
    },
  },

  "/api/posts": {
    GET: (req) => {
      const user = getUserFromRequest(req);
      const rows = getAllPosts();
      const likeCounts = getLikeCounts();
      const likedByMe = getUserLikes(user?.id);

      const posts = [];
      const repliesByParent = {};

      for (const row of rows) {
        const base = {
          id: row.id,
          parentId: row.parent_id,
          content: row.content,
          createdAt: row.created_at,
          author: row.username,
          authorAvatar: row.avatar_url,
          authorId: row.user_id,
          likes: likeCounts[row.id] ?? 0,
          likedByMe: likedByMe.has(row.id),
        };
        if (row.parent_id) {
          (repliesByParent[row.parent_id] ??= []).push(base);
        } else {
          posts.push(base);
        }
      }

      const withReplies = posts.map((p) => ({
        ...p,
        replies: repliesByParent[p.id] ?? [],
      }));

      return Response.json({ posts: withReplies, user });
    },

    POST: async (req) => {
      const user = requireUser(req);
      if (!user) return Response.redirect("/login?auth=required", 302);
      const body = await parseBody(req);
      const isFormData = body instanceof FormData;
      const content = isFormData
        ? String(body.get("content") ?? "").trim()
        : String(body.content ?? "").trim();
      const parentId = isFormData
        ? (body.get("parentId") ? Number(body.get("parentId")) : null)
        : body.parentId
        ? Number(body.parentId)
        : null;
      if (content && content.length <= 500) {
        createPost(parentId, user.id, content);
      }
      return Response.redirect("/", 302);
    },
  },

  "/api/posts/:id/like": {
    POST: (req) => {
      const user = requireUser(req);
      if (!user) return Response.redirect("/login?auth=required", 302);
      const postId = Number(req.params.id);
      toggleLike(user.id, postId);
      return Response.redirect("/", 302);
    },
  },

  "/api/posts/:id": {
    DELETE: (req) => {
      const user = requireUser(req);
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const postId = Number(req.params.id);
      const ownerId = getPostOwner(postId);
      
      if (!ownerId) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }
      
      if (ownerId !== user.id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      
      deletePost(postId);
      return Response.json({ success: true });
    },
  },

  "/api/profile": {
    GET: (req) => {
      const user = requireUser(req);
      if (!user) return Response.redirect("/login?auth=required", 302);
      const profile = getUserById(user.id);
      return Response.json({ user: profile });
    },

    POST: async (req) => {
      const user = requireUser(req);
      if (!user) return Response.redirect("/login?auth=required", 302);
      const body = await parseBody(req);
      const isFormData = body instanceof FormData;
      const newUsername = isFormData
        ? String(body.get("username") ?? "").trim()
        : String(body.username ?? "").trim();
      const newPassword = isFormData
        ? String(body.get("password") ?? "")
        : String(body.password ?? "");
      const currentPassword = isFormData
        ? String(body.get("currentPassword") ?? "")
        : String(body.currentPassword ?? "");

      if (newUsername && newUsername !== user.username) {
        const existing = getUserByUsername(newUsername);
        if (existing) {
          return Response.redirect("/profile?error=username_taken", 302);
        }
        updateUsername(user.id, newUsername);
      }

      if (newPassword) {
        if (!currentPassword) {
          return Response.redirect("/profile?error=current_password_required", 302);
        }
        const currentUser = getUserByUsername(user.username);
        const valid = await Bun.password.verify(
          currentPassword,
          currentUser.password_hash
        );
        if (!valid) {
          return Response.redirect("/profile?error=invalid_password", 302);
        }
        const hash = await Bun.password.hash(newPassword, {
          algorithm: "bcrypt",
          cost: 10,
        });
        updatePassword(user.id, hash);
      }

      if (isFormData) {
        const avatarUrl = await handleAvatarUpload(body);
        if (avatarUrl) {
          if (user.avatar_url) {
            const oldPath = join(projectRoot, user.avatar_url.replace("/public", ""));
            try {
              unlinkSync(oldPath);
            } catch (e) {
              // File doesn't exist, ignore
            }
          }
          updateAvatar(user.id, avatarUrl);
        }
      }

      return Response.redirect("/profile?success=updated", 302);
    },
  },
};
