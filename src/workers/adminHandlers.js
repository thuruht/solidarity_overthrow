// src/workers/adminHandlers.js
// Note: handleAdminUnmute and handleAdminChatStatus directly interact with Durable Objects
// The CHAT_ROOM binding is available in the env object in the worker.

function handleAdminUnmute(request, env) {
  const id = env.CHAT_ROOM.idFromName("global");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request); // Forward the request to the Durable Object
}

function handleAdminChatStatus(request, env) {
  const id = env.CHAT_ROOM.idFromName("global");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request); // Forward the request to the Durable Object
}

export { handleAdminUnmute, handleAdminChatStatus };
