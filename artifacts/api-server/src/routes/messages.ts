import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { directMessagesTable, usersTable, chatRoomsTable, chatRoomMessagesTable, chatRoomParticipantsTable } from "@workspace/db/schema";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

// Auth middleware
function getUserId(req: any): number | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  return sessions.get(token) ?? null;
}

// ====== DIRECT MESSAGES ======

// Get conversations list (unique people I've talked with)
router.get("/conversations", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Giriş gerekli" });

  try {
    const sent = await db
      .select({
        otherId: directMessagesTable.receiverId,
        lastMessage: directMessagesTable.content,
        lastAt: directMessagesTable.createdAt,
        isRead: directMessagesTable.isRead,
      })
      .from(directMessagesTable)
      .where(eq(directMessagesTable.senderId, userId))
      .orderBy(desc(directMessagesTable.createdAt));

    const received = await db
      .select({
        otherId: directMessagesTable.senderId,
        lastMessage: directMessagesTable.content,
        lastAt: directMessagesTable.createdAt,
        isRead: directMessagesTable.isRead,
      })
      .from(directMessagesTable)
      .where(eq(directMessagesTable.receiverId, userId))
      .orderBy(desc(directMessagesTable.createdAt));

    // Merge and deduplicate by otherId (keep latest per person)
    const allPeople = new Map<number, any>();
    [...sent, ...received].forEach(m => {
      const existing = allPeople.get(m.otherId);
      if (!existing || m.lastAt > existing.lastAt) {
        allPeople.set(m.otherId, m);
      }
    });

    // Fetch user info for each conversation partner
    const conversations = await Promise.all(
      Array.from(allPeople.entries())
        .sort((a, b) => new Date(b[1].lastAt).getTime() - new Date(a[1].lastAt).getTime())
        .map(async ([otherId, msg]) => {
          const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId)).limit(1);
          if (!other) return null;
          const unread = await db.select({ count: sql<number>`count(*)` })
            .from(directMessagesTable)
            .where(and(
              eq(directMessagesTable.senderId, otherId),
              eq(directMessagesTable.receiverId, userId),
              eq(directMessagesTable.isRead, false)
            ));
          return {
            userId: other.id,
            username: other.username,
            displayName: other.displayName || other.username,
            avatar: other.avatar,
            lastMessage: msg.lastMessage,
            lastAt: msg.lastAt,
            unreadCount: Number(unread[0].count),
          };
        })
    );

    return res.json({ conversations: conversations.filter(Boolean) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Get messages with a specific user
router.get("/dm/:userId", async (req, res) => {
  const myId = getUserId(req);
  if (!myId) return res.status(401).json({ error: "Giriş gerekli" });

  try {
    const otherId = parseInt(req.params.userId);
    const msgs = await db
      .select()
      .from(directMessagesTable)
      .where(
        or(
          and(eq(directMessagesTable.senderId, myId), eq(directMessagesTable.receiverId, otherId)),
          and(eq(directMessagesTable.senderId, otherId), eq(directMessagesTable.receiverId, myId))
        )
      )
      .orderBy(directMessagesTable.createdAt);

    // Mark as read
    await db.update(directMessagesTable)
      .set({ isRead: true })
      .where(and(eq(directMessagesTable.senderId, otherId), eq(directMessagesTable.receiverId, myId)));

    // Get sender info for each
    const messagesWithInfo = await Promise.all(msgs.map(async m => {
      const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, m.senderId)).limit(1);
      return {
        ...m,
        senderName: sender?.displayName || sender?.username || "Bilinmeyen",
        senderAvatar: sender?.avatar,
        isMe: m.senderId === myId,
      };
    }));

    return res.json({ messages: messagesWithInfo });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Send DM
router.post("/dm/:userId", async (req, res) => {
  const myId = getUserId(req);
  if (!myId) return res.status(401).json({ error: "Giriş gerekli" });

  try {
    const receiverId = parseInt(req.params.userId);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Mesaj boş olamaz" });

    const [msg] = await db.insert(directMessagesTable).values({
      senderId: myId,
      receiverId,
      content: content.trim(),
      isRead: false,
    }).returning();

    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, myId)).limit(1);

    return res.status(201).json({
      ...msg,
      senderName: me?.displayName || me?.username || "Ben",
      senderAvatar: me?.avatar,
      isMe: true,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ====== CHAT ROOMS ======

// Get all active rooms
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await db
      .select()
      .from(chatRoomsTable)
      .where(eq(chatRoomsTable.isActive, true))
      .orderBy(desc(chatRoomsTable.createdAt));

    const roomsWithHost = await Promise.all(rooms.map(async r => {
      const [host] = await db.select().from(usersTable).where(eq(usersTable.id, r.hostId)).limit(1);
      return {
        ...r,
        hostName: host?.displayName || host?.username || "Bilinmeyen",
        hostAvatar: host?.avatar,
      };
    }));

    return res.json({ rooms: roomsWithHost });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Create room
router.post("/rooms", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Giriş gerekli" });

  try {
    const { name, description, isVoice } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Oda adı gerekli" });

    const [room] = await db.insert(chatRoomsTable).values({
      name: name.trim(),
      description: description?.trim(),
      hostId: userId,
      isVoice: Boolean(isVoice),
      isActive: true,
      participantsCount: 1,
      maxParticipants: 50,
    }).returning();

    // Auto-join host
    await db.insert(chatRoomParticipantsTable).values({ roomId: room.id, userId }).onConflictDoNothing();

    const [host] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    return res.status(201).json({
      ...room,
      hostName: host?.displayName || host?.username,
      hostAvatar: host?.avatar,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Get room messages
router.get("/rooms/:id/messages", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const msgs = await db
      .select()
      .from(chatRoomMessagesTable)
      .where(eq(chatRoomMessagesTable.roomId, roomId))
      .orderBy(chatRoomMessagesTable.createdAt)
      .limit(100);

    const userId = getUserId(req);
    return res.json({ messages: msgs.map(m => ({ ...m, isMe: m.senderId === userId })) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Send message in room
router.post("/rooms/:id/messages", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Giriş gerekli" });

  try {
    const roomId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Mesaj boş olamaz" });

    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const [msg] = await db.insert(chatRoomMessagesTable).values({
      roomId,
      senderId: userId,
      content: content.trim(),
      senderName: me?.displayName || me?.username || "Bilinmeyen",
      senderAvatar: me?.avatar,
    }).returning();

    // Update participant count
    await db.insert(chatRoomParticipantsTable).values({ roomId, userId }).onConflictDoNothing();
    const [pCount] = await db.select({ count: sql<number>`count(*)` }).from(chatRoomParticipantsTable).where(eq(chatRoomParticipantsTable.roomId, roomId));
    await db.update(chatRoomsTable).set({ participantsCount: Number(pCount.count) }).where(eq(chatRoomsTable.id, roomId));

    return res.status(201).json({ ...msg, isMe: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Close room
router.delete("/rooms/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Giriş gerekli" });
  try {
    const roomId = parseInt(req.params.id);
    const [room] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, roomId)).limit(1);
    if (!room || room.hostId !== userId) return res.status(403).json({ error: "Yetkisiz" });
    await db.update(chatRoomsTable).set({ isActive: false }).where(eq(chatRoomsTable.id, roomId));
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
