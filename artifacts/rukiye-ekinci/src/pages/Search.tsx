import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSearchAll } from "@workspace/api-client-react";
import { Search as SearchIcon, Gamepad2, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const trendingTags = ["Aksiyon", "Macera", "Bulmaca", "Strateji", "Spor", "RPG", "Platform", "Yarış"];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "games" | "users">("all");
  const { data, isLoading } = useSearchAll({ q: query });

  const hasQuery = query.trim().length > 0;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Keşfet & Ara</h1>
          <p className="text-muted-foreground text-sm">Oyun ve içerik bul</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Oyun, kullanıcı veya etiket ara..."
            className="pl-12 pr-12 h-14 text-base rounded-2xl bg-secondary/30 border-white/10 focus-visible:ring-primary/50"
            autoFocus
          />
          {hasQuery && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {hasQuery && (
          <div className="flex gap-2 mb-6">
            {[
              { key: "all", label: "Tümü" },
              { key: "games", label: "Oyunlar" },
              { key: "users", label: "Kullanıcılar" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key as any)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeFilter === key
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!hasQuery ? (
            <motion.div
              key="discover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Trending Tags */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Popüler Etiketler</h2>
                <div className="flex flex-wrap gap-3">
                  {trendingTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-4 py-2 rounded-xl bg-secondary/30 border border-white/5 text-white text-sm font-medium hover:bg-primary/20 hover:border-primary/40 transition-all"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hint */}
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                  <SearchIcon className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground">Aramak istediğiniz şeyi yazın</p>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="glass-card rounded-2xl p-4 animate-pulse flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary/60" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-1/2 bg-secondary/60 rounded" />
                      <div className="h-3 w-1/3 bg-secondary/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Games Results */}
              {(activeFilter === "all" || activeFilter === "games") && (
                <div>
                  <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" /> Oyunlar
                  </h2>
                  {!data?.games?.length ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">"{query}" için oyun bulunamadı.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {data.games.map((game: any) => (
                        <Link key={game.id} href={`/oyun/${game.id}`}>
                          <div className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-primary/40 transition-all group cursor-pointer">
                            <div className="relative h-32">
                              <img
                                src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"}
                                alt={game.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                              <div className="absolute bottom-2 left-2">
                                <span className="px-2 py-0.5 rounded bg-primary/30 text-primary text-xs font-bold border border-primary/20 backdrop-blur-sm">
                                  {game.category}
                                </span>
                              </div>
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-white text-sm truncate">{game.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">@{game.uploaderName}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Results */}
              {(activeFilter === "all" || activeFilter === "users") && (
                <div>
                  <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Kullanıcılar
                  </h2>
                  {!data?.users?.length ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">"{query}" için kullanıcı bulunamadı.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.users.map((user: any) => (
                        <Link key={user.id} href={`/profil/${user.id}`}>
                          <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all shrink-0">
                              <img
                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{user.displayName || user.username}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-white">{user.gamesCount}</p>
                              <p className="text-xs text-muted-foreground">oyun</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}
