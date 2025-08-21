'use client';

import { trpc } from '@/app/_trpc/client';
import { useUserStore } from '@/lib/store/user.store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface ISocketContext {
  socket: Socket | null;
}

const SocketContext = createContext<ISocketContext>({ socket: null });

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useUserStore();
  const utils = trpc.useUtils();
  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.NEXT_PUBLIC_SIGNAL_URL);

      newSocket.on('connect', () => {
        newSocket.emit('user-online', user.id);
      });

      newSocket.on("invalidate-twish-list", () => {
        utils.twish.getAllTwishes.invalidate();
      })

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};