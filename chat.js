// chat.js

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env; // Store env to access SESSIONS KV
    this.sessions = [];
    this.muted = new Set();
    // Load muted users from durable storage on startup
    this.state.blockConcurrencyWhile(async () => {
      this.muted = (await this.state.storage.get("muted")) || new Set();
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Handle HTTP GET request for admin status
    if (request.method === "GET" && url.pathname === "/api/admin/chat-status") {
      const status = {
        sessions: this.sessions.map((s) => ({
          username: s.username,
          userId: s.userId,
          isAdmin: s.isAdmin,
        })),
        muted: Array.from(this.muted),
      };
      return new Response(JSON.stringify(status), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle HTTP POST request for unmuting a user
    if (request.method === "POST" && url.pathname === "/api/admin/unmute") {
      const { userIdToUnmute } = await request.json();
      if (userIdToUnmute) {
        this.unmuteUser(userIdToUnmute);
        return new Response(JSON.stringify({ success: true }));
      }
      return new Response("Missing userIdToUnmute", { status: 400 });
    }

    // This is now a secure endpoint. We must validate the user's session.
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
      webSocket: client,
    });
  }

  async handleSession(socket, username, userId, isAdmin) {
    socket.accept();
    const session = { socket, username, userId, isAdmin };
    this.sessions.push(session);

    // Broadcast a join message
    this.broadcast({ joined: username });

    socket.addEventListener("message", async (msg) => {
      if (this.muted.has(userId)) {
        socket.send(JSON.stringify({ error: "You are muted." }));
        return;
      }

      try {
        // Check for admin commands
        if (isAdmin && msg.data.startsWith("/")) {
          this.handleAdminCommand(msg.data);
        } else {
          this.broadcast({ from: username, message: msg.data, isAdmin });
        }
      } catch (err) {
        socket.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    const closeOrErrorHandler = () => {
      this.sessions = this.sessions.filter((s) => s.socket !== socket);
      this.broadcast({ left: username });
    };
    socket.addEventListener("close", closeOrErrorHandler);
    socket.addEventListener("error", closeOrErrorHandler);
  }

  handleAdminCommand(message) {
    const parts = message.split(" ");
    const command = parts[0];
    const targetUsername = parts[1];

    if (!targetUsername) return;
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
    this.state.storage.put("muted", this.muted); // Persist muted list
    this.broadcast({ system: `${username} has been muted.` });
  }

  unmuteUser(userId, username) {
    this.muted.delete(userId);
    this.state.storage.put("muted", this.muted); // Persist muted list
    this.broadcast({ system: `${username || "A user"} has been unmuted.` });
  }

  broadcast(message) {
    const msgStr = JSON.stringify(message);
    this.sessions.forEach((session) => {
      session.socket.send(msgStr);
    });
  }
}
