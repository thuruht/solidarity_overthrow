// src/workers/authHandlers.js

function getSessionId(request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith("session_id="));
  return sessionCookie ? sessionCookie.split("=")[1] : null;
}

async function handleLogin(request, env) {
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

export { handleLogin, handleAuthCallback, handleMe, handleLogout, getSessionId };
