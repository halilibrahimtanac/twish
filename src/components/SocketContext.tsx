'use client';

import { trpc } from '@/app/_trpc/client';
import { useSession } from 'next-auth/react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

interface ISocketContext {
  socket: Socket | null;
  messages: Map<string, Message[]>;
  unreadCounts: Map<string, number>;
  sendMessage: (toUserId: string, text: string) => void;
  markAsRead: (userId: string) => void;
}

const SocketContext = createContext<ISocketContext>({
  socket: null,
  messages: new Map(),
  unreadCounts: new Map(),
  sendMessage: () => {},
  markAsRead: () => {},
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: session } = useSession();
  const user = session?.user;
  const utils = trpc.useUtils();
  
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.NEXT_PUBLIC_SIGNAL_URL as string);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log("Socket.IO'ya bağlandı:", newSocket.id);
        newSocket.emit('user-online', user.id);
      });

      newSocket.on("invalidate-twish-list", () => {
        utils.twish.getAllTwishes.invalidate();
      });

      return () => {
        console.log('Socket.IO bağlantısı kesiliyor.');
        newSocket.disconnect();
      };
    }
  }, [user?.id, utils.twish.getAllTwishes]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleReceiveDm = (newMessage: Message) => {
      const otherUserId = newMessage.from === user.id ? newMessage.to : newMessage.from;
      
      setMessages(prevMessages => {
        const newMessages = new Map(prevMessages);
        const existingConversation = newMessages.get(otherUserId) || [];
        if (!existingConversation.some(msg => msg.id === newMessage.id)) {
            newMessages.set(otherUserId, [...existingConversation, newMessage]);
        }
        return newMessages;
      });

      if(newMessage.from !== user.id){
        setUnreadCounts(prevCounts => {
            const newCounts = new Map(prevCounts);
            newCounts.set(otherUserId, (newCounts.get(otherUserId) || 0) + 1);
            return newCounts;
        });
      }
    };

    const handlePendingDms = (pendingMessages: Message[]) => {
       setMessages(prevMessages => {
         const newMessages = new Map(prevMessages);
         pendingMessages.forEach(msg => {
            const otherUserId = msg.from;
            const conversation = newMessages.get(otherUserId) || [];
            if (!conversation.some(m => m.id === msg.id)) {
                conversation.push(msg);
            }
            newMessages.set(otherUserId, conversation);
         });
         return newMessages;
       });
       setUnreadCounts(prevCounts => {
         const newCounts = new Map(prevCounts);
         pendingMessages.forEach(msg => {
            const otherUserId = msg.from;
            newCounts.set(otherUserId, (newCounts.get(otherUserId) || 0) + 1);
         });
         return newCounts;
       });
    };

    socket.on('receive-dm', handleReceiveDm);
    socket.on('pending-dms', handlePendingDms);
    socket.on('dm-sent-confirmation', handleReceiveDm);

    return () => {
      socket.off('receive-dm', handleReceiveDm);
      socket.off('pending-dms', handlePendingDms);
      socket.off('dm-sent-confirmation', handleReceiveDm);
    };
  }, [socket, user?.id]);

  const sendMessage = useCallback((toUserId: string, text: string) => {
    if (socket && user?.id) {
      console.log(`${user.id}'dan ${toUserId}'a mesaj gönderiliyor: ${text}`);
      socket.emit('send-dm', { toUserId, text });
    }
  }, [socket, user?.id]);
  
  const markAsRead = useCallback((userId: string) => {
    setUnreadCounts(prevCounts => {
      if (prevCounts.get(userId) === 0) return prevCounts;
      const newCounts = new Map(prevCounts);
      newCounts.set(userId, 0);
      return newCounts;
    });
  }, []);
  
  const value = { socket, messages, unreadCounts, sendMessage, markAsRead };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};