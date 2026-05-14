import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket(auctionId, handlers = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (auctionId) socket.emit('join:auction', auctionId);
    });

    socket.on('bid:new', (data) => handlersRef.current.onBid?.(data));
    socket.on('auction:ended', (data) => handlersRef.current.onAuctionEnd?.(data));
    socket.on('dutch:price-update', (data) => handlersRef.current.onDutchPrice?.(data));

    return () => {
      if (auctionId) socket.emit('leave:auction', auctionId);
      socket.disconnect();
    };
  }, [auctionId]);

  return socketRef;
}
