import { Shell } from "@/components/layout/Shell";
import { useGetUserProfile, useFollowUser } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Grid, Image, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { id } = useParams();
  const userId = parseInt(id || "1"); // fallback to 1 if not provided
  const { data: profile, isLoading } = useGetUserProfile(userId);
  const { mutate: follow } = useFollowUser();
  const [activeTab, setActiveTab] = useState<"games" | "posts">("games");

  if (isLoading) return <Shell><div className="p-8 text-center">Yükleniyor...</div></Shell>;
  if (!profile) return <Shell><div className="p-8 text-center text-destructive">Kullanıcı bulunamadı.</div></Shell>;

  const { user, games, posts, isFollowing } = profile;

  return (
    <Shell>
      <div className="w-full">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary/40 to-accent/40 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20">
          {/* Profile Header */}
          <div className="glass-card rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-secondary shrink-0 shadow-2xl">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                  alt={user.displayName || user.username} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-display font-bold text-white">{user.displayName || user.username}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="text-zinc-300 mt-2 max-w-md">{user.bio || "Henüz bir biyografi eklemedi."}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant={isFollowing ? "outline" : "default"} 
                className="rounded-full px-8"
                onClick={() => follow({ id: user.id })}
              >
                {isFollowing ? "Takibi Bırak" : "Takip Et"}
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-8 bg-secondary/20 rounded-2xl p-4 border border-white/5">
            <StatItem value={user.gamesCount} label="Oyunlar" />
            <StatItem value={user.postsCount} label="Gönderiler" />
            <StatItem value={user.followersCount} label="Takipçi" />
            <StatItem value={user.followingCount} label="Takip" />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            <button 
              onClick={() => setActiveTab("games")}
              className={cn("pb-4 text-sm font-semibold transition-colors relative", activeTab === "games" ? "text-primary" : "text-muted-foreground")}
            >
              <span className="flex items-center gap-2"><Grid className="w-4 h-4" /> Oyunları</span>
              {activeTab === "games" && <motion className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="tab" />}
            </button>
            <button 
              onClick={() => setActiveTab("posts")}
              className={cn("pb-4 text-sm font-semibold transition-colors relative", activeTab === "posts" ? "text-primary" : "text-muted-foreground")}
            >
              <span className="flex items-center gap-2"><Image className="w-4 h-4" /> Gönderileri</span>
              {activeTab === "posts" && <motion className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="tab" />}
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "games" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {games.map(game => (
                  <div key={game.id} className="aspect-[3/4] rounded-2xl bg-secondary overflow-hidden relative group">
                    <img src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="font-bold text-white truncate">{game.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map(post => (
                  <div key={post.id} className="aspect-square bg-secondary relative">
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-muted-foreground bg-secondary/50 border border-white/5">
                        {post.content?.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function StatItem({ value, label }: { value: number, label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

import { motion } from "framer-motion";
