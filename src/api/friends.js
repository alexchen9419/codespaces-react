const BASE = '/api/friends';

export const apiFriendsList = () =>
  fetch(`${BASE}/list.php`, { credentials: 'include' }).then((r) => r.json());

export const apiFriendsPending = () =>
  fetch(`${BASE}/pending.php`, { credentials: 'include' }).then((r) => r.json());

export const apiFriendRequest = (receiver_id) =>
  fetch(`${BASE}/request.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id }),
  }).then((r) => r.json());

export const apiFriendAccept = (friendship_id) =>
  fetch(`${BASE}/accept.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendship_id }),
  }).then((r) => r.json());

export const apiFriendRemove = (friendship_id) =>
  fetch(`${BASE}/remove.php`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendship_id }),
  }).then((r) => r.json());

export const apiUserSearch = (q) =>
  fetch(`/api/users/search.php?q=${encodeURIComponent(q)}`, {
    credentials: 'include',
  }).then((r) => r.json());
