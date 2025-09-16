import { protectedProcedure, router } from '@/server/trpc';
import * as messageService from './message.service';
import { getMessagesInput, sendMessageInput } from './message.input';

export const messageRouter = router({
  getConversations: protectedProcedure
    .query(({ ctx }) => {
      return messageService.getConversationsForUser(ctx.user.id);
    }),

  getMessages: protectedProcedure
    .input(getMessagesInput)
    .query(({ ctx, input }) => {
      return messageService.getMessagesBetweenUsers(ctx.user.id, input.otherUserId);
    }),

  sendMessage: protectedProcedure
    .input(sendMessageInput)
    .mutation(({ ctx, input }) => {
      return messageService.sendMessage(ctx.user.id, input);
    }),
});