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

function authorized(token, options = {}) {
  return {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  };
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  state: (token) => request('/state', authorized(token)),
  createGroup: (token, group) => request('/groups', authorized(token, {
    method: 'POST',
    body: JSON.stringify({ group }),
  })),
  joinGroup: (token, groupId, message = '') => request(`/groups/${groupId}/join`, authorized(token, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })),
  answerJoinRequest: (token, requestId, action) => request(`/join-requests/${requestId}/${action}`, authorized(token, {
    method: 'PUT',
  })),
  leaveGroup: (token, groupId) => request(`/groups/${groupId}/leave`, authorized(token, {
    method: 'DELETE',
  })),
  sendMessage: (token, groupId, content) => request('/messages', authorized(token, {
    method: 'POST',
    body: JSON.stringify({ groupId, content }),
  })),
  saveProfile: (token, profile) => request('/profile', authorized(token, {
    method: 'PUT',
    body: JSON.stringify({ profile }),
  })),
  markNotificationsRead: (token) => request('/notifications/read', authorized(token, {
    method: 'PUT',
  })),
};
