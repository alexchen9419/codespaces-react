const BASE = '/api/groups';

export const apiGroupList = () =>
  fetch(`${BASE}/list.php`, { credentials: 'include' }).then((r) => r.json());

export const apiGroupCreate = (name, memberIds) =>
  fetch(`${BASE}/create.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, member_ids: memberIds }),
  }).then((r) => r.json());

export const apiGroupThread = (groupId) =>
  fetch(`${BASE}/thread.php?group_id=${groupId}`, { credentials: 'include' }).then((r) => r.json());

export const apiGroupSend = (groupId, body) =>
  fetch(`${BASE}/send.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_id: groupId, body }),
  }).then((r) => r.json());
