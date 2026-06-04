const BASE = '/api/auth';

export const apiMe = () =>
  fetch(`${BASE}/me.php`, { credentials: 'include' }).then((r) => r.json());

export const apiLogin = (email, password) =>
  fetch(`${BASE}/login.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());

export const apiRegister = (username, email, password) =>
  fetch(`${BASE}/register.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  }).then((r) => r.json());

export const apiLogout = () =>
  fetch(`${BASE}/logout.php`, { credentials: 'include' }).then((r) => r.json());
