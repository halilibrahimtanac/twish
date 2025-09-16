import { z } from 'zod';

export const getMessagesInput = z.object({
  otherUserId: z.string().uuid(),
});

export const sendMessageInput = z.object({
  toUserId: z.string().uuid(),
  content: z.string().min(1, "Mesaj boş olamaz.").max(500, "Mesaj en fazla 500 karakter olabilir."),
});

export type SendMessageInput = z.infer<typeof sendMessageInput>;