const BASE = '/api/feed';

export const apiFeedList = () =>
  fetch(`${BASE}/list.php`, { credentials: 'include' }).then((r) => r.json());

export const apiFeedPost = (content) =>
  fetch(`${BASE}/post.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((r) => r.json());

export const apiFeedLike = (post_id) =>
  fetch(`${BASE}/like.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id }),
  }).then((r) => r.json());

export const apiFeedComment = (post_id, body) =>
  fetch(`${BASE}/comment.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id, body }),
  }).then((r) => r.json());
