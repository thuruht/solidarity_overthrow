// _worker.js
export { ChatRoom } from "./chat.js";
import { handleLogin, handleAuthCallback, handleMe, handleLogout } from "./src/workers/authHandlers.js";
import { handleSaveGame, handleLoadGame, handleListSaves } from "./src/workers/gameHandlers.js";
import { handleLeaderboardGet, handleLeaderboardSubmit } from "./src/workers/leaderboardHandlers.js";
import { handleAdminUnmute, handleAdminChatStatus } from "./src/workers/adminHandlers.js";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block"
};

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // API Routes
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env, ctx);
      }

      // Weather Proxy Route
      if (url.pathname.startsWith("/weather")) {
        return await handleWeatherRequest(request, env, ctx);
      }

      // Serve static assets with SPA fallback
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
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  },
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
    "/api/admin/unmute": withAdminAuth(handleAdminUnmute),
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

  return jsonResponse({ error: "API route not found" }, 404);
}



function getSessionId(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}

const withAdminAuth = (handler) => {
  return async (request, env, ctx) => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const sessionData = await env.SESSIONS.get(sessionId);
    if (!sessionData) {
      return jsonResponse({ error: "Invalid session" }, 401);
    }
    const { isAdmin } = JSON.parse(sessionData);
    if (!isAdmin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }
    return await handler(request, env, ctx);
  };
};







async function handleWeatherRequest(request, env, ctx) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return jsonResponse({ error: "Missing lat or lon parameter" }, 400);
  }

  if (!env.OWM_API_KEY) {
    return jsonResponse({ error: "Weather service unavailable" }, 503);
  }

  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cache = caches.default;

  // Check cache first
  let response = await cache.match(cacheKey);
  if (response) return response;

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.OWM_API_KEY}`;

  try {
    const apiResponse = await fetch(apiUrl, { cf: { cacheTtl: 600 } });
    if (!apiResponse.ok) {
      return jsonResponse({ error: "Weather API error" }, apiResponse.status);
    }

    const data = await apiResponse.json();
    response = jsonResponse(data, 200, {
      "Cache-Control": "public, max-age=600",
    });

    // Use waitUntil for non-blocking cache write
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  } catch (error) {
    console.error("Weather API error:", error);
    return jsonResponse({ error: "Failed to fetch weather" }, 500);
  }
}

// Helper functions
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
