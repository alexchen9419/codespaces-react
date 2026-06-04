const BASE = '/api/notifications';

export const apiNotifList = () =>
  fetch(`${BASE}/list.php`, { credentials: 'include' }).then((r) => r.json());

export const apiNotifRead = (id) =>
  fetch(`${BASE}/read.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(id === 'all' ? { all: true } : { id }),
  }).then((r) => r.json());
