"use client";

import { trpc } from "@/app/_trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/components/SocketContext";
import { initials } from "@/lib/utils";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";

type ChatModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  otherUserId: string;
};

interface MessageType {
    id: string;
    createdAt: string;
    content: string;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        username: string;
        name: string;
    }
}

export function ChatModal({ open, onOpenChange, otherUserId }: ChatModalProps) {
  const { data: session } = useSession();
  const me = session?.user;
  const { socket, sendMessage } = useSocket();

  const otherUserQuery = trpc.user.getUserProfileInfos.useQuery({ id: otherUserId });
  const msgsQuery = trpc.message.getMessages.useQuery({ otherUserId }, { enabled: open });

  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // Map server messages to the SocketContext message shape
  // When a realtime message arrives for this conversation, refresh from server
  useEffect(() => {
    if (!socket) return;
    const onReceive = (msg: { from: string; to: string }) => {
      if (msg.from === otherUserId || msg.to === otherUserId) {
        msgsQuery.refetch();
      }
    };
    socket.on('receive-dm', onReceive);
    return () => { socket.off('receive-dm', onReceive); };
  }, [socket, otherUserId]);

  useEffect(() => {
    if (open) {
      // slight delay to allow modal render
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, (msgsQuery.data || []).length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const res = await sendMessage(otherUserId, text.trim());
    if(res){
      await msgsQuery.refetch();
      setText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUserQuery.data?.profilePictureUrl ?? undefined} />
              <AvatarFallback>{initials(otherUserQuery.data?.name)}</AvatarFallback>
            </Avatar>
            <DialogTitle>{otherUserQuery.data?.name ?? "User"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[420px]">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {(msgsQuery.data || []).map((m: MessageType) => (
              <div key={m.id} className={`flex ${m.senderId === me?.id ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${
                    m.senderId === me?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {m.content}
                  <div className="text-[10px] opacity-70 mt-1 text-right">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Type a message"
            />
            <Button onClick={handleSend} disabled={!text || msgsQuery.isLoading}>
              {msgsQuery.isLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <SendHorizonal className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
