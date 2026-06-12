import { useState, useEffect, useRef } from 'react';
import { apiNotifList, apiNotifRead } from '../api/notifications';
import { useSocket } from '../hooks/useSocket';

export default function NotifBadge() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const socket = useSocket();
  const dropRef = useRef(null);

  const load = () =>
    apiNotifList().then((d) => { if (d.success) setNotifs(d.data); });

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => setNotifs((prev) => [n, ...prev]);
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter((n) => !n.is_read).length;

  const markAll = async () => {
    await apiNotifRead('all');
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAll();
  };

  const typeLabel = (t) => {
    if (t === 'friend_request') return 'sent you a friend request';
    if (t === 'message') return 'sent you a message';
    if (t === 'like') return 'liked your post';
    if (t === 'comment') return 'commented on your post';
    return t;
  };

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-indigo-400 hover:text-indigo-300">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No notifications</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 text-sm border-b border-gray-700 ${
                    !n.is_read ? 'bg-indigo-900/20' : ''
                  }`}
                >
                  <p className="text-gray-200">{typeLabel(n.type)}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
