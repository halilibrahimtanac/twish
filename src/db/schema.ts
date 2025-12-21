import { pgTable, text, integer, foreignKey, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  bio: text("bio"),
  profilePictureId: text("profile_picture_id"),
  backgroundPictureId: text("background_picture_id"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().default(sql`now()`),
});

export const pictures = pgTable("pictures", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
});

export const twishes = pgTable("twishes", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull().references(() => users.id),
  originalTwishId: text("original_twish_id"), 
  type: text("type").notNull().default("original"),
  parentTwishId: text("parent_twish_id"),
  hasMedia: integer("has_media").notNull().default(0),
  mediaCount: integer("media_count").notNull().default(0),
  firstMediaUrl: text("first_media_url"),
  mediaPreview: text("media_preview"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().default(sql`now()`),
}, (self) => ([
  foreignKey({
    columns: [self.originalTwishId],
    foreignColumns: [self.id],
  }).onDelete("cascade")
]));

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'image' or 'video'
  url: text("url").notNull(),
  twishId: text("twish_id").notNull().references(() => twishes.id),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
});

export const likes = pgTable("likes", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  twishId: text("twish_id").notNull().references(() => twishes.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
}, (self) => ([
  // A user can only like a post once, so we create a composite primary key.
  primaryKey({ columns: [self.userId, self.twishId] }),
])
);

export const stories = pgTable("stories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
  expiresAt: integer("expires_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  twishes: many(twishes),
  pictures: many(pictures),
  likes: many(likes),
  following: many(follows, {
    relationName: "following",
  }),
  followers: many(follows, {
    relationName: "followers",
  }),
  stories: many(stories),
  participants: many(participants),
  sentMessages: many(messages),
}));

export const twishesRelations = relations(twishes, ({ one, many }) => ({
  author: one(users, {
    fields: [twishes.authorId],
    references: [users.id],
  }),
  // This points to a parent twish (e.g. this twish is a retweet)
  originalTwish: one(twishes, {
    fields: [twishes.originalTwishId],
    references: [twishes.id],
    relationName: "retwishes", // This name connects to the relation below
  }),
  // This defines the children (e.g. all the retweets of this twish)
  retwishes: many(twishes, {
    relationName: "retwishes",
  }),
  media: many(media),
  likes: many(likes)
}));

export const mediaRelations = relations(media, ({ one }) => ({
  twish: one(twishes, {
    fields: [media.twishId],
    references: [twishes.id],
  }),
}));

export const picturesRelations = relations(pictures, ({ one }) => ({
  user: one(users, {
    fields: [pictures.uploadedBy],
    references: [users.id]
  }) 
}))

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  twish: one(twishes, {
    fields: [likes.twishId],
    references: [twishes.id],
  }),
}));

export const follows = pgTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
}, (self) => ([
  primaryKey({ columns: [self.followerId, self.followingId] }),
])
);

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().default(sql`now()`),
});

export const participants = pgTable("participants", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
}, (self) => ([
  primaryKey({ columns: [self.userId, self.conversationId] }),
]));

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().default(sql`now()`),
  usedAt: timestamp("used_at", { withTimezone: false }),
});

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "following",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "followers",
  }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(participants),
  messages: many(messages),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [participants.conversationId],
    references: [conversations.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Twish = typeof twishes.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Message = typeof messages.$inferSelect;