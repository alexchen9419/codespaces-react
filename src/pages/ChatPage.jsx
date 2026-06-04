import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import VoiceRecorder from '../components/VoiceRecorder';
import VoicePlayer from '../components/VoicePlayer';
import { apiThread, apiSendMessage, apiSendVoice } from '../api/messages';
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

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    const d = await apiThread(userId);
    if (d.success) {
      setMessages(d.data);
      setOtherUser(d.other_user);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (
        (msg.sender_id === parseInt(userId) && msg.receiver_id === user.id) ||
        (msg.sender_id === user.id && msg.receiver_id === parseInt(userId))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, userId, user]);

  const sendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const d = await apiSendMessage(parseInt(userId), text.trim());
    if (d.success) {
      setMessages((prev) => [...prev, d.data]);
      setText('');
      socket?.emit('send_message', { to: parseInt(userId), message: d.data });
    }
    setSending(false);
  };

  const sendVoice = async (blob, duration) => {
    const d = await apiSendVoice(parseInt(userId), blob, duration);
    if (d.success) {
      setMessages((prev) => [...prev, d.data]);
      socket?.emit('send_message', { to: parseInt(userId), message: d.data });
    }
  };

  const timeStr = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        {otherUser && <Avatar src={otherUser.avatar_path} name={otherUser.username} size="md" />}
        <div className="flex-1">
          <p className="font-bold text-white">{otherUser?.username || 'Loading...'}</p>
        </div>
        {otherUser && (
          <button
            onClick={() => navigate(`/call/${userId}`)}
            className="bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            📞 Call
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 min-h-[400px] max-h-[60vh] overflow-y-auto pr-1 mb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Start the conversation!</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar src={m.avatar_path} name={m.username} />}
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {m.type === 'voice' ? (
                    <VoicePlayer src={`/${m.file_path}`} duration={m.duration_seconds} />
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                      }`}
                    >
                      {m.body}
                    </div>
                  )}
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
        <VoiceRecorder onSend={sendVoice} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-gray-100 px-2 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </Layout>
  );
}
