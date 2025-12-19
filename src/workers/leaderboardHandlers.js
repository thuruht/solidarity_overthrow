// src/workers/leaderboardHandlers.js
import { getSessionId } from "./authHandlers.js";

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

export { handleLeaderboardGet, handleLeaderboardSubmit };
