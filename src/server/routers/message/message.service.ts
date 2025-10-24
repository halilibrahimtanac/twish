import db from "@/db";
import { conversations, messages, participants, pictures, users } from "@/db/schema";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { SendMessageInput } from "./message.input";
import { TRPCError } from "@trpc/server";
import { alias } from "drizzle-orm/sqlite-core";

export async function getConversationsForUser(userId: string) {
  const otherParticipants = alias(participants, "other_participants");
  const otherUsers = alias(users, "other_users");
  const otherUserPics = alias(pictures, "other_user_pics");

  const userConversationIds = db
    .select({ id: participants.conversationId })
    .from(participants)
    .where(eq(participants.userId, userId));

  const conversationsList = await db
    .select({
      id: conversations.id,
      updatedAt: conversations.updatedAt,
      otherUser: {
        id: otherUsers.id,
        name: otherUsers.name,
        username: otherUsers.username,
        profilePictureUrl: otherUserPics.url,
      },
      lastMessage: {
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
      },
    })
    .from(conversations)
    .where(inArray(conversations.id, userConversationIds))
    .innerJoin(
      otherParticipants,
      and(
        eq(otherParticipants.conversationId, conversations.id),
        eq(otherParticipants.userId, userId)
      )
    )
    .innerJoin(
      otherUsers,
      eq(otherUsers.id, otherParticipants.userId)
    )
    .leftJoin(
        otherUserPics, eq(otherUsers.profilePictureId, otherUserPics.id)
    )
    .leftJoin(
        messages,
        eq(messages.id, db.select({ id: messages.id }).from(messages)
            .where(eq(messages.conversationId, conversations.id))
            .orderBy(desc(messages.createdAt)).limit(1)
        )
    )
    .orderBy(desc(conversations.updatedAt));

  return conversationsList;
}

export async function getMessagesBetweenUsers(currentUserId: string, otherUserId: string) {
    const conversationSubquery = db
        .select({ conversationId: participants.conversationId })
        .from(participants)
        .where(or(eq(participants.userId, currentUserId), eq(participants.userId, otherUserId)))
        .groupBy(participants.conversationId)
        .having(sql`count(${participants.userId}) = 2`)
        .limit(1);

    const conversation = await conversationSubquery.get();

    if (!conversation) {
        return [];
    }

    const allMessages = await db.query.messages.findMany({
        where: eq(messages.conversationId, conversation.conversationId),
        with: {
            sender: {
                columns: {
                    id: true,
                    name: true,
                    username: true,
                },
            },
        },
        orderBy: asc(messages.createdAt),
    });

    return allMessages;
}

export async function sendMessage(senderId: string, input: SendMessageInput) {
    const { toUserId, content } = input;

    if (senderId === toUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kendinize mesaj gönderemezsiniz." });
    }

    return db.transaction((tx) => {
      const conversationRow = tx
        .select({ conversationId: participants.conversationId })
        .from(participants)
        .where(or(eq(participants.userId, senderId), eq(participants.userId, toUserId)))
        .groupBy(participants.conversationId)
        .having(sql`count(${participants.userId}) = 2`)
        .limit(1)
        .get();

      let conversationId: string;

      if (!conversationRow) {
        const insertedConvs = tx.insert(conversations).values({ id: crypto.randomUUID() }).returning().get(); // 👈 dikkat: get() ile tek satırı alıyoruz

        const newConversation = insertedConvs;
        conversationId = newConversation.id;

        tx.insert(participants)
          .values([
            { conversationId, userId: senderId },
            { conversationId, userId: toUserId },
          ])
          .run();
      } else {
        conversationId = conversationRow.conversationId;
      }

      const newMessage = tx
        .insert(messages)
        .values({
          id: crypto.randomUUID(),
          senderId,
          conversationId,
          content,
        })
        .returning()
        .get();

      tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId)).run();

        return newMessage;
    });
}