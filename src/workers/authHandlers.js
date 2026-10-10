// src/workers/authHandlers.js
//
// Rewritten to drop the GitHub OAuth dependency in favor of local
// username/password accounts stored in D1 (see migrations/0002_users.sql).
// Sessions still live in the SESSIONS KV namespace exactly as before -
// only how a session gets created has changed.

const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_SECONDS = 86400; // 24 hours

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const MIN_PASSWORD_LENGTH = 8;

function getSessionId(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return bytesToHex(bits);
}

async function createSession(env, user) {
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId: user.id,
    username: user.username,
    isAdmin: !!user.is_admin,
  };
  await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return sessionId;
}

function sessionCookieHeaders(sessionId) {
  return {
    "Set-Cookie": `session_id=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`,
  };
}

async function handleRegister(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { username, password } = body || {};

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return jsonResponse(
      {
        error:
          "Username must be 3-24 characters: letters, numbers, and underscores only.",
      },
      400
    );
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      400
    );
  }

  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE username = ?"
    )
      .bind(username)
      .first();

    if (existing) {
      return jsonResponse({ error: "That username is already taken." }, 409);
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const createdAt = new Date().toISOString();

    const result = await env.DB.prepare(
      "INSERT INTO users (username, password_hash, salt, is_admin, created_at) VALUES (?, ?, ?, 0, ?)"
    )
      .bind(username, passwordHash, salt, createdAt)
      .run();

    const userId = result.meta.last_row_id;
    const sessionId = await createSession(env, {
      id: userId,
      username,
      is_admin: 0,
    });

    return jsonResponse(
      { user: { username, isAdmin: false } },
      200,
      sessionCookieHeaders(sessionId)
    );
  } catch (error) {
    console.error("Register error:", error);
    return jsonResponse({ error: "Registration failed." }, 500);
  }
}

async function handleLogin(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { username, password } = body || {};

  if (typeof username !== "string" || typeof password !== "string") {
    return jsonResponse({ error: "Username and password are required." }, 400);
  }

  try {
    const user = await env.DB.prepare(
      "SELECT id, username, password_hash, salt, is_admin FROM users WHERE username = ?"
    )
      .bind(username)
      .first();

    if (!user) {
      return jsonResponse({ error: "Invalid username or password." }, 401);
    }

    const attemptedHash = await hashPassword(password, user.salt);
    if (attemptedHash !== user.password_hash) {
      return jsonResponse({ error: "Invalid username or password." }, 401);
    }

    const sessionId = await createSession(env, user);

    return jsonResponse(
      { user: { username: user.username, isAdmin: !!user.is_admin } },
      200,
      sessionCookieHeaders(sessionId)
    );
  } catch (error) {
    console.error("Login error:", error);
    return jsonResponse({ error: "Login failed." }, 500);
  }
}

async function handleMe(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse({ user: null });
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse({ user: null });
  }

  try {
    const { username, isAdmin } = JSON.parse(session);
    return jsonResponse({ user: { username, isAdmin: !!isAdmin } });
  } catch (error) {
    console.error("Session parse error:", error);
    return jsonResponse({ user: null });
  }
}

async function handleLogout(request, env) {
  const sessionId = getSessionId(request);
  if (sessionId) {
    await env.SESSIONS.delete(sessionId);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie":
        "session_id=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0",
    },
  });
}

export {
  handleRegister,
  handleLogin,
  handleMe,
  handleLogout,
  getSessionId,
};
