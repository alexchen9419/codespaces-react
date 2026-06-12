import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiGroupThread, apiGroupSend } from '../api/groups';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

function Avatar({ name, src, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  if (src) return <img src={src} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${dim} rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function GroupChatPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    apiGroupThread(groupId)
      .then((d) => {
        if (d.success) {
          setMessages(d.data);
          setGroup(d.group);
          setMembers(d.members);
        } else {
          navigate('/inbox');
        }
      })
      .finally(() => setLoading(false));
  }, [groupId, navigate]);

  // Join socket room for this group
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_group', parseInt(groupId));
    const handler = (msg) => {
      if (String(msg.group_id) === String(groupId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('group_message', handler);
    return () => socket.off('group_message', handler);
  }, [socket, groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendText = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim();
    setText('');
    const d = await apiGroupSend(parseInt(groupId), body);
    if (d.success) {
      setMessages((prev) => [...prev, d.data]);
      socket?.emit('send_group_message', { groupId: parseInt(groupId), message: d.data });
    }
  };

  const timeStr = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <button onClick={() => navigate('/inbox')} className="text-gray-400 hover:text-white text-lg">←</button>
        <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white text-lg shrink-0">
          {group?.name?.[0]?.toUpperCase() || '#'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{group?.name || '...'}</p>
          <p className="text-xs text-gray-400">{members.length} 位成員</p>
        </div>
        <button
          onClick={() => setShowMembers((v) => !v)}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-gray-700"
          title="Members"
        >
          👥
        </button>
      </div>

      {/* Member list panel */}
      {showMembers && (
        <div className="mb-4 bg-gray-800 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">成員</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 bg-gray-700 rounded-full px-3 py-1">
                <Avatar name={m.username} src={m.avatar_path} />
                <span className="text-sm text-gray-200">{m.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-3 min-h-[400px] max-h-[60vh] overflow-y-auto pr-1 mb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 py-12">還沒有訊息，說些什麼吧！</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id || parseInt(m.sender_id) === user?.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar src={m.avatar_path} name={m.username} />}
                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-xs text-gray-400 mb-0.5 ml-1">{m.username}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{timeStr(m.sent_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendText} className="flex items-center gap-2 bg-gray-800 rounded-xl p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="傳送訊息..."
          className="flex-1 bg-transparent text-gray-100 px-2 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </Layout>
  );
}
