import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, gamesTable, postsTable, followsTable } from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return sessions.get(token) ?? null;
}

router.get("/me/profile", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "Bulunamadı" });
    const { passwordHash: _, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.put("/me/profile", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    const { displayName, bio, avatar } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ displayName, bio, avatar })
      .where(eq(usersTable.id, userId))
      .returning();
    const { passwordHash: _, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const currentUserId = getUserId(req);
    const id = parseInt(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    const games = await db.select().from(gamesTable)
      .where(and(eq(gamesTable.uploaderId, id), eq(gamesTable.status, "approved")))
      .orderBy(desc(gamesTable.createdAt))
      .limit(12);

    const posts = await db.select().from(postsTable)
      .where(eq(postsTable.authorId, id))
      .orderBy(desc(postsTable.createdAt))
      .limit(12);

    let isFollowing = false;
    if (currentUserId && currentUserId !== id) {
      const follow = await db.select().from(followsTable)
        .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, id)))
        .limit(1);
      isFollowing = follow.length > 0;
    }

    const { passwordHash: _, ...safeUser } = user;
    const formattedGames = games.map(g => ({ ...g, isLiked: false }));
    const formattedPosts = posts.map(p => ({ ...p, isLiked: false }));

    return res.json({ user: safeUser, games: formattedGames, posts: formattedPosts, isFollowing });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/:id/follow", async (req, res) => {
  try {
    const currentUserId = getUserId(req);
    if (!currentUserId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    const id = parseInt(req.params.id);
    if (currentUserId === id) return res.status(400).json({ error: "Kendinizi takip edemezsiniz" });

    const existing = await db.select().from(followsTable)
      .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, id)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(followsTable).where(eq(followsTable.id, existing[0].id));
      await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} - 1` }).where(eq(usersTable.id, id));
      await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} - 1` }).where(eq(usersTable.id, currentUserId));
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      return res.json({ following: false, followersCount: u?.followersCount ?? 0 });
    } else {
      await db.insert(followsTable).values({ followerId: currentUserId, followingId: id });
      await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} + 1` }).where(eq(usersTable.id, id));
      await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(eq(usersTable.id, currentUserId));
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      return res.json({ following: true, followersCount: u?.followersCount ?? 0 });
    }
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
