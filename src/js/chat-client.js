let socket;
let currentUsername = null;

export function initializeChat(username) {
  // BUGFIX: previously this function had no guard against being called more
  // than once. Both auth.js (checkUserSession -> initializeSocialFeatures)
  // and main_new.js (startGame) called this independently, so a logged-in
  // user on any repeat page load ended up with TWO live WebSocket
  // connections and TWO "keydown" listeners on the same chat input - every
  // Enter-to-send message got sent twice, and every broadcast the server
  // sent got rendered twice.
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING) &&
    currentUsername === username
  ) {
    return;
  }

  // If we're re-initializing as a different user, close the old socket first.
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }

  currentUsername = username;

  const chatInput = document.getElementById("chat-input");
  const messagesDiv = document.getElementById("chat-messages");

  if (!chatInput || !messagesDiv) return;

  // Establish WebSocket connection
  const wsUrl = new URL(window.location.href);
  wsUrl.protocol = "wss"; // Use wss for secure WebSockets
  wsUrl.pathname = "/api/chat";

  socket = new WebSocket(wsUrl.toString());

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    let el;
    if (data.joined) {
      el = createChatMessageElement(
        `<em>${data.joined} has joined the struggle.</em>`,
        "system"
      );
    } else if (data.left) {
      el = createChatMessageElement(
        `<em>${data.left} has left.</em>`,
        "system"
      );
    } else if (data.from) {
      el = createChatMessageElement(
        `<strong>${data.from}:</strong> ${data.message}`
      );
    } else {
      el = createChatMessageElement(
        `<em>System: ${JSON.stringify(data)}</em>`,
        "system"
      );
    }
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll
  });

  // Only attach the input listener once per element - re-initializing chat
  // (e.g. after a re-login) would otherwise stack a second listener on the
  // same <input>, since it's never removed.
  if (!chatInput.dataset.chatListenerAttached) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && chatInput.value && socket) {
        socket.send(chatInput.value);
        chatInput.value = "";
      }
    });
    chatInput.dataset.chatListenerAttached = "true";
  }
}

function createChatMessageElement(innerHTML, type = "user") {
  const el = document.createElement("div");
  el.className = `chat-message ${type}`;
  el.innerHTML = innerHTML;
  return el;
}
