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

    return () => {
      // Keep connection alive across page navigations
    };
  }, [user]);

  return socketRef.current || socketInstance;
}
