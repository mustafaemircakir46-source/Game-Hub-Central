import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, gamesTable, postsTable, commentsTable, settingsTable, notificationsTable } from "@workspace/db/schema";
import { eq, sql, desc, ilike, and, or } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const ADMIN_PASSWORD = "mustafa4606";
const adminSessions = new Set<string>();

function generateAdminToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function isAdmin(req: any): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "").replace("Admin ", "");
  return adminSessions.has(token);
}

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Yanlış şifre" });
  }
  const token = generateAdminToken();
  adminSessions.add(token);
  return res.json({ success: true, token });
});

router.get("/stats", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [totalGames] = await db.select({ count: sql<number>`count(*)` }).from(gamesTable);
    const [totalPosts] = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
    const [pendingGames] = await db.select({ count: sql<number>`count(*)` }).from(gamesTable).where(eq(gamesTable.status, "pending"));
    const [totalPlays] = await db.select({ total: sql<number>`sum(plays_count)` }).from(gamesTable);
    const [totalLikes] = await db.select({ total: sql<number>`sum(likes_count)` }).from(gamesTable);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [newUsersToday] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(sql`created_at >= ${today}`);
    const [newGamesToday] = await db.select({ count: sql<number>`count(*)` }).from(gamesTable).where(sql`created_at >= ${today}`);

    const topGames = await db.select().from(gamesTable)
      .where(eq(gamesTable.status, "approved"))
      .orderBy(desc(gamesTable.playsCount))
      .limit(5);

    const recentUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(3);
    const recentGames = await db.select().from(gamesTable).orderBy(desc(gamesTable.createdAt)).limit(3);

    const recentActivity = [
      ...recentUsers.map(u => ({ type: "user", message: `Yeni kullanıcı: ${u.displayName || u.username}`, createdAt: u.createdAt.toISOString() })),
      ...recentGames.map(g => ({ type: "game", message: `Yeni oyun: ${g.title} (${g.status})`, createdAt: g.createdAt.toISOString() })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return res.json({
      totalUsers: Number(totalUsers.count),
      totalGames: Number(totalGames.count),
      totalPosts: Number(totalPosts.count),
      pendingGames: Number(pendingGames.count),
      totalPlays: Number(totalPlays.total) || 0,
      totalLikes: Number(totalLikes.total) || 0,
      newUsersToday: Number(newUsersToday.count),
      newGamesToday: Number(newGamesToday.count),
      topGames: topGames.map(g => ({ ...g, isLiked: false })),
      recentActivity,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/games/pending", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const games = await db.select().from(gamesTable).where(eq(gamesTable.status, "pending")).orderBy(desc(gamesTable.createdAt));
    return res.json({ games: games.map(g => ({ ...g, isLiked: false })), total: games.length, page: 1, totalPages: 1 });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/games/:id/approve", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const id = parseInt(req.params.id);
    await db.update(gamesTable).set({ status: "approved" }).where(eq(gamesTable.id, id));
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
    if (game) {
      await db.insert(notificationsTable).values({
        userId: game.uploaderId,
        type: "game_approved",
        message: `"${game.title}" oyununuz onaylandı!`,
        isRead: 0,
        relatedId: game.id,
        relatedType: "game",
      });
    }
    return res.json({ success: true, message: "Oyun onaylandı" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/games/:id/reject", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;
    await db.update(gamesTable).set({ status: "rejected", rejectionReason: reason }).where(eq(gamesTable.id, id));
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
    if (game) {
      await db.insert(notificationsTable).values({
        userId: game.uploaderId,
        type: "game_rejected",
        message: `"${game.title}" oyununuz reddedildi. Sebep: ${reason}`,
        isRead: 0,
        relatedId: game.id,
        relatedType: "game",
      });
    }
    return res.json({ success: true, message: "Oyun reddedildi" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/users", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const { page = 1, search } = req.query as any;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;

    const conditions: any[] = [];
    if (search) {
      conditions.push(or(ilike(usersTable.username, `%${search}%`), ilike(usersTable.email, `%${search}%`)));
    }

    const users = await db.select().from(usersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const safeUsers = users.map(u => { const { passwordHash: _, ...s } = u; return s; });
    return res.json({ users: safeUsers, total: Number(total[0].count), page: parseInt(page), totalPages: Math.ceil(Number(total[0].count) / limit) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/users/:id/ban", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const id = parseInt(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) return res.status(404).json({ error: "Bulunamadı" });
    await db.update(usersTable).set({ isBanned: !user.isBanned }).where(eq(usersTable.id, id));
    return res.json({ success: true, message: user.isBanned ? "Engel kaldırıldı" : "Kullanıcı engellendi" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/posts", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const { page = 1 } = req.query as any;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    const posts = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(limit).offset(offset);
    const total = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
    return res.json({ posts: posts.map(p => ({ ...p, isLiked: false })), total: Number(total[0].count), page: parseInt(page), totalPages: Math.ceil(Number(total[0].count) / limit) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.delete("/content/:type/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const { type, id } = req.params;
    const numId = parseInt(id);
    if (type === "game") await db.delete(gamesTable).where(eq(gamesTable.id, numId));
    else if (type === "post") await db.delete(postsTable).where(eq(postsTable.id, numId));
    else if (type === "comment") await db.delete(commentsTable).where(eq(commentsTable.id, numId));
    else return res.status(400).json({ error: "Geçersiz tür" });
    return res.json({ success: true, message: "İçerik silindi" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/settings", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const settings = await db.select().from(settingsTable);
    const map: any = {
      siteName: "RUKİYE EKİNCİ",
      siteDescription: "Türkiye'nin en kapsamlı oyun platformu",
      allowRegistration: true,
      requireGameApproval: true,
      maxFileSize: 100,
      featuredGameId: null,
      maintenanceMode: false,
    };
    settings.forEach(s => {
      try { map[s.key] = JSON.parse(s.value); } catch { map[s.key] = s.value; }
    });
    return res.json(map);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.put("/settings", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const body = req.body;
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
      const strValue = JSON.stringify(value);
      if (existing.length > 0) {
        await db.update(settingsTable).set({ value: strValue, updatedAt: new Date() }).where(eq(settingsTable.key, key));
      } else {
        await db.insert(settingsTable).values({ key, value: strValue });
      }
    }
    return res.json(body);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
