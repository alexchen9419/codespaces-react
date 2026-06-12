import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiInbox } from '../api/messages';
import { apiGroupList, apiGroupCreate } from '../api/groups';
import { useAuth } from '../hooks/useAuth';

function Avatar({ name, src, size = 'md' }) {
  const dim = size === 'md' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
  if (src) return <img src={src} alt={name} className={`${dim} rounded-full object-cover`} />;
  return (
    <div className={`${dim} rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function GroupAvatar({ name, size = 'md' }) {
  const dim = size === 'md' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
  return (
    <div className={`${dim} rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white`}>
      {name?.[0]?.toUpperCase() || '#'}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/friends/list.php', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setFriends(d.data); });
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const d = await apiGroupCreate(name.trim(), [...selected]);
    setLoading(false);
    if (d.success) onCreate(d.data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl p-6 w-80 max-h-[80vh] flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg">建立群組</h3>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="群組名稱"
          className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">加入好友</p>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-sm">沒有好友可加入</p>
          ) : (
            friends.map((f) => (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selected.has(f.id) ? 'bg-indigo-700/40' : 'hover:bg-gray-700'
                }`}
              >
                <Avatar name={f.username} src={f.avatar_path} size="sm" />
                <span className="text-sm text-gray-200 flex-1 text-left">{f.username}</span>
                <span className={`w-4 h-4 rounded-full border-2 ${selected.has(f.id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500'}`} />
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm text-white font-medium transition-colors"
          >
            {loading ? '...' : '建立'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dm');
  const [threads, setThreads] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([apiInbox(), apiGroupList()])
      .then(([dm, gr]) => {
        if (dm.success) setThreads(dm.data);
        if (gr.success) setGroups(gr.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const preview = (t) => {
    if (t.type === 'voice' || t.last_type === 'voice') return '🎤 Voice message';
    if (t.type === 'call') return t.body === 'completed' ? '📞 通話' : '📵 未接通';
    return (t.body || t.last_body || '').slice(0, 60);
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const handleGroupCreated = (g) => {
    setShowCreate(false);
    navigate(`/group/${g.id}`);
  };

  return (
    <Layout>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex bg-gray-800 rounded-xl p-1 gap-1 flex-1">
          {[['dm', '私訊'], ['groups', '群組']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'groups' && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-2 rounded-xl transition-colors font-medium"
          >
            ＋ 建立
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      ) : tab === 'dm' ? (
        threads.length === 0 ? (
          <p className="text-center text-gray-400 py-12">還沒有對話，去找朋友聊天吧！</p>
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
                  <p className={`text-sm truncate mt-0.5 ${t.unread_count > 0 ? 'text-gray-200' : 'text-gray-400'}`}>
                    {t.sender_id === user?.id && <span className="text-gray-500">You: </span>}
                    {preview(t)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">還沒有群組</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              ＋ 建立第一個群組
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate(`/group/${g.id}`)}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center gap-3 text-left transition-colors"
              >
                <GroupAvatar name={g.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-200 truncate">{g.name}</p>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{timeAgo(g.last_sent_at)}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate mt-0.5">
                    {g.last_body
                      ? `${g.last_sender}: ${g.last_body.slice(0, 40)}`
                      : `${g.member_count} 位成員`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={handleGroupCreated} />
      )}
    </Layout>
  );
}
