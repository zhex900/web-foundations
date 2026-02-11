import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const projectRoot = dirname(import.meta.dir);
const dbPath = process.env.DB_PATH ?? join(projectRoot, "data", "demo.sqlite");

mkdirSync(dirname(dbPath), { recursive: true });
export const db = new Database(dbPath, { create: true });

db.run("PRAGMA foreign_keys = ON");
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT
  )
`);

// Add avatar_url column to existing users table if it doesn't exist
try {
  db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT");
} catch (e) {
  // Column already exists, ignore
}
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  )
`);

const demoPassword = process.env.DEMO_PASSWORD ?? "password";
const demoUser = db.query("SELECT id FROM users WHERE username = ?").get("demo");
if (!demoUser) {
  const hash = await Bun.password.hash(demoPassword, {
    algorithm: "bcrypt",
    cost: 10,
  });
  db.query("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
    "demo",
    hash
  );
}

export function getUserFromSession(token) {
  if (!token) return null;
  return db
    .query(
      "SELECT users.id, users.username, users.avatar_url FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?"
    )
    .get(token);
}

export function createSession(userId, token) {
  db.query("INSERT INTO sessions (user_id, token) VALUES (?, ?)").run(
    userId,
    token
  );
}

export function deleteSession(token) {
  if (token) {
    db.query("DELETE FROM sessions WHERE token = ?").run(token);
  }
}

export function getUserByUsername(username) {
  return db
    .query("SELECT id, username, password_hash, avatar_url FROM users WHERE username = ?")
    .get(username);
}

export function getAllPosts() {
  return db
    .query(
      "SELECT posts.id, posts.parent_id, posts.content, posts.created_at, posts.user_id, users.username, users.avatar_url FROM posts JOIN users ON users.id = posts.user_id ORDER BY posts.created_at DESC"
    )
    .all();
}

export function getLikeCounts() {
  const likeRows = db
    .query("SELECT post_id, COUNT(*) AS count FROM likes GROUP BY post_id")
    .all();
  return Object.fromEntries(likeRows.map((r) => [r.post_id, r.count]));
}

export function getUserLikes(userId) {
  if (!userId) return new Set();
  return new Set(
    db
      .query("SELECT post_id FROM likes WHERE user_id = ?")
      .all(userId)
      .map((r) => r.post_id)
  );
}

export function createPost(parentId, userId, content) {
  db.query(
    "INSERT INTO posts (parent_id, user_id, content) VALUES (?, ?, ?)"
  ).run(parentId, userId, content);
}

export function toggleLike(userId, postId) {
  const existing = db
    .query("SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?")
    .get(userId, postId);
  if (existing) {
    db.query("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(
      userId,
      postId
    );
  } else {
    db.query("INSERT INTO likes (user_id, post_id) VALUES (?, ?)").run(
      userId,
      postId
    );
  }
}

export function updateUsername(userId, newUsername) {
  db.query("UPDATE users SET username = ? WHERE id = ?").run(
    newUsername,
    userId
  );
}

export function updatePassword(userId, passwordHash) {
  db.query("UPDATE users SET password_hash = ? WHERE id = ?").run(
    passwordHash,
    userId
  );
}

export function getUserById(userId) {
  return db.query("SELECT id, username, avatar_url FROM users WHERE id = ?").get(userId);
}

export function updateAvatar(userId, avatarUrl) {
  db.query("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, userId);
}

export function createUser(username, passwordHash, avatarUrl = null) {
  db.query("INSERT INTO users (username, password_hash, avatar_url) VALUES (?, ?, ?)").run(
    username,
    passwordHash,
    avatarUrl
  );
  return db.query("SELECT id, username, avatar_url FROM users WHERE username = ?").get(username);
}

export function getPostOwner(postId) {
  const post = db.query("SELECT user_id FROM posts WHERE id = ?").get(postId);
  return post ? post.user_id : null;
}

export function deletePost(postId) {
  db.query("DELETE FROM posts WHERE id = ?").run(postId);
}
