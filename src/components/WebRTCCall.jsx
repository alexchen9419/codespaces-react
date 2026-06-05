import { useEffect, useRef } from 'react';

export default function WebRTCCall({ remoteStream, callState, onEnd, otherUser }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const stateLabel = {
    idle: '準備中...',
    ringing: '等待對方接聽...',
    calling: '連線中 (offer sent)...',
    connecting: '等待 offer...',
    connected: '通話中',
    ended: '通話已結束',
  }[callState] ?? callState;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-8">
      <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center text-5xl shadow-lg">
        {otherUser?.avatar_path ? (
          <img src={otherUser.avatar_path} alt={otherUser.username} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span>{otherUser?.username?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>

      <div className="text-center">
        <p className="text-2xl font-bold text-white">{otherUser?.username || 'Unknown'}</p>
        <p className={`mt-2 text-sm ${callState === 'connected' ? 'text-green-400' : 'text-gray-400'}`}>
          {stateLabel}
        </p>
      </div>

      <audio ref={audioRef} autoPlay />

      <button
        onClick={onEnd}
        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-2xl shadow-lg transition-colors"
        title="End call"
      >
        📵
      </button>
    </div>
  );
}
