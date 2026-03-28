import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "rukiye_salt_2024").digest("hex");
}

function generateToken(userId: number): string {
  const payload = `${userId}:${Date.now()}:${Math.random()}`;
  return Buffer.from(payload).toString("base64");
}

const sessions = new Map<string, number>();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Eksik alan", message: "Kullanıcı adı, email ve şifre zorunludur" });
    }
    const existing = await db.select().from(usersTable).where(
      or(eq(usersTable.username, username), eq(usersTable.email, email))
    ).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Zaten kayıtlı", message: "Bu kullanıcı adı veya email zaten kullanılıyor" });
    }
    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash: hashPassword(password),
      displayName: displayName || username,
      isAdmin: false,
      isBanned: false,
      followersCount: 0,
      followingCount: 0,
      gamesCount: 0,
      postsCount: 0,
    }).returning();
    const token = generateToken(user.id);
    sessions.set(token, user.id);
    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "Eksik alan" });
    }
    const [user] = await db.select().from(usersTable).where(
      or(eq(usersTable.email, emailOrUsername), eq(usersTable.username, emailOrUsername))
    ).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Hatalı giriş", message: "Email/kullanıcı adı veya şifre yanlış" });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: "Hesap askıya alındı" });
    }
    const token = generateToken(user.id);
    sessions.set(token, user.id);
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    sessions.delete(token);
  }
  return res.json({ success: true, message: "Çıkış yapıldı" });
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Yetkisiz" });
    const token = authHeader.replace("Bearer ", "");
    const userId = sessions.get(token);
    if (!userId) return res.status(401).json({ error: "Geçersiz token" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    const { passwordHash: _, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export { sessions };
export default router;
