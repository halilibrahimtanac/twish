import { sqliteTable, text, integer, foreignKey, primaryKey } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  bio: text("bio"),
  profilePictureId: text("profile_picture_id"),
  backgroundPictureId: text("background_picture_id"),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const pictures = sqliteTable("pictures", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const twishes = sqliteTable("twishes", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull().references(() => users.id),
  originalTwishId: text("original_twish_id"), 
  type: text("type").notNull().default("original"),
  parentTwishId: text("parent_twish_id"),
  hasMedia: integer("has_media", { mode: "boolean" }).notNull().default(false),
  mediaCount: integer("media_count").notNull().default(0),
  firstMediaUrl: text("first_media_url"),
  mediaPreview: text("media_preview"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (self) => ([
  foreignKey({
    columns: [self.originalTwishId],
    foreignColumns: [self.id],
  }).onDelete("cascade")
]));

export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'image' or 'video'
  url: text("url").notNull(),
  twishId: text("twish_id").notNull().references(() => twishes.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const likes = sqliteTable("likes", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  twishId: text("twish_id").notNull().references(() => twishes.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (self) => ([
  // A user can only like a post once, so we create a composite primary key.
  primaryKey({ columns: [self.userId, self.twishId] }),
])
);

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
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

export const follows = sqliteTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (self) => ([
  primaryKey({ columns: [self.followerId, self.followingId] }),
])
);

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const participants = sqliteTable("participants", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (self) => ([
  primaryKey({ columns: [self.userId, self.conversationId] }),
]));

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
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
export type Twish = typeof twishes.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Message = typeof messages.$inferSelect;