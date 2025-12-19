// src/workers/gameHandlers.js
import { getSessionId } from "./authHandlers.js";

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

export { handleSaveGame, handleLoadGame, handleListSaves };
