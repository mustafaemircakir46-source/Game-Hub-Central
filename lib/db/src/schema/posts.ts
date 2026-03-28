import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postTypeEnum = pgEnum("post_type", ["photo", "video", "article", "text"]);
export const mediaTypeEnum = pgEnum("media_type", ["photo", "video"]);

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  type: postTypeEnum("type").notNull().default("text"),
  authorId: integer("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorAvatar: text("author_avatar"),
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, createdAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
