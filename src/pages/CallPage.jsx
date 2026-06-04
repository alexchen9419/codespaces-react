import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebRTCCall from '../components/WebRTCCall';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';

export default function CallPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [otherUser, setOtherUser] = useState(null);

  // Fetch the other user's info
  useEffect(() => {
    fetch(`/api/messages/thread.php?user_id=${userId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.other_user) setOtherUser(d.other_user); });
  }, [userId]);

  const { remoteStream, callState, endCall } = useWebRTC(
    socket,
    parseInt(userId),
    true // we are the caller (initiator)
  );

  const handleEnd = () => {
    endCall();
    navigate(-1);
  };

  useEffect(() => {
    if (callState === 'ended') {
      setTimeout(() => navigate(-1), 1500);
    }
  }, [callState, navigate]);

  if (!socket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <WebRTCCall
      remoteStream={remoteStream}
      callState={callState}
      onEnd={handleEnd}
      otherUser={otherUser}
    />
  );
}
