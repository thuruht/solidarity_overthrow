// _worker.js

export { ChatRoom } from "./chat.js";
import { handleLogin, handleAuthCallback, handleMe, handleLogout } from "./src/workers/authHandlers.js";
import { handleSaveGame, handleLoadGame, handleListSaves } from "./src/workers/gameHandlers.js";
import { handleLeaderboardGet, handleLeaderboardSubmit } from "./src/workers/leaderboardHandlers.js";
import { handleAdminUnmute, handleAdminChatStatus } from "./src/workers/adminHandlers.js";

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
