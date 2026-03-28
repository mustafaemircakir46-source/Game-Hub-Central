import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { gamesTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

const client = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
});

function getUserId(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return sessions.get(token) ?? null;
}

router.post("/chat", async (req, res) => {
  try {
    const { message, context, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Mesaj boş olamaz" });

    const messages: any[] = [
      {
        role: "system",
        content: `Sen RUKİYE EKİNCİ oyun platformunun yapay zeka asistanısın. Türkçe konuşuyorsun. 
        Kullanıcılara oyun önerileri yapabilir, oyun tasarımı hakkında yardımcı olabilir, 
        oyun geliştirme konusunda rehberlik edebilir, poster ve makale oluşturmaya yardım edebilirsin.
        Her zaman yardımsever, samimi ve profesyonel ol. Kısa ve öz cevaplar ver.
        ${context ? `Bağlam: ${context}` : ""}`,
      },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || "Üzgünüm, bir yanıt oluşturamadım.";

    const suggestions = [
      "Oyun nasıl yapılır?",
      "En popüler oyun türleri nelerdir?",
      "Oyun için poster oluştur",
      "Oyun makalesi yaz",
    ];

    return res.json({ response, suggestions });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "AI servisi şu an müsait değil" });
  }
});

router.post("/generate-game", async (req, res) => {
  try {
    const { description, genre = "genel", orientation = "vertical", additionalInstructions = "" } = req.body;
    if (!description) return res.status(400).json({ error: "Açıklama gerekli" });

    const prompt = `HTML5/JavaScript ile bir ${genre} oyunu oluştur. 
    Oyun açıklaması: ${description}
    Yönlendirme: ${orientation === "horizontal" ? "Yatay (landscape)" : "Dikey (portrait)"}
    ${additionalInstructions ? `Ek talimatlar: ${additionalInstructions}` : ""}
    
    Lütfen tam çalışan bir HTML dosyası oluştur. Sadece HTML kodu ver, başka bir şey yazma.
    Oyun canvas veya DOM tabanlı olabilir. Mobil dostu olsun. Renkleri güzel seç.
    Oyun basit ama eğlenceli olsun. Puan sistemi ekle.`;

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "Sen bir HTML5 oyun geliştiricisin. Sadece çalışan HTML kodu yazıyorsun." },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
    });

    let gameCode = completion.choices[0]?.message?.content || "";
    
    const htmlMatch = gameCode.match(/```html\n?([\s\S]*?)```/);
    if (htmlMatch) gameCode = htmlMatch[1];
    else if (gameCode.includes("<!DOCTYPE html") || gameCode.includes("<html")) {
      const start = gameCode.indexOf("<!DOCTYPE html") !== -1 ? gameCode.indexOf("<!DOCTYPE html") : gameCode.indexOf("<html");
      gameCode = gameCode.substring(start);
    }

    const nameCompletion = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "user", content: `Bu oyun için Türkçe kısa bir isim öner (sadece isim): ${description}` },
      ],
      max_tokens: 30,
    });

    const gameName = nameCompletion.choices[0]?.message?.content?.trim() || "Yeni Oyun";

    return res.json({
      gameCode,
      gameName,
      description,
      instructions: "Oyunu oynamak için tıklayın veya dokunun. İyi eğlenceler!",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Oyun oluşturulamadı" });
  }
});

router.post("/generate-poster", async (req, res) => {
  try {
    const { prompt, style = "gaming", gameTitle = "" } = req.body;
    if (!prompt) return res.status(400).json({ error: "Açıklama gerekli" });

    const imagePrompt = `${gameTitle ? `"${gameTitle}" oyunu için ` : ""}gaming poster: ${prompt}, ${style} style, vibrant colors, professional game art, digital illustration`;

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0]?.url || response.data[0]?.b64_json;
    if (!imageUrl) return res.status(500).json({ error: "Poster oluşturulamadı" });

    return res.json({ imageUrl, prompt: imagePrompt });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Poster oluşturulamadı" });
  }
});

router.post("/generate-article", async (req, res) => {
  try {
    const { topic, tone = "professional", length = "medium" } = req.body;
    if (!topic) return res.status(400).json({ error: "Konu gerekli" });

    const lengthMap: any = { short: 300, medium: 600, long: 1200 };
    const toneMap: any = { professional: "profesyonel", casual: "samimi", exciting: "heyecanlı", informative: "bilgilendirici" };

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `Sen bir oyun gazetecisisin. ${toneMap[tone] || "profesyonel"} bir tonla Türkçe oyun makaleleri yazıyorsun.`,
        },
        {
          role: "user",
          content: `"${topic}" hakkında ${toneMap[tone]} tonda, yaklaşık ${lengthMap[length]} kelimelik bir oyun makalesi yaz. 
          Başlık ve özet de ekle. Format: [BAŞLIK]\n[ÖZET]\n[İÇERİK]`,
        },
      ],
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "";
    const lines = content.split("\n").filter(l => l.trim());
    const title = lines[0]?.replace(/^\[BAŞLIK\]\s*/i, "").replace(/^#+ ?/, "") || topic;
    const summary = lines[1]?.replace(/^\[ÖZET\]\s*/i, "") || "";
    const articleContent = lines.slice(2).join("\n") || content;

    return res.json({ title, content: articleContent, summary });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Makale oluşturulamadı" });
  }
});

router.get("/recommendations", async (req, res) => {
  try {
    const games = await db.select().from(gamesTable)
      .where(eq(gamesTable.status, "approved"))
      .orderBy(sql`RANDOM()`)
      .limit(6);

    return res.json({
      games: games.map(g => ({ ...g, isLiked: false })),
      reason: "Sana özel AI destekli öneriler - en çok oynanan ve beğenilen oyunlar",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Öneriler alınamadı" });
  }
});

export default router;
