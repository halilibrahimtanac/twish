import type { SendMessageInput } from "./message.input";
import { TRPCError } from "@trpc/server";
import sql, { queryRaw } from "@/db/neon";

type ConversationRow = {
  id: string;
  updatedAt: unknown;
  otherUserId: string;
  otherUserName: string;
  otherUserUsername: string;
  otherUserProfilePictureUrl: string | null;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageCreatedAt: unknown | null;
};

type MessageRow = {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  createdAt: unknown;
  senderIdValue: string;
  senderUsername: string;
  senderName: string;
};

export async function getConversationsForUser(userId: string) {
  const rows = await queryRaw<ConversationRow>(
    `
    SELECT
      conversations.id,
      conversations.updated_at AS "updatedAt",
      other_users.id AS "otherUserId",
      other_users.name AS "otherUserName",
      other_users.username AS "otherUserUsername",
      other_user_pics.url AS "otherUserProfilePictureUrl",
      last_message.content AS "lastMessageContent",
      last_message.sender_id AS "lastMessageSenderId",
      last_message.created_at AS "lastMessageCreatedAt"
    FROM conversations
    INNER JOIN participants AS other_participants
      ON other_participants.conversation_id = conversations.id
     AND other_participants.user_id = $1
    INNER JOIN users AS other_users
      ON other_users.id = other_participants.user_id
    LEFT JOIN pictures AS other_user_pics
      ON other_users.profile_picture_id = other_user_pics.id
    LEFT JOIN LATERAL (
      SELECT content, sender_id, created_at
      FROM messages
      WHERE conversation_id = conversations.id
      ORDER BY created_at DESC
      LIMIT 1
    ) AS last_message ON true
    WHERE conversations.id IN (
      SELECT conversation_id
      FROM participants
      WHERE user_id = $1
    )
    ORDER BY conversations.updated_at DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    updatedAt: row.updatedAt,
    otherUser: {
      id: row.otherUserId,
      name: row.otherUserName,
      username: row.otherUserUsername,
      profilePictureUrl: row.otherUserProfilePictureUrl,
    },
    lastMessage: {
      content: row.lastMessageContent,
      senderId: row.lastMessageSenderId,
      createdAt: row.lastMessageCreatedAt,
    },
  }));
}

export async function getMessagesBetweenUsers(
  currentUserId: string,
  otherUserId: string
) {
  const conversationRows = await queryRaw<{ conversationId: string }>(
    `
    SELECT conversation_id AS "conversationId"
    FROM participants
    WHERE user_id = $1 OR user_id = $2
    GROUP BY conversation_id
    HAVING COUNT(user_id) = 2
    LIMIT 1
    `,
    [currentUserId, otherUserId]
  );

  if (conversationRows.length === 0) {
    return [];
  }

  const conversationId = conversationRows[0].conversationId;

  const rows = await queryRaw<MessageRow>(
    `
    SELECT
      messages.id,
      messages.content,
      messages.conversation_id AS "conversationId",
      messages.sender_id AS "senderId",
      messages.created_at AS "createdAt",
      sender.id AS "senderIdValue",
      sender.username AS "senderUsername",
      sender.name AS "senderName"
    FROM messages
    INNER JOIN users AS sender
      ON sender.id = messages.sender_id
    WHERE messages.conversation_id = $1
    ORDER BY messages.created_at ASC
    `,
    [conversationId]
  );

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    conversationId: row.conversationId,
    senderId: row.senderId,
    createdAt: row.createdAt,
    sender: {
      id: row.senderIdValue,
      username: row.senderUsername,
      name: row.senderName,
    },
  }));
}

export async function sendMessage(senderId: string, input: SendMessageInput) {
  const { toUserId, content } = input;

  if (senderId === toUserId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Kendinize mesaj gonderemezsiniz.",
    });
  }

  const created = await sql.begin(async (tx) => {
    const conversationRows = await tx.unsafe<{ conversationId: string }[]>(
      `
      SELECT conversation_id AS "conversationId"
      FROM participants
      WHERE user_id = $1 OR user_id = $2
      GROUP BY conversation_id
      HAVING COUNT(user_id) = 2
      LIMIT 1
      `,
      [senderId, toUserId]
    );

    let conversationId = conversationRows[0]?.conversationId;

    if (!conversationId) {
      conversationId = crypto.randomUUID();

      await tx.unsafe(
        `
        INSERT INTO conversations (id)
        VALUES ($1)
        `,
        [conversationId]
      );

      await tx.unsafe(
        `
        INSERT INTO participants (conversation_id, user_id)
        VALUES ($1, $2), ($1, $3)
        `,
        [conversationId, senderId, toUserId]
      );
    }

    const messageId = crypto.randomUUID();
    const [newMessage] = await tx.unsafe<
      {
        id: string;
        content: string;
        senderId: string;
        conversationId: string;
        createdAt: unknown;
      }[]
    >(
      `
      INSERT INTO messages (id, sender_id, conversation_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        content,
        sender_id AS "senderId",
        conversation_id AS "conversationId",
        created_at AS "createdAt"
      `,
      [messageId, senderId, conversationId, content]
    );

    await tx.unsafe(
      `
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = $1
      `,
      [conversationId]
    );

    return newMessage;
  });

  return created;
}
