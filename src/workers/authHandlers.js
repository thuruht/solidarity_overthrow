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

async function handleDeviceCode(request, env) {
  if (!env.GITHUB_CLIENT_ID) {
    return jsonResponse({ error: "OAuth not configured" }, 503);
  }

  try {
    const response = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        scope: "read:user",
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return jsonResponse({ error: data.error || "Failed to get device code" }, 400);
    }

    return jsonResponse(data);
  } catch (error) {
    console.error("Device code error:", error);
    return jsonResponse({ error: "Failed to initiate device flow" }, 500);
  }
}

async function handleDevicePoll(request, env) {
  if (!env.GITHUB_CLIENT_ID) {
    return jsonResponse({ error: "OAuth not configured" }, 503);
  }

  let requestData;
  try {
    requestData = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { device_code } = requestData;
  if (!device_code) {
    return jsonResponse({ error: "Missing device_code" }, 400);
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      // Return 200 with error info so client can handle polling states (e.g. authorization_pending)
      return jsonResponse(tokenData, 200);
    }

    if (!tokenData.access_token) {
      return jsonResponse({ error: "No access token returned" }, 400);
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

    // We can't use 302 redirect here since it's an AJAX poll request.
    // Instead we send back the cookie header for the client to parse,
    // or better yet, Cloudflare Workers lets us set the Set-Cookie header on a 200 response
    const headers = new Headers();
    headers.append("Set-Cookie", `session_id=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=86400`);

    return jsonResponse({ success: true, user: sessionData }, 200, Object.fromEntries(headers.entries()));

  } catch (error) {
    console.error("Device poll error:", error);
    return jsonResponse({ error: "Polling failed" }, 500);
  }
}

export { handleLogin, handleAuthCallback, handleMe, handleLogout, getSessionId, handleDeviceCode, handleDevicePoll };
