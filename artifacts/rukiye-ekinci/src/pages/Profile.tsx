import { Shell } from "@/components/layout/Shell";
import { useGetUserProfile, useFollowUser } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Grid, FileText, GamepadIcon, Users, Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

export default function Profile() {
  const { id } = useParams();
  const userId = parseInt(id || "1");
  const { data: profile, isLoading } = useGetUserProfile(userId);
  const { mutate: follow } = useFollowUser();
  const [activeTab, setActiveTab] = useState<"games" | "posts">("games");

  if (isLoading) {
    return (
      <Shell>
        <div className="w-full animate-pulse">
          <div className="h-48 md:h-64 bg-secondary/50" />
          <div className="max-w-4xl mx-auto px-4 -mt-16 space-y-6">
            <div className="glass-card rounded-3xl p-6 flex gap-6 items-end">
              <div className="w-32 h-32 rounded-full bg-secondary/60 shrink-0" />
              <div className="space-y-2 pb-2">
                <div className="h-6 w-40 bg-secondary/60 rounded" />
                <div className="h-4 w-24 bg-secondary/40 rounded" />
                <div className="h-4 w-60 bg-secondary/30 rounded" />
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-semibold text-zinc-400">Kullanıcı bulunamadı.</p>
        </div>
      </Shell>
    );
  }

  const { user, games, posts, isFollowing } = profile;

  return (
    <Shell>
      <div className="w-full">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-accent/40 to-blue-900/60" />
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(120,40,200,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(40,80,200,0.4) 0%, transparent 50%)"
          }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6 mb-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 relative z-10 border border-white/10"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-secondary shrink-0 shadow-2xl shadow-primary/20 ring-2 ring-primary/30">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.displayName || user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-display font-bold text-white">{user.displayName || user.username}</h1>
                <p className="text-muted-foreground mb-2">@{user.username}</p>
                <p className="text-zinc-300 max-w-md text-sm leading-relaxed">
                  {user.bio || "Henüz bir biyografi eklenmedi."}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant={isFollowing ? "outline" : "default"}
                className="rounded-full px-8 font-semibold"
                onClick={() => follow({ id: user.id })}
              >
                {isFollowing ? "Takibi Bırak" : "Takip Et"}
              </Button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-3 mb-8"
          >
            {[
              { value: user.gamesCount, label: "Oyunlar", icon: GamepadIcon },
              { value: user.postsCount, label: "Gönderiler", icon: FileText },
              { value: user.followersCount, label: "Takipçi", icon: Users },
              { value: user.followingCount, label: "Takip", icon: Users },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="glass-card rounded-2xl p-4 text-center border border-white/5 hover:border-primary/30 transition-colors">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-secondary/20 rounded-2xl p-1 border border-white/5">
            {[
              { key: "games", label: "Oyunları", icon: Grid },
              { key: "posts", label: "Gönderileri", icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
                  activeTab === key
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[400px] pb-8"
            >
              {activeTab === "games" ? (
                games.length === 0 ? (
                  <EmptyState icon={GamepadIcon} message="Henüz yüklenen oyun yok." />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {games.map(game => (
                      <Link key={game.id} href={`/oyun/${game.id}`}>
                        <div className="aspect-[3/4] rounded-2xl bg-secondary overflow-hidden relative group cursor-pointer border border-white/5 hover:border-primary/40 transition-colors">
                          <img
                            src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt=""
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="font-bold text-white text-sm truncate">{game.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1 text-xs text-white/70">
                                <Heart className="w-3 h-3" /> {game.likesCount}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-white/70">
                                <Play className="w-3 h-3" /> {game.playsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              ) : (
                posts.length === 0 ? (
                  <EmptyState icon={FileText} message="Henüz gönderi paylaşılmadı." />
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {posts.map(post => (
                      <div key={post.id} className="aspect-square bg-secondary relative rounded-lg overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/40 transition-colors">
                        {post.mediaUrl ? (
                          <img src={post.mediaUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-muted-foreground bg-secondary/50">
                            {post.content?.substring(0, 80)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Shell>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
