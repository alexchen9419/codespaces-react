const BASE = '/api/messages';

export const apiInbox = () =>
  fetch(`${BASE}/inbox.php`, { credentials: 'include' }).then((r) => r.json());

export const apiThread = (userId) =>
  fetch(`${BASE}/thread.php?user_id=${userId}`, {
    credentials: 'include',
  }).then((r) => r.json());

export const apiSendMessage = (receiver_id, body) =>
  fetch(`${BASE}/send.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id, body }),
  }).then((r) => r.json());

export const apiSendVoice = (receiver_id, blob, duration) => {
  const form = new FormData();
  form.append('receiver_id', receiver_id);
  form.append('audio', blob, 'voice.webm');
  form.append('duration', duration);
  return fetch(`${BASE}/voice.php`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  }).then((r) => r.json());
};
