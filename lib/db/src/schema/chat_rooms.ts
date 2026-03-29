import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const chatRoomsTable = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hostId: integer("host_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isVoice: boolean("is_voice").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  participantsCount: integer("participants_count").notNull().default(0),
  maxParticipants: integer("max_participants").notNull().default(50),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatRoomMessagesTable = pgTable("chat_room_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRoomsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  senderName: text("sender_name").notNull(),
  senderAvatar: text("sender_avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatRoomParticipantsTable = pgTable("chat_room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRoomsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertChatRoomSchema = createInsertSchema(chatRoomsTable).omit({ id: true, createdAt: true, participantsCount: true });
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRoomsTable.$inferSelect;
export type ChatRoomMessage = typeof chatRoomMessagesTable.$inferSelect;
