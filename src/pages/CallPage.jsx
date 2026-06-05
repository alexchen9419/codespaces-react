import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import WebRTCCall from '../components/WebRTCCall';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { apiLogCall } from '../api/messages';

export default function CallPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const { user } = useAuth();
  const [otherUser, setOtherUser] = useState(null);

  const isInitiator = location.state?.isInitiator !== false;
  const connectedAtRef = useRef(null);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    fetch(`/api/messages/thread.php?user_id=${userId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.other_user) setOtherUser(d.other_user); });
  }, [userId]);

  const { remoteStream, callState, endCall } = useWebRTC(
    socket,
    parseInt(userId),
    isInitiator,
    user?.username || ''
  );

  // Record when call becomes connected
  useEffect(() => {
    if (callState === 'connected' && !connectedAtRef.current) {
      connectedAtRef.current = Date.now();
    }
  }, [callState]);

  // Only the initiator (caller) logs the call record to avoid duplicates
  const saveCallRecord = (status) => {
    if (!isInitiator) return;
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    const duration = connectedAtRef.current
      ? Math.round((Date.now() - connectedAtRef.current) / 1000)
      : 0;
    apiLogCall(parseInt(userId), duration, status)
      .then((d) => {
        if (d?.success && socket) {
          socket.emit('send_message', { to: parseInt(userId), message: d.data });
        }
      })
      .catch(() => {});
  };

  // User clicks hang-up button
  const handleEnd = () => {
    const status = connectedAtRef.current ? 'completed' : 'cancelled';
    saveCallRecord(status);
    endCall();
    navigate(-1);
  };

  // Call ended automatically (ICE failure, remote hang-up, etc.)
  useEffect(() => {
    if (callState !== 'ended') return;
    const status = connectedAtRef.current ? 'completed' : 'cancelled';
    saveCallRecord(status);
    const t = setTimeout(() => navigate(-1), 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
