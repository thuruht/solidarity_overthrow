// src/workers/authHandlers.js

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
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`,
    },
  });
}

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
    // Exchange code for token
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
      return jsonResponse({ error: "Failed to get access token" }, 400);
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "SolidarityOverthrow",
      },
    });

    if (!userResponse.ok) {
      return jsonResponse({ error: "Failed to get user info" }, 400);
    }

    const userData = await userResponse.json();

    // Create session
    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId: userData.id,
      username: userData.login,
      avatar: userData.avatar_url,
      isAdmin: env.ADMIN_USER_ID && `${userData.id}` === env.ADMIN_USER_ID,
    };

    await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
      expirationTtl: 86400,
    });

    const headers = new Headers({
      Location: "/",
      "Set-Cookie": `session_id=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=86400`,
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

export { handleLogin, handleAuthCallback, handleMe, handleLogout, getSessionId };
