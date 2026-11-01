import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [liveQueue, setLiveQueue] = useState([]);
  const [nowCalling, setNowCalling] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setLiveQueue(data.queue || []);
        const currentlyServing = (data.queue || []).find(q => q.current_status === 'SERVING');
        if (currentlyServing) {
          setNowCalling(currentlyServing);
        }
      }
    } catch (err) {
      console.warn('Queue fetch error:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    const socketInstance = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.io] Connected to clinic telemetry server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.io] Disconnected from server');
    });

    socketInstance.on('queue:updated', (updatedQueue) => {
      setLiveQueue(updatedQueue || []);
      const currentlyServing = (updatedQueue || []).find(q => q.current_status === 'SERVING');
      if (currentlyServing) {
        setNowCalling(currentlyServing);
      }
    });

    socketInstance.on('queue:ticket_called', (data) => {
      setNowCalling(data.ticket);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [fetchQueue]);

  return (
    <SocketContext.Provider value={{ socket, liveQueue, nowCalling, isConnected, refreshQueue: fetchQueue }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
