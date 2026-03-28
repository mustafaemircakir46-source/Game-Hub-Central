import { Shell } from "@/components/layout/Shell";
import { useGetNotifications } from "@workspace/api-client-react";
import { Bell, Heart, MessageCircle, UserPlus, Gamepad2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function NotificationIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: any; color: string; bg: string }> = {
    like: { icon: Heart, color: "text-red-400", bg: "bg-red-500/20" },
    comment: { icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/20" },
    follow: { icon: UserPlus, color: "text-green-400", bg: "bg-green-500/20" },
    game_approved: { icon: Gamepad2, color: "text-primary", bg: "bg-primary/20" },
  };
  const config = iconMap[type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-secondary/40" };
  const Icon = config.icon;

  return (
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.bg)}>
      <Icon className={cn("w-5 h-5", config.color)} />
    </div>
  );
}

export default function Notifications() {
  const { data, isLoading } = useGetNotifications();
  const unreadCount = data?.notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <Shell>
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Bildirimler</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1 text-sm">{unreadCount} okunmamış bildirim</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="glass-card rounded-2xl p-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/60" />
                <div className="w-12 h-12 rounded-full bg-secondary/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-secondary/60 rounded" />
                  <div className="h-3 w-1/3 bg-secondary/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.notifications?.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
              <Bell className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-400">Henüz bildirim yok</p>
              <p className="text-sm text-muted-foreground mt-1">Etkileşimler burada görünecek.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.notifications.map((notif: any, index: number) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className={cn(
                  "glass-card rounded-2xl p-4 flex items-center gap-4 border transition-all",
                  notif.isRead ? "border-white/5 opacity-70" : "border-primary/20 bg-primary/5"
                )}>
                  <NotificationIcon type={notif.type} />

                  {/* Actor avatar */}
                  {notif.actorAvatar && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0">
                      <img
                        src={notif.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actorName}`}
                        alt={notif.actorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-snug">
                      {notif.message || notif.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.createdAt)}</p>
                  </div>

                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
