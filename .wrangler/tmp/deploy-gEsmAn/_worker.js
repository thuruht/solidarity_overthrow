var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// chat.js
var ChatRoom = class {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.muted = /* @__PURE__ */ new Set();
    this.state.blockConcurrencyWhile(async () => {
      this.muted = await this.state.storage.get("muted") || /* @__PURE__ */ new Set();
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/admin/chat-status") {
      const status = {
        sessions: this.sessions.map((s) => ({
          username: s.username,
          userId: s.userId,
          isAdmin: s.isAdmin
        })),
        muted: Array.from(this.muted)
      };
      return new Response(JSON.stringify(status), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "POST" && url.pathname === "/api/admin/unmute") {
      const { userIdToUnmute } = await request.json();
      if (userIdToUnmute) {
        this.unmuteUser(userIdToUnmute);
        return new Response(JSON.stringify({ success: true }));
      }
      return new Response("Missing userIdToUnmute", { status: 400 });
    }
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader || !cookieHeader.includes("session_id=")) {
      return new Response("Missing session cookie", { status: 401 });
    }
    const match = cookieHeader.match(/session_id=([^;]+)/);
    const sessionId = match ? match[1] : null;
    if (!sessionId) {
      return new Response("Invalid session cookie", { status: 401 });
    }
    const sessionData = await this.env.SESSIONS.get(sessionId);
    if (!sessionData) {
      return new Response("Invalid session", { status: 401 });
    }
    const { username, userId, isAdmin } = JSON.parse(sessionData);
    if (!username) {
      return new Response("User not found in session", { status: 401 });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket connection", { status: 400 });
    }
    const [client, server] = Object.values(new WebSocketPair());
    await this.handleSession(server, username, userId, isAdmin);
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  async handleSession(socket, username, userId, isAdmin) {
    socket.accept();
    const session = { socket, username, userId, isAdmin };
    this.sessions.push(session);
    this.broadcast({ joined: username });
    socket.addEventListener("message", async (msg) => {
      if (this.muted.has(userId)) {
        socket.send(JSON.stringify({ error: "You are muted." }));
        return;
      }
      try {
        if (isAdmin && msg.data.startsWith("/")) {
          this.handleAdminCommand(msg.data);
        } else {
          this.broadcast({ from: username, message: msg.data, isAdmin });
        }
      } catch (err) {
        socket.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });
    const closeOrErrorHandler = /* @__PURE__ */ __name(() => {
      this.sessions = this.sessions.filter((s) => s.socket !== socket);
      this.broadcast({ left: username });
    }, "closeOrErrorHandler");
    socket.addEventListener("close", closeOrErrorHandler);
    socket.addEventListener("error", closeOrErrorHandler);
  }
  handleAdminCommand(message) {
    const parts = message.split(" ");
    const command = parts[0];
    const targetUsername = parts[1];
    if (!targetUsername)
      return;
    const targetSession = this.sessions.find(
      (s) => s.username === targetUsername
    );
    if (!targetSession) {
      this.broadcast({ system: `User '${targetUsername}' not found.` });
      return;
    }
    if (command === "/mute") {
      this.muteUser(targetSession.userId, targetUsername);
    } else if (command === "/unmute") {
      this.unmuteUser(targetSession.userId, targetUsername);
    }
  }
  muteUser(userId, username) {
    this.muted.add(userId);
    this.state.storage.put("muted", this.muted);
    this.broadcast({ system: `${username} has been muted.` });
  }
  unmuteUser(userId, username) {
    this.muted.delete(userId);
    this.state.storage.put("muted", this.muted);
    this.broadcast({ system: `${username || "A user"} has been unmuted.` });
  }
  broadcast(message) {
    const msgStr = JSON.stringify(message);
    this.sessions.forEach((session) => {
      session.socket.send(msgStr);
    });
  }
};
__name(ChatRoom, "ChatRoom");

// src/workers/authHandlers.js
function getSessionId(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie)
    return null;
  const match = cookie.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}
__name(getSessionId, "getSessionId");
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
__name(jsonResponse, "jsonResponse");
async function handleLogin(request, env) {
  if (!env.GITHUB_CLIENT_ID) {
    return jsonResponse({ error: "OAuth not configured" }, 503);
  }
  const state = crypto.randomUUID();
  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set("scope", "read:user");
  githubUrl.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: githubUrl.toString(),
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`
    }
  });
}
__name(handleLogin, "handleLogin");
async function handleAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const stateMatch = cookie.match(/oauth_state=([^;]+)/);
  const storedState = stateMatch ? stateMatch[1] : null;
  if (!state || !storedState || state !== storedState) {
    return jsonResponse({ error: "Invalid state parameter" }, 400);
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return jsonResponse({ error: "OAuth not configured" }, 503);
  }
  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      }
    );
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return jsonResponse({ error: "Failed to get access token" }, 400);
    }
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "SolidarityOverthrow"
      }
    });
    if (!userResponse.ok) {
      return jsonResponse({ error: "Failed to get user info" }, 400);
    }
    const userData = await userResponse.json();
    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId: userData.id,
      username: userData.login,
      avatar: userData.avatar_url,
      isAdmin: env.ADMIN_USER_ID && `${userData.id}` === env.ADMIN_USER_ID
    };
    await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
      expirationTtl: 86400
    });
    const headers = new Headers({
      Location: "/",
      "Set-Cookie": `session_id=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=86400`
    });
    headers.append(
      "Set-Cookie",
      "oauth_state=; HttpOnly; Secure; Path=/; Max-Age=0"
    );
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("Auth callback error:", error);
    return jsonResponse({ error: "Authentication failed" }, 500);
  }
}
__name(handleAuthCallback, "handleAuthCallback");
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
    return jsonResponse({ user: JSON.parse(session) });
  } catch (error) {
    console.error("Session parse error:", error);
    return jsonResponse({ user: null });
  }
}
__name(handleMe, "handleMe");
async function handleLogout(request, env) {
  const sessionId = getSessionId(request);
  if (sessionId) {
    await env.SESSIONS.delete(sessionId);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": "session_id=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0"
    }
  });
}
__name(handleLogout, "handleLogout");

// src/workers/gameHandlers.js
function jsonResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonResponse2, "jsonResponse");
async function handleSaveGame(request, env) {
  if (request.method !== "POST") {
    return jsonResponse2({ error: "Method not allowed" }, 405);
  }
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse2({ error: "Unauthorized" }, 401);
  }
  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse2({ error: "Invalid session" }, 401);
  }
  try {
    const { userId } = JSON.parse(session);
    const { slotId, gameState } = await request.json();
    if (!slotId || !gameState) {
      return jsonResponse2({ error: "Missing slotId or gameState" }, 400);
    }
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(slotId)) {
      return jsonResponse2({ error: "Invalid slotId format" }, 400);
    }
    await env.SAVED_GAMES.put(
      `${userId}:${slotId}`,
      JSON.stringify(gameState),
      { metadata: { timestamp: Date.now() } }
    );
    return jsonResponse2({ success: true, message: "Game saved" });
  } catch (error) {
    console.error("Save game error:", error);
    return jsonResponse2({ error: "Failed to save game" }, 500);
  }
}
__name(handleSaveGame, "handleSaveGame");
async function handleLoadGame(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse2({ error: "Unauthorized" }, 401);
  }
  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse2({ error: "Invalid session" }, 401);
  }
  try {
    const { userId } = JSON.parse(session);
    const url = new URL(request.url);
    const slotId = url.searchParams.get("slotId");
    if (!slotId) {
      return jsonResponse2({ error: "Missing slotId parameter" }, 400);
    }
    const savedState = await env.SAVED_GAMES.get(`${userId}:${slotId}`);
    if (!savedState) {
      return jsonResponse2({ error: "No saved game found" }, 404);
    }
    return new Response(savedState, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Load game error:", error);
    return jsonResponse2({ error: "Failed to load game" }, 500);
  }
}
__name(handleLoadGame, "handleLoadGame");
async function handleListSaves(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse2({ error: "Unauthorized" }, 401);
  }
  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse2({ error: "Invalid session" }, 401);
  }
  try {
    const { userId } = JSON.parse(session);
    const list = await env.SAVED_GAMES.list({ prefix: `${userId}:` });
    const saves = list.keys.map((key) => ({
      slotId: key.name.split(":")[1],
      metadata: key.metadata
    }));
    return jsonResponse2(saves);
  } catch (error) {
    console.error("List saves error:", error);
    return jsonResponse2({ error: "Failed to list saves" }, 500);
  }
}
__name(handleListSaves, "handleListSaves");

// src/workers/leaderboardHandlers.js
async function handleLeaderboardGet(request, env) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT username, score, timestamp FROM scores ORDER BY score DESC, timestamp DESC LIMIT 10"
    ).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Leaderboard GET error:", e);
    return new Response("Failed to fetch leaderboard", { status: 500 });
  }
}
__name(handleLeaderboardGet, "handleLeaderboardGet");
async function handleLeaderboardSubmit(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const sessionData = await env.SESSIONS.get(sessionId);
  if (!sessionData) {
    return new Response("Invalid session", { status: 401 });
  }
  const { username } = JSON.parse(sessionData);
  try {
    const { score } = await request.json();
    if (typeof score !== "number") {
      return new Response("Invalid score submission", { status: 400 });
    }
    const { success } = await env.DB.prepare(
      "INSERT INTO scores (username, score, timestamp) VALUES (?, ?, ?)"
    ).bind(username, score, (/* @__PURE__ */ new Date()).toISOString()).run();
    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Failed to submit score", { status: 500 });
    }
  } catch (e) {
    console.error("Leaderboard SUBMIT error:", e);
    return new Response("Failed to submit score", { status: 500 });
  }
}
__name(handleLeaderboardSubmit, "handleLeaderboardSubmit");

// src/workers/adminHandlers.js
function handleAdminUnmute(request, env) {
  const id = env.CHAT_ROOM.idFromName("global");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request);
}
__name(handleAdminUnmute, "handleAdminUnmute");
function handleAdminChatStatus(request, env) {
  const id = env.CHAT_ROOM.idFromName("global");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request);
}
__name(handleAdminChatStatus, "handleAdminChatStatus");

// _worker.js
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block"
};
var worker_default = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env, ctx);
      }
      if (url.pathname.startsWith("/weather")) {
        return await handleWeatherRequest(request, env, ctx);
      }
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404 && !url.pathname.startsWith("/api/")) {
        const accept = request.headers.get("Accept") || "";
        if (accept.includes("text/html")) {
          response = await env.ASSETS.fetch(
            new Request(new URL("/index.html", request.url), request)
          );
        }
      }
      return addSecurityHeaders(response);
    } catch (error) {
      console.error("Worker error:", error);
      return jsonResponse3({ error: "Internal server error" }, 500);
    }
  }
};
async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const routes = {
    "/api/login": handleLogin,
    "/api/auth/callback": handleAuthCallback,
    "/api/me": handleMe,
    "/api/logout": handleLogout,
    "/api/save": handleSaveGame,
    "/api/load": handleLoadGame,
    "/api/saves": handleListSaves,
    "/api/leaderboard": handleLeaderboardGet,
    "/api/leaderboard/submit": handleLeaderboardSubmit,
    "/api/admin/chat-status": withAdminAuth(handleAdminChatStatus),
    "/api/admin/unmute": withAdminAuth(handleAdminUnmute)
  };
  if (url.pathname === "/api/chat") {
    const id = env.CHAT_ROOM.idFromName("global");
    const room = env.CHAT_ROOM.get(id);
    return await room.fetch(request);
  }
  const handler = routes[url.pathname];
  if (handler) {
    return await handler(request, env, ctx);
  }
  return jsonResponse3({ error: "API route not found" }, 404);
}
__name(handleApiRequest, "handleApiRequest");
function getSessionId2(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie)
    return null;
  const match = cookie.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}
__name(getSessionId2, "getSessionId");
var withAdminAuth = /* @__PURE__ */ __name((handler) => {
  return async (request, env, ctx) => {
    const sessionId = getSessionId2(request);
    if (!sessionId) {
      return jsonResponse3({ error: "Unauthorized" }, 401);
    }
    const sessionData = await env.SESSIONS.get(sessionId);
    if (!sessionData) {
      return jsonResponse3({ error: "Invalid session" }, 401);
    }
    const { isAdmin } = JSON.parse(sessionData);
    if (!isAdmin) {
      return jsonResponse3({ error: "Forbidden" }, 403);
    }
    return await handler(request, env, ctx);
  };
}, "withAdminAuth");
async function handleWeatherRequest(request, env, ctx) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  if (!lat || !lon) {
    return jsonResponse3({ error: "Missing lat or lon parameter" }, 400);
  }
  if (!env.OWM_API_KEY) {
    return jsonResponse3({ error: "Weather service unavailable" }, 503);
  }
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cache = caches.default;
  let response = await cache.match(cacheKey);
  if (response)
    return response;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.OWM_API_KEY}`;
  try {
    const apiResponse = await fetch(apiUrl, { cf: { cacheTtl: 600 } });
    if (!apiResponse.ok) {
      return jsonResponse3({ error: "Weather API error" }, apiResponse.status);
    }
    const data = await apiResponse.json();
    response = jsonResponse3(data, 200, {
      "Cache-Control": "public, max-age=600"
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error("Weather API error:", error);
    return jsonResponse3({ error: "Failed to fetch weather" }, 500);
  }
}
__name(handleWeatherRequest, "handleWeatherRequest");
function jsonResponse3(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
__name(jsonResponse3, "jsonResponse");
function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(addSecurityHeaders, "addSecurityHeaders");
export {
  ChatRoom,
  worker_default as default
};
//# sourceMappingURL=_worker.js.map
