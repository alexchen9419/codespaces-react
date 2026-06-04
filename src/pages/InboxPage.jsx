import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiInbox } from '../api/messages';
import { useAuth } from '../hooks/useAuth';

function Avatar({ name, src }) {
  if (src) return <img src={src} alt={name} className="w-12 h-12 rounded-full object-cover" />;
  return (
    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiInbox()
      .then((d) => { if (d.success) setThreads(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const preview = (t) => {
    if (t.type === 'voice') return '🎤 Voice message';
    return t.body?.slice(0, 60) || '';
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold mb-4">Messages</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      ) : threads.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No conversations yet. Message a friend!</p>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <button
              key={t.other_id}
              onClick={() => navigate(`/chat/${t.other_id}`)}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center gap-3 text-left transition-colors"
            >
              <div className="relative">
                <Avatar src={t.avatar_path} name={t.username} />
                {t.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {t.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold truncate ${t.unread_count > 0 ? 'text-white' : 'text-gray-200'}`}>
                    {t.username}
                  </p>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">{timeAgo(t.sent_at)}</span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${
                  t.unread_count > 0 ? 'text-gray-200' : 'text-gray-400'
                }`}>
                  {t.sender_id === user?.id && <span className="text-gray-500">You: </span>}
                  {preview(t)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
