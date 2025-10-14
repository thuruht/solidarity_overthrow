let socket;

export function initializeChat(username) {
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

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && chatInput.value) {
      socket.send(chatInput.value);
      chatInput.value = "";
    }
  });
}

function createChatMessageElement(innerHTML, type = "user") {
  const el = document.createElement("div");
  el.className = `chat-message ${type}`;
  el.innerHTML = innerHTML;
  return el;
}
