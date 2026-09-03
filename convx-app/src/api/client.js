// Point this at your backend. In Codespaces, use the forwarded port URL
// (Ports tab -> right click port 4000 -> Port Visibility: Public -> copy the URL).
// Locally on the same machine, https://legendary-guacamole-v6xg9p64rg54cw5p9-4000.app.github.dev works fine.
export const API_BASE_URL = "https://legendary-guacamole-v6xg9p64rg54cw5p9-4000.app.github.dev";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error?.formErrors?.[0] || data?.error || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/users/me", { token }),
  listRooms: () => request("/rooms"),
  createRoom: (payload, token) => request("/rooms", { method: "POST", body: payload, token }),
  getRoom: (id) => request(`/rooms/${id}`),
  joinRoom: (id, token) => request(`/rooms/${id}/join`, { method: "POST", token }),
  listTracks: () => request("/tracks"),
  getQueue: (roomId) => request(`/tracks/queue/${roomId}`),
  addToQueue: (trackId, roomId, token) =>
    request(`/tracks/${trackId}/queue/${roomId}`, { method: "POST", token }),
  uploadTrack: async (uri, filename, mimeType, title, token) => {
    const formData = new FormData();
    formData.append("file", { uri, name: filename, type: mimeType });
    formData.append("title", title || filename);

    const res = await fetch(`${API_BASE_URL}/tracks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    return data;
  },
};
