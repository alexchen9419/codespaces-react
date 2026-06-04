import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useWebRTC(socket, targetUserId, isInitiator) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle | calling | ringing | connected | ended

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (!socket || !targetUserId) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc_ice', { to: targetUserId, candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setCallState('connected');
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (['disconnected', 'failed', 'closed'].includes(state)) {
        setCallState('ended');
        cleanup();
      }
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        if (isInitiator) {
          setCallState('calling');
          return pc.createOffer();
        }
      })
      .then((offer) => {
        if (!offer) return;
        return pc.setLocalDescription(offer).then(() => {
          socket.emit('webrtc_offer', { to: targetUserId, offer });
        });
      })
      .catch((err) => {
        console.error('getUserMedia error:', err);
        setCallState('ended');
      });

    const onOffer = async ({ from, offer }) => {
      await pc.setRemoteDescription(offer);
      setCallState('ringing');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { to: from, answer });
    };

    const onAnswer = async ({ answer }) => {
      await pc.setRemoteDescription(answer);
    };

    const onIce = async ({ candidate }) => {
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn('ICE error', e);
      }
    };

    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('webrtc_ice', onIce);

    return () => {
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('webrtc_ice', onIce);
      cleanup();
    };
  }, [socket, targetUserId, isInitiator, cleanup]);

  const endCall = useCallback(() => {
    setCallState('ended');
    cleanup();
  }, [cleanup]);

  return { remoteStream, callState, endCall };
}
