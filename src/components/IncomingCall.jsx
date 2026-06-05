import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

export default function IncomingCall() {
  const socket = useSocket();
  const navigate = useNavigate();
  const [caller, setCaller] = useState(null); // { id, username }

  useEffect(() => {
    if (!socket) return;

    const onIncoming = ({ from, fromUsername }) => {
      setCaller({ id: from, username: fromUsername || `User ${from}` });
    };
    const onCallEnded = () => setCaller(null);

    socket.on('call_incoming', onIncoming);
    socket.on('call_ended', onCallEnded);
    return () => {
      socket.off('call_incoming', onIncoming);
      socket.off('call_ended', onCallEnded);
    };
  }, [socket]);

  const accept = () => {
    if (!caller) return;
    socket?.emit('call_accept', { to: caller.id });
    navigate(`/call/${caller.id}`, { state: { isInitiator: false } });
    setCaller(null);
  };

  const reject = () => {
    if (!caller) return;
    socket?.emit('call_reject', { to: caller.id });
    setCaller(null);
  };

  if (!caller) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl min-w-[260px]">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
          {caller.username[0]?.toUpperCase() || '?'}
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">{caller.username}</p>
          <p className="text-gray-400 text-sm animate-pulse">來電中...</p>
        </div>
        <div className="flex gap-8">
          <button
            onClick={reject}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-2xl transition-colors"
            title="拒絕"
          >
            📵
          </button>
          <button
            onClick={accept}
            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-2xl transition-colors"
            title="接聽"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
