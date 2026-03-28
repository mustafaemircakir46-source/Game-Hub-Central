import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { gamesTable, likesTable } from "@workspace/db/schema";
import { eq, and, desc, sql, ilike, inArray } from "drizzle-orm";
import { sessions } from "./auth.js";
import { usersTable } from "@workspace/db/schema";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return sessions.get(token) ?? null;
}

async function formatGame(game: any, userId: number | null) {
  let isLiked = false;
  if (userId) {
    const like = await db.select().from(likesTable).where(
      and(eq(likesTable.userId, userId), eq(likesTable.targetType, "game"), eq(likesTable.targetId, game.id))
    ).limit(1);
    isLiked = like.length > 0;
  }
  return { ...game, isLiked, tags: game.tags || [] };
}

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, orientation, page = 1, limit = 20, search, sortBy = "newest" } = req.query as any;

    let query = db.select().from(gamesTable).where(eq(gamesTable.status, "approved")) as any;

    const conditions: any[] = [eq(gamesTable.status, "approved")];
    if (category) conditions.push(eq(gamesTable.category, category));
    if (orientation) conditions.push(eq(gamesTable.orientation, orientation));
    if (search) conditions.push(ilike(gamesTable.title, `%${search}%`));

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let orderBy: any;
    if (sortBy === "popular") orderBy = [desc(gamesTable.playsCount), desc(gamesTable.likesCount)];
    else if (sortBy === "trending") orderBy = [desc(gamesTable.likesCount)];
    else orderBy = [desc(gamesTable.createdAt)];

    const games = await db.select().from(gamesTable)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(parseInt(limit))
      .offset(offset);

    const total = await db.select({ count: sql<number>`count(*)` }).from(gamesTable)
      .where(and(...conditions));

    const formattedGames = await Promise.all(games.map(g => formatGame(g, userId)));

    return res.json({
      games: formattedGames,
      total: Number(total[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(Number(total[0].count) / parseInt(limit)),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/horizontal", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20 } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const games = await db.select().from(gamesTable)
      .where(and(eq(gamesTable.status, "approved"), eq(gamesTable.orientation, "horizontal")))
      .orderBy(desc(gamesTable.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const total = await db.select({ count: sql<number>`count(*)` }).from(gamesTable)
      .where(and(eq(gamesTable.status, "approved"), eq(gamesTable.orientation, "horizontal")));

    const formattedGames = await Promise.all(games.map(g => formatGame(g, userId)));
    return res.json({ games: formattedGames, total: Number(total[0].count), page: parseInt(page), totalPages: Math.ceil(Number(total[0].count) / parseInt(limit)) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const userId = getUserId(req);
    const games = await db.select().from(gamesTable)
      .where(eq(gamesTable.status, "approved"))
      .orderBy(desc(gamesTable.likesCount), desc(gamesTable.playsCount))
      .limit(20);
    const formattedGames = await Promise.all(games.map(g => formatGame(g, userId)));
    return res.json({ games: formattedGames, total: formattedGames.length, page: 1, totalPages: 1 });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/recommended", async (req, res) => {
  try {
    const userId = getUserId(req);
    const games = await db.select().from(gamesTable)
      .where(eq(gamesTable.status, "approved"))
      .orderBy(sql`RANDOM()`)
      .limit(10);
    const formattedGames = await Promise.all(games.map(g => formatGame(g, userId)));
    return res.json({ games: formattedGames, total: formattedGames.length, page: 1, totalPages: 1 });
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

    const { title, description, thumbnail, gameUrl, gameFile, videoPreview, category, orientation = "vertical", tags = [] } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "Eksik alan" });
    }

    const [game] = await db.insert(gamesTable).values({
      title,
      description,
      thumbnail,
      gameUrl,
      gameFile,
      videoPreview,
      category,
      orientation,
      status: "pending",
      uploaderId: userId,
      uploaderName: user.displayName || user.username,
      tags: Array.isArray(tags) ? tags : [],
    }).returning();

    await db.update(usersTable).set({ gamesCount: sql`${usersTable.gamesCount} + 1` }).where(eq(usersTable.id, userId));

    return res.status(201).json({ ...game, isLiked: false });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
    if (!game || game.status !== "approved") return res.status(404).json({ error: "Oyun bulunamadı" });

    const { commentsTable } = await import("@workspace/db/schema");
    const comments = await db.select().from(commentsTable)
      .where(and(eq(commentsTable.targetType, "game"), eq(commentsTable.targetId, id)))
      .orderBy(desc(commentsTable.createdAt))
      .limit(20);

    const relatedGames = await db.select().from(gamesTable)
      .where(and(eq(gamesTable.status, "approved"), eq(gamesTable.category, game.category)))
      .limit(6);

    const formatted = await formatGame(game, userId);
    const formattedRelated = await Promise.all(relatedGames.filter(g => g.id !== id).map(g => formatGame(g, userId)));
    const commentsWithLikes = comments.map(c => ({ ...c, isLiked: false, likesCount: c.likesCount || 0 }));

    return res.json({ ...formatted, comments: commentsWithLikes, relatedGames: formattedRelated });
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
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
    if (!game) return res.status(404).json({ error: "Bulunamadı" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (game.uploaderId !== userId && !user?.isAdmin) return res.status(403).json({ error: "Yetkisiz" });
    await db.delete(gamesTable).where(eq(gamesTable.id, id));
    return res.json({ success: true, message: "Oyun silindi" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/:id/play", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(gamesTable).set({ playsCount: sql`${gamesTable.playsCount} + 1` }).where(eq(gamesTable.id, id));
    return res.json({ success: true });
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
      and(eq(likesTable.userId, userId), eq(likesTable.targetType, "game"), eq(likesTable.targetId, id))
    ).limit(1);

    if (existing.length > 0) {
      await db.delete(likesTable).where(eq(likesTable.id, existing[0].id));
      await db.update(gamesTable).set({ likesCount: sql`${gamesTable.likesCount} - 1` }).where(eq(gamesTable.id, id));
      const [g] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
      return res.json({ liked: false, likesCount: g?.likesCount ?? 0 });
    } else {
      await db.insert(likesTable).values({ userId, targetType: "game", targetId: id });
      await db.update(gamesTable).set({ likesCount: sql`${gamesTable.likesCount} + 1` }).where(eq(gamesTable.id, id));
      const [g] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
      return res.json({ liked: true, likesCount: g?.likesCount ?? 0 });
    }
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/:id/comments", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { commentsTable } = await import("@workspace/db/schema");
    const comments = await db.select().from(commentsTable)
      .where(and(eq(commentsTable.targetType, "game"), eq(commentsTable.targetId, id)))
      .orderBy(desc(commentsTable.createdAt));
    const formatted = comments.map(c => ({ ...c, isLiked: false }));
    return res.json({ comments: formatted, total: formatted.length });
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
    if (!content) return res.status(400).json({ error: "İçerik boş olamaz" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const { commentsTable } = await import("@workspace/db/schema");
    const [comment] = await db.insert(commentsTable).values({
      content,
      targetType: "game",
      targetId: id,
      authorId: userId,
      authorName: user?.displayName || user?.username || "Kullanıcı",
      authorAvatar: user?.avatar,
    }).returning();
    await db.update(gamesTable).set({ commentsCount: sql`${gamesTable.commentsCount} + 1` }).where(eq(gamesTable.id, id));
    return res.status(201).json({ ...comment, isLiked: false });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
