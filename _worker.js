// _worker.js

export { ChatRoom } from "./chat.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    // Weather Proxy Route
    if (url.pathname.startsWith("/weather")) {
      return handleWeatherRequest(request, env);
    }

    // Serve static assets
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.startsWith("/api/")) {
      const accept = request.headers.get("Accept");
      if (accept && accept.includes("text/html")) {
        response = await env.ASSETS.fetch(
          new Request(new URL("/index.html", request.url), request)
        );
      }
    }

    // Add security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  switch (url.pathname) {
    case "/api/login":
      return handleLogin(request, env);
    case "/api/auth/callback":
      return handleAuthCallback(request, env);
    case "/api/me":
      return handleMe(request, env);
    case "/api/logout":
      return handleLogout(request, env); // Now async
    case "/api/save":
      return handleSaveGame(request, env);
    case "/api/load":
      return handleLoadGame(request, env);
    case "/api/saves":
      return handleListSaves(request, env);
    case "/api/chat":
      const id = env.CHAT_ROOM.idFromName("global");
      const room = env.CHAT_ROOM.get(id);
      return room.fetch(request);
    case "/api/leaderboard":
      return handleLeaderboardGet(request, env);
    case "/api/leaderboard/submit":
      return handleLeaderboardSubmit(request, env);
    case "/api/admin/chat-status":
      return withAdminAuth(handleAdminChatStatus)(request, env);
    case "/api/admin/unmute":
      return withAdminAuth(handleAdminUnmute)(request, env);
    default:
      return new Response("API route not found", { status: 404 });
  }
}

function handleLogin(request, env) {
  const state = crypto.randomUUID();
  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set("scope", "read:user"); // Request user profile data
  githubUrl.searchParams.set("state", state);

  const headers = new Headers({
    Location: githubUrl.toString(),
    "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`,
  });

  return new Response(null, { status: 302, headers });
}

async function handleAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const stateCookie = cookies.find((c) => c.startsWith("oauth_state="));
  const storedState = stateCookie ? stateCookie.split("=")[1] : null;

  if (!state || !storedState || state !== storedState) {
    return new Response("Invalid state parameter", { status: 400 });
  }

  // Exchange the code for an access token
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );
  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response("Failed to get access token", { status: 400 });
  }

  // Use the access token to get user info
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${tokenData.access_token}`,
      "User-Agent": "SolidarityOverthrow-Worker",
    },
  });
  const userData = await userResponse.json();

  // Create a session
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId: userData.id,
    username: userData.login,
    avatar: userData.avatar_url,
    isAdmin: env.ADMIN_USER_ID && `${userData.id}` === env.ADMIN_USER_ID, // Check if the user is an admin
  };

  await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
    expirationTtl: 86400,
  }); // 24-hour session

  const headers = new Headers({
    Location: "/", // Redirect back to the homepage
    "Set-Cookie": `session_id=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Lax`,
  });
  headers.append("Set-Cookie", "oauth_state=; HttpOnly; Secure; Path=/; Max-Age=0"); // Clear state cookie

  return new Response(null, { status: 302, headers });
}

async function handleMe(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ user: JSON.parse(session) }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleLogout(request, env) {
  const sessionId = getSessionId(request);
  if (sessionId) {
    await env.SESSIONS.delete(sessionId);
  }

  const headers = new Headers({
    Location: "/", // Redirect back to the homepage
    "Set-Cookie": `session_id=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0`, // Expire the cookie
  });
  return new Response(null, { status: 302, headers });
}

function getSessionId(request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith("session_id="));
  return sessionCookie ? sessionCookie.split("=")[1] : null;
}

const withAdminAuth = (handler) => {
  return async (request, env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return new Response("Unauthorized", { status: 401 });
    }
    const sessionData = await env.SESSIONS.get(sessionId);
    if (!sessionData) {
      return new Response("Invalid session", { status: 401 });
    }
    const { isAdmin } = JSON.parse(sessionData);
    if (!isAdmin) {
      return new Response("Forbidden", { status: 403 });
    }
    // If all checks pass, call the original handler
    return handler(request, env);
  };
};

function handleAdminUnmute(request, env) {
  const id = env.CHAT_ROOM.idFromName("global");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request); // Forward the request to the Durable Object
}

function handleAdminChatStatus(request, env) {
  const id = env.CHAT_ROOM.idFromName("global");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request); // Forward the request to the Durable Object
}

async function handleLeaderboardGet(request, env) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT username, score, timestamp FROM scores ORDER BY score DESC, timestamp DESC LIMIT 10"
    ).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Leaderboard GET error:", e);
    return new Response("Failed to fetch leaderboard", { status: 500 });
  }
}

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
    )
      .bind(username, score, new Date().toISOString())
      .run();

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Failed to submit score", { status: 500 });
    }
  } catch (e) {
    console.error("Leaderboard SUBMIT error:", e);
    return new Response("Failed to submit score", { status: 500 });
  }
}

async function handleSaveGame(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response("Unauthorized: Please log in to save.", {
      status: 401,
    });
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return new Response("Invalid session.", { status: 401 });
  }
  const { userId } = JSON.parse(session);

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { slotId, gameState } = await request.json();
    if (!slotId || !gameState) {
      return new Response("Missing slotId or gameState", { status: 400 });
    }

    // Save the game state to the KV namespace.
    // The key is `user_id:save_slot`, e.g., "user123:slot1"
    await env.SAVED_GAMES.put(
      `${userId}:${slotId}`,
      JSON.stringify(gameState),
      { metadata: { timestamp: Date.now() } }
    );

    return new Response(
      JSON.stringify({ success: true, message: "Game saved!" }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Save game error:", error);
    return new Response("Failed to save game", { status: 500 });
  }
}

async function handleLoadGame(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response("Unauthorized: Please log in to load.", {
      status: 401,
    });
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return new Response("Invalid session.", { status: 401 });
  }
  const { userId } = JSON.parse(session);

  try {
    const url = new URL(request.url);
    const slotId = url.searchParams.get("slotId");
    if (!slotId) {
      return new Response("Missing slotId parameter", { status: 400 });
    }
    const savedState = await env.SAVED_GAMES.get(`${userId}:${slotId}`);
    if (!savedState) {
      return new Response(JSON.stringify({ error: "No saved game found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(savedState, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Load game error:", error);
    return new Response("Failed to load game", { status: 500 });
  }
}

async function handleListSaves(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return new Response("Invalid session", { status: 401 });
  }
  const { userId } = JSON.parse(session);

  try {
    const list = await env.SAVED_GAMES.list({ prefix: `${userId}:` });
    const saves = list.keys.map((key) => ({
      slotId: key.name.split(":")[1],
      metadata: key.metadata, // Contains timestamp
    }));
    return new Response(JSON.stringify(saves), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("List saves error:", error);
    return new Response("Failed to list saves", { status: 500 });
  }
}

async function handleWeatherRequest(request, env) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return new Response("Missing lat or lon parameter", { status: 400 });
  }

  const apiKey = env.OWM_API_KEY;
  if (!apiKey) {
    return new Response("Missing OWM_API_KEY secret", { status: 500 });
  }

  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString(), request);
  const cache = caches.default;

  // Check for cached response
  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const apiResponse = await fetch(apiUrl);
    const data = await apiResponse.json();

    // Create a new response with Cache-Control headers
    response = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600", // Cache for 10 minutes
      },
    });

    // Store in cache (wait for it to complete to ensure it's stored)
    await cache.put(cacheKey, response.clone());

    return response;
  } catch (error) {
    return new Response("Error fetching weather data", { status: 500 });
  }
}
