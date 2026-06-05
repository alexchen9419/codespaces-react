import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socketInstance = null;

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io(SOCKET_URL, { withCredentials: false });
    }

    socketInstance.emit('register', user.id);
    socketRef.current = socketInstance;

    // Re-register whenever the socket reconnects (e.g. after signaling server restart)
    const onReconnect = () => socketInstance.emit('register', user.id);
    socketInstance.on('connect', onReconnect);

    return () => {
      socketInstance?.off('connect', onReconnect);
    };
  }, [user]);

  return socketRef.current || socketInstance;
}
