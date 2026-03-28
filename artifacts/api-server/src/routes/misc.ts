import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { gamesTable, postsTable, usersTable, notificationsTable } from "@workspace/db/schema";
import { eq, or, ilike, desc, sql, and } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return sessions.get(token) ?? null;
}

router.get("/search", async (req, res) => {
  try {
    const { q, type = "all" } = req.query as any;
    if (!q) return res.status(400).json({ error: "Arama terimi gerekli" });

    let games: any[] = [];
    let users: any[] = [];
    let posts: any[] = [];

    if (type === "all" || type === "games") {
      games = await db.select().from(gamesTable)
        .where(and(eq(gamesTable.status, "approved"), ilike(gamesTable.title, `%${q}%`)))
        .limit(10);
      games = games.map(g => ({ ...g, isLiked: false }));
    }

    if (type === "all" || type === "users") {
      const rawUsers = await db.select().from(usersTable)
        .where(or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.displayName, `%${q}%`)))
        .limit(10);
      users = rawUsers.map(u => { const { passwordHash: _, ...s } = u; return s; });
    }

    if (type === "all" || type === "posts") {
      posts = await db.select().from(postsTable)
        .where(ilike(postsTable.content, `%${q}%`))
        .limit(10);
      posts = posts.map(p => ({ ...p, isLiked: false }));
    }

    const total = games.length + users.length + posts.length;
    return res.json({ games, users, posts, total });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Arama hatası" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const topGames = await db.select().from(gamesTable)
      .where(eq(gamesTable.status, "approved"))
      .orderBy(desc(gamesTable.playsCount), desc(gamesTable.likesCount))
      .limit(10);

    const topPlayers = await db.select().from(usersTable)
      .orderBy(desc(usersTable.gamesCount), desc(usersTable.followersCount))
      .limit(10);

    const safeTopPlayers = topPlayers.map(u => { const { passwordHash: _, ...s } = u; return s; });
    return res.json({ topGames: topGames.map(g => ({ ...g, isLiked: false })), topPlayers: safeTopPlayers });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Liderboard hatası" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const formatted = notifications.map(n => ({
      ...n,
      isRead: Boolean(n.isRead),
    }));

    return res.json({ notifications: formatted, unreadCount });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Bildirim hatası" });
  }
});

export default router;
