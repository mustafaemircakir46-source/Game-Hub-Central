# RUKİYE EKİNCİ - Oyun Platformu

## Overview

Kapsamlı Türkçe oyun platformu - Instagram/TikTok tarzı keşfet, oyun yükleme, sosyal medya, AI asistan ve gizli admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS + Framer Motion + Zustand
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini, gpt-image-1)
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Structure

```text
artifacts/
├── api-server/          # Express API server
└── rukiye-ekinci/       # React frontend (served at /)
lib/
├── api-spec/            # OpenAPI spec + Orval codegen config
├── api-client-react/    # Generated React Query hooks
├── api-zod/             # Generated Zod schemas
├── db/                  # Drizzle ORM schema + DB connection
└── integrations-openai-ai-server/  # OpenAI client wrapper
```

## Features

### Frontend Pages (Turkish)
- `/` - Keşfet (TikTok-style vertical feed with like/comment/share)
- `/yatay-oyunlar` - Yatay Oyunlar (horizontal games grid)
- `/oyun/:id` - Oyun Detay (game detail + play + comments)
- `/yukle` - Oyun Yükleme (drag & drop upload, URL, video)
- `/sosyal` - Sosyal Medya Feed (posts, photos, videos)
- `/profil/:id` - Kullanıcı Profili (follow, games, posts tabs)
- `/ai` - AI Asistan (chat, game generator, poster, article)
- `/arama` - Arama
- `/liderboard` - Liderboard
- `/bildirimler` - Bildirimler
- `/giris`, `/kayit` - Auth pages
- `/admin` - **GİZLİ** Admin Panel (password: mustafa4606)

### Backend API Routes
- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- `GET/POST /api/games`, `GET /api/games/horizontal|trending|recommended`
- `GET/DELETE /api/games/:id`, `POST /api/games/:id/like|play|comments`
- `GET/POST /api/posts`, `POST /api/posts/:id/like|comments`
- `GET /api/users/:id`, `POST /api/users/:id/follow`, `PUT /api/users/me/profile`
- `POST /api/ai/chat|generate-game|generate-poster|generate-article`, `GET /api/ai/recommendations`
- `POST /api/admin/login` (password: mustafa4606)
- `GET /api/admin/stats|games/pending|users|posts`
- `POST /api/admin/games/:id/approve|reject`, `POST /api/admin/users/:id/ban`
- `DELETE /api/admin/content/:type/:id`, `GET/PUT /api/admin/settings`
- `GET /api/search?q=`, `GET /api/leaderboard`, `GET /api/notifications`

## Admin Panel
- URL: `/admin` (no links to it in the UI)
- Password: `mustafa4606`
- Full control: users, games, posts, comments, settings

## Database Schema
- `users` - User accounts with follow/game/post counts
- `games` - Games with status (pending/approved/rejected), orientation (vertical/horizontal)
- `posts` - Social media posts (photo/video/article/text)
- `comments` - Comments on games and posts
- `likes` - Likes on games, posts, comments
- `follows` - User follow relationships
- `notifications` - In-app notifications
- `settings` - Platform settings (key-value store)

## AI Integration
- Uses Replit AI Integrations for OpenAI (no user API key needed)
- Environment variables: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Models: `gpt-5-mini` for chat/text, `gpt-image-1` for posters

## Auth
- Token-based auth stored in memory (sessions Map)
- Tokens stored in localStorage on frontend
- Admin has separate token system

## Codegen
Run after changing `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## Database
```bash
pnpm --filter @workspace/db run push
```
