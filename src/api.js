const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Error de conexion con el backend');
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  state: (userId) => request(`/state/${userId}`),
  createGroup: (userId, group) => request('/groups', { method: 'POST', body: JSON.stringify({ userId, group }) }),
  joinGroup: (userId, groupId) => request(`/groups/${groupId}/join`, { method: 'POST', body: JSON.stringify({ userId }) }),
  leaveGroup: (userId, groupId) => request(`/groups/${groupId}/leave`, { method: 'DELETE', body: JSON.stringify({ userId }) }),
  sendMessage: (userId, groupId, content) => request('/messages', { method: 'POST', body: JSON.stringify({ userId, groupId, content }) }),
  saveProfile: (userId, profile) => request('/profile', { method: 'PUT', body: JSON.stringify({ userId, profile }) }),
  markNotificationsRead: (userId) => request('/notifications/read', { method: 'PUT', body: JSON.stringify({ userId }) }),
};