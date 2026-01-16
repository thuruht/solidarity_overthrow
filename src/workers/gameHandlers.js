// src/workers/gameHandlers.js
import { getSessionId } from "./authHandlers.js";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleSaveGame(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  try {
    const { userId } = JSON.parse(session);
    const { slotId, gameState } = await request.json();

    if (!slotId || !gameState) {
      return jsonResponse({ error: "Missing slotId or gameState" }, 400);
    }

    // Validate slotId format
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(slotId)) {
      return jsonResponse({ error: "Invalid slotId format" }, 400);
    }

    await env.SAVED_GAMES.put(
      `${userId}:${slotId}`,
      JSON.stringify(gameState),
      { metadata: { timestamp: Date.now() } }
    );

    return jsonResponse({ success: true, message: "Game saved" });
  } catch (error) {
    console.error("Save game error:", error);
    return jsonResponse({ error: "Failed to save game" }, 500);
  }
}

async function handleLoadGame(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  try {
    const { userId } = JSON.parse(session);
    const url = new URL(request.url);
    const slotId = url.searchParams.get("slotId");

    if (!slotId) {
      return jsonResponse({ error: "Missing slotId parameter" }, 400);
    }

    const savedState = await env.SAVED_GAMES.get(`${userId}:${slotId}`);
    if (!savedState) {
      return jsonResponse({ error: "No saved game found" }, 404);
    }

    return new Response(savedState, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Load game error:", error);
    return jsonResponse({ error: "Failed to load game" }, 500);
  }
}

async function handleListSaves(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const session = await env.SESSIONS.get(sessionId);
  if (!session) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  try {
    const { userId } = JSON.parse(session);
    const list = await env.SAVED_GAMES.list({ prefix: `${userId}:` });
    const saves = list.keys.map((key) => ({
      slotId: key.name.split(":")[1],
      metadata: key.metadata,
    }));
    return jsonResponse(saves);
  } catch (error) {
    console.error("List saves error:", error);
    return jsonResponse({ error: "Failed to list saves" }, 500);
  }
}

export { handleSaveGame, handleLoadGame, handleListSaves };
