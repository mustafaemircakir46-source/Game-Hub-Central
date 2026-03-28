import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameStatusEnum = pgEnum("game_status", ["pending", "approved", "rejected"]);
export const orientationEnum = pgEnum("orientation", ["vertical", "horizontal"]);

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail"),
  gameUrl: text("game_url"),
  gameFile: text("game_file"),
  videoPreview: text("video_preview"),
  category: text("category").notNull(),
  orientation: orientationEnum("orientation").notNull().default("vertical"),
  status: gameStatusEnum("status").notNull().default("pending"),
  uploaderId: integer("uploader_id").notNull(),
  uploaderName: text("uploader_name").notNull(),
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  playsCount: integer("plays_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
