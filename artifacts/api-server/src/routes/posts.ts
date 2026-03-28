import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { postsTable, likesTable, usersTable, commentsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return sessions.get(token) ?? null;
}

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, type } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions: any[] = [];
    if (type && type !== "all") conditions.push(eq(postsTable.type, type));

    const posts = await db.select().from(postsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(postsTable.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const total = await db.select({ count: sql<number>`count(*)` }).from(postsTable);

    const formattedPosts = await Promise.all(posts.map(async (post) => {
      let isLiked = false;
      if (userId) {
        const like = await db.select().from(likesTable).where(
          and(eq(likesTable.userId, userId), eq(likesTable.targetType, "post"), eq(likesTable.targetId, post.id))
        ).limit(1);
        isLiked = like.length > 0;
      }
      return { ...post, isLiked };
    }));

    return res.json({ posts: formattedPosts, total: Number(total[0].count), page: parseInt(page), totalPages: Math.ceil(Number(total[0].count) / parseInt(limit)) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı" });

    const { content, mediaUrl, mediaType, type = "text" } = req.body;

    const [post] = await db.insert(postsTable).values({
      content,
      mediaUrl,
      mediaType,
      type,
      authorId: userId,
      authorName: user.displayName || user.username,
      authorAvatar: user.avatar,
    }).returning();

    await db.update(usersTable).set({ postsCount: sql`${usersTable.postsCount} + 1` }).where(eq(usersTable.id, userId));

    return res.status(201).json({ ...post, isLiked: false });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!post) return res.status(404).json({ error: "Bulunamadı" });
    let isLiked = false;
    if (userId) {
      const like = await db.select().from(likesTable).where(
        and(eq(likesTable.userId, userId), eq(likesTable.targetType, "post"), eq(likesTable.targetId, id))
      ).limit(1);
      isLiked = like.length > 0;
    }
    return res.json({ ...post, isLiked });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Yetkisiz" });
    const id = parseInt(req.params.id);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!post) return res.status(404).json({ error: "Bulunamadı" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (post.authorId !== userId && !user?.isAdmin) return res.status(403).json({ error: "Yetkisiz" });
    await db.delete(postsTable).where(eq(postsTable.id, id));
    return res.json({ success: true, message: "Silindi" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    const id = parseInt(req.params.id);

    const existing = await db.select().from(likesTable).where(
      and(eq(likesTable.userId, userId), eq(likesTable.targetType, "post"), eq(likesTable.targetId, id))
    ).limit(1);

    if (existing.length > 0) {
      await db.delete(likesTable).where(eq(likesTable.id, existing[0].id));
      await db.update(postsTable).set({ likesCount: sql`${postsTable.likesCount} - 1` }).where(eq(postsTable.id, id));
      const [p] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      return res.json({ liked: false, likesCount: p?.likesCount ?? 0 });
    } else {
      await db.insert(likesTable).values({ userId, targetType: "post", targetId: id });
      await db.update(postsTable).set({ likesCount: sql`${postsTable.likesCount} + 1` }).where(eq(postsTable.id, id));
      const [p] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      return res.json({ liked: true, likesCount: p?.likesCount ?? 0 });
    }
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/:id/comments", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const comments = await db.select().from(commentsTable)
      .where(and(eq(commentsTable.targetType, "post"), eq(commentsTable.targetId, id)))
      .orderBy(desc(commentsTable.createdAt));
    return res.json({ comments: comments.map(c => ({ ...c, isLiked: false })), total: comments.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    const id = parseInt(req.params.id);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Boş yorum gönderilemez" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const [comment] = await db.insert(commentsTable).values({
      content,
      targetType: "post",
      targetId: id,
      authorId: userId,
      authorName: user?.displayName || user?.username || "Kullanıcı",
      authorAvatar: user?.avatar,
    }).returning();
    await db.update(postsTable).set({ commentsCount: sql`${postsTable.commentsCount} + 1` }).where(eq(postsTable.id, id));
    return res.status(201).json({ ...comment, isLiked: false });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
