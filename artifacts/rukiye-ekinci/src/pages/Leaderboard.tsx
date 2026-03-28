import { Shell } from "@/components/layout/Shell";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Trophy, Medal, Star, Gamepad2, Users, Crown } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data, isLoading } = useGetLeaderboard();

  const topThree = data?.users?.slice(0, 3) || [];
  const rest = data?.users?.slice(3) || [];

  const medalColors = [
    "from-yellow-400 to-yellow-600 shadow-yellow-500/30",
    "from-zinc-300 to-zinc-500 shadow-zinc-400/30",
    "from-amber-600 to-amber-800 shadow-amber-700/30",
  ];

  const medalIcons = [Crown, Medal, Medal];

  return (
    <Shell>
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-amber-600/30 flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Liderboard</h1>
          <p className="text-muted-foreground mt-2 text-sm">En çok beğenilen ve oynanan oyunların sahipleri</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="glass-card rounded-2xl p-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/60" />
                <div className="w-12 h-12 rounded-full bg-secondary/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-secondary/60 rounded" />
                  <div className="h-3 w-1/4 bg-secondary/40 rounded" />
                </div>
                <div className="h-6 w-16 bg-secondary/40 rounded" />
              </div>
            ))}
          </div>
        ) : !data?.users?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
              <Users className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-400">Henüz liderboard boş</p>
              <p className="text-sm text-muted-foreground mt-1">Oyun yükle ve öne çık!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-8 pt-4">
                {[topThree[1], topThree[0], topThree[2]].map((user, podiumIndex) => {
                  if (!user) return <div key={podiumIndex} className="flex-1" />;
                  const actualRank = podiumIndex === 0 ? 1 : podiumIndex === 1 ? 0 : 2;
                  const MedalIcon = medalIcons[actualRank];
                  const heights = ["h-32", "h-40", "h-28"];

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: podiumIndex * 0.1 }}
                      className="flex-1 flex flex-col items-center gap-3"
                    >
                      <Link href={`/profil/${user.id}`}>
                        <div className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-gradient-to-br text-white flex items-center justify-center text-xs font-bold",
                            medalColors[actualRank]
                          )}>
                          </div>
                          <div className={cn(
                            "w-14 h-14 rounded-full overflow-hidden ring-4 ring-offset-2 ring-offset-background shadow-lg",
                            actualRank === 0 ? "ring-yellow-400 w-16 h-16" : actualRank === 1 ? "ring-zinc-400" : "ring-amber-600"
                          )}>
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-white text-sm truncate max-w-20">{user.displayName || user.username}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </Link>

                      <div className={cn(
                        "w-full rounded-t-2xl flex flex-col items-center justify-center gap-1 bg-gradient-to-br border border-white/5",
                        heights[podiumIndex],
                        actualRank === 0 ? "from-yellow-500/20 to-yellow-900/20 border-yellow-500/20" :
                        actualRank === 1 ? "from-zinc-400/20 to-zinc-700/20 border-zinc-400/20" :
                        "from-amber-700/20 to-amber-900/20 border-amber-700/20"
                      )}>
                        <MedalIcon className={cn("w-6 h-6", actualRank === 0 ? "text-yellow-400" : actualRank === 1 ? "text-zinc-300" : "text-amber-600")} />
                        <span className={cn("text-2xl font-display font-black", actualRank === 0 ? "text-yellow-400" : actualRank === 1 ? "text-zinc-300" : "text-amber-600")}>
                          #{actualRank + 1}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{user.gamesCount} oyun</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Remaining Ranks */}
            {rest.length > 0 && (
              <div className="space-y-3">
                {rest.map((user: any, index: number) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/profil/${user.id}`}>
                      <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                        <span className="text-xl font-display font-black text-muted-foreground/40 w-8 text-center">
                          #{index + 4}
                        </span>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary ring-2 ring-white/10 group-hover:ring-primary/40 transition-all shrink-0">
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
                          <div className="flex items-center gap-1">
                            <Gamepad2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-white">{user.gamesCount}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">oyun</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
