// Add `foreignKey` to your imports
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

export const usersRelations = relations(users, ({ many }) => ({
  twishes: many(twishes),
  pictures: many(pictures),
  likes: many(likes)
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

export type User = typeof users.$inferSelect;
export type Twish = typeof twishes.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Like = typeof likes.$inferSelect;