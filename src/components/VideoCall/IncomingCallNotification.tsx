'use client';

import { Phone, PhoneOff } from 'lucide-react';
import { CallUserType, useWebRTC } from '../WebRTCContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const IncomingCallNotification = ({ callingUserInfo }: { callingUserInfo?: CallUserType }) => {
  const { incomingCall, answerCall, rejectCall, cancelCall } = useWebRTC();

  if (!incomingCall && !callingUserInfo) return null;

  const callerInfo = callingUserInfo || incomingCall?.foundUser;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <Card className="w-[350px] shadow-lg border-2 border-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-x-4 p-4">
          <div className="flex-shrink-0">
            {callerInfo?.profilePictureUrl ? (
              <Image
                src={callerInfo.profilePictureUrl}
                alt={`${callerInfo.name}'s profile`}
                width={60}
                height={60}
                className="rounded-full object-cover w-16 h-16 border-2 border-green-500"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
                {callerInfo?.name ? callerInfo.name.charAt(0) : '?'}
              </div>
            )}
          </div>
          <div className="flex-grow flex flex-col justify-center">
            <CardTitle className="text-xl font-bold truncate">{callerInfo?.name || "Bilinmeyen Kullanıcı"}</CardTitle>
            {callerInfo?.username && (
              <p className="text-sm text-muted-foreground truncate">@{callerInfo.username}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-2 px-4 text-center">
          <p className="text-lg font-medium text-gray-700">{callingUserInfo ? "calling..." : "is calling you..."}</p>
        </CardContent>
        <CardFooter className={cn("flex p-4 bg-gray-50 border-t", callingUserInfo ? "justify-center" : "justify-between")}>
          <Button
            variant="outline"
            size="icon"
            onClick={callingUserInfo ? () => cancelCall(callingUserInfo.id) : rejectCall}
            className="w-12 h-12 rounded-full border-red-500 text-red-500 hover:bg-red-100 transition-colors"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          {!callingUserInfo && <Button
            size="icon"
            onClick={answerCall}
            className="w-12 h-12 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Phone className="h-6 w-6" />
          </Button>}
        </CardFooter>
      </Card>
    </div>
  );
};