import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// isInitiator=true  → caller:  ring → wait for call_ready → send offer
// isInitiator=false → receiver: emit call_ready → wait for offer → send answer
export function useWebRTC(socket, targetUserId, isInitiator, myUsername = '') {
  const myUsernameRef = useRef(myUsername);
  myUsernameRef.current = myUsername;

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle');

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    const pc = pcRef.current;
    pcRef.current = null;
    pc?.close();
  }, []);

  useEffect(() => {
    if (!socket || !targetUserId) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('webrtc_ice', { to: targetUserId, candidate });
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc) return;
      const state = pc.connectionState;
      console.log('[WebRTC] Connection state:', state);

      if (state === 'connected') {
        setCallState('connected');
      } else if (state === 'failed' || state === 'closed') {
        // Notify the other side so they don't stay stuck at ringing/calling
        socket.emit('call_end', { to: targetUserId });
        setCallState('ended');
        cleanup();
      }
      // 'disconnected' is transient — may recover, do not end the call
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received');
      setRemoteStream(event.streams[0]);
      setCallState('connected');
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        console.log('[WebRTC] Got local stream, isInitiator:', isInitiator);
        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        if (isInitiator) {
          setCallState('ringing');
          socket.emit('call_ring', { to: targetUserId, fromUsername: myUsernameRef.current });
        } else {
          socket.emit('call_ready', { to: targetUserId });
          setCallState('connecting');
        }
      })
      .catch((err) => {
        console.error('[WebRTC] getUserMedia error:', err);
        setCallState('ended');
      });

    // Caller: receiver's page is ready → send offer
    const onCallReady = async () => {
      if (!isInitiator || !pcRef.current) return;
      console.log('[WebRTC] call_ready received, creating offer');
      setCallState('calling');
      try {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit('webrtc_offer', { to: targetUserId, offer });
        console.log('[WebRTC] Offer sent');
      } catch (e) {
        console.error('[WebRTC] createOffer error', e);
      }
    };

    // Receiver: got offer → send answer
    const onOffer = async ({ offer }) => {
      if (!pcRef.current) return;
      console.log('[WebRTC] Offer received, creating answer');
      try {
        await pcRef.current.setRemoteDescription(offer);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('webrtc_answer', { to: targetUserId, answer });
        console.log('[WebRTC] Answer sent');
      } catch (e) {
        console.error('[WebRTC] answer error', e);
      }
    };

    // Caller: got answer
    const onAnswer = async ({ answer }) => {
      console.log('[WebRTC] Answer received');
      try {
        await pcRef.current?.setRemoteDescription(answer);
      } catch (e) {
        console.error('[WebRTC] setRemoteDescription(answer) error', e);
      }
    };

    const onIce = async ({ candidate }) => {
      try {
        await pcRef.current?.addIceCandidate(candidate);
      } catch (e) {
        console.warn('[WebRTC] ICE candidate error', e);
      }
    };

    const onCallEnded = () => {
      console.log('[WebRTC] Received call_ended');
      setCallState('ended');
      cleanup();
    };

    const onCallRejected = () => {
      console.log('[WebRTC] Call rejected');
      setCallState('ended');
      cleanup();
    };

    socket.on('call_ready', onCallReady);
    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('webrtc_ice', onIce);
    socket.on('call_ended', onCallEnded);
    socket.on('call_rejected', onCallRejected);

    return () => {
      socket.off('call_ready', onCallReady);
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('webrtc_ice', onIce);
      socket.off('call_ended', onCallEnded);
      socket.off('call_rejected', onCallRejected);
      // Notify other side if we unmount while call is still active (e.g. browser back)
      if (pcRef.current || localStreamRef.current) {
        socket.emit('call_end', { to: targetUserId });
      }
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, targetUserId, isInitiator, cleanup]);

  const endCall = useCallback(() => {
    socket?.emit('call_end', { to: targetUserId });
    setCallState('ended');
    cleanup();
  }, [socket, targetUserId, cleanup]);

  return { remoteStream, callState, endCall };
}
