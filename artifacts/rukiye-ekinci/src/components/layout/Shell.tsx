import { Link, useLocation } from "wouter";
import { Home, LayoutGrid, PlusSquare, ImagePlay, User, Sparkles, Search, Bell, Trophy, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";

interface ShellProps {
  children: React.ReactNode;
  hideTopNav?: boolean;
  hideBottomNav?: boolean;
  transparentTop?: boolean;
}

export function Shell({ children, hideTopNav, hideBottomNav, transparentTop }: ShellProps) {
  const [location] = useLocation();
  const { user } = useAuthStore();

  const mobileNavItems = [
    { href: "/", icon: Home, label: "Keşfet" },
    { href: "/yatay-oyunlar", icon: LayoutGrid, label: "Yatay" },
    { href: "/yukle", icon: PlusSquare, label: "Yükle", isAction: true },
    { href: "/sosyal", icon: ImagePlay, label: "Sosyal" },
    { href: user ? `/profil/${user.id}` : "/giris", icon: User, label: "Profil" },
  ];

  const sidebarMain = [
    { href: "/", icon: Home, label: "Keşfet" },
    { href: "/yatay-oyunlar", icon: LayoutGrid, label: "Yatay Oyunlar" },
    { href: "/yukle", icon: PlusSquare, label: "Oyun Yükle", isAction: true },
    { href: "/sosyal", icon: ImagePlay, label: "Sosyal" },
    { href: user ? `/profil/${user.id}` : "/giris", icon: User, label: "Profil" },
  ];

  const sidebarExtra = [
    { href: "/mesajlar", icon: MessageSquare, label: "Mesajlar" },
    { href: "/arama", icon: Search, label: "Ara" },
    { href: "/liderboard", icon: Trophy, label: "Liderboard" },
    { href: "/bildirimler", icon: Bell, label: "Bildirimler" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col w-full max-w-md mx-auto md:max-w-none md:flex-row relative">
      {/* Top Navigation */}
      {!hideTopNav && (
        <header className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 md:max-w-md md:mx-auto lg:max-w-none transition-all duration-300",
          transparentTop ? "bg-gradient-to-b from-black/80 to-transparent backdrop-blur-none" : "glass border-b border-white/5"
        )}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30">
              <span className="font-display font-black text-white text-xs">RE</span>
            </div>
            <span className="font-display font-bold text-lg hidden sm:block tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              RUKİYE EKİNCİ
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/mesajlar" className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <Link href="/arama" className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/bildirimler" className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
            </Link>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full relative",
        !hideTopNav && !transparentTop && "pt-16",
        !hideBottomNav && "pb-20 md:pb-0 md:pl-20 lg:pl-64"
      )}>
        {children}
      </main>

      {/* Floating AI Button (mobile only) */}
      <Link href="/ai" className="md:hidden">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-tr from-primary via-accent to-blue-500 p-[2px] shadow-lg shadow-primary/30 cursor-pointer"
        >
          <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      </Link>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-[4.5rem] glass border-t border-white/5 flex items-center justify-around px-2 md:hidden max-w-md mx-auto safe-area-inset-bottom">
          {mobileNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-14 h-full relative">
                {item.isAction ? (
                  <div className="absolute -top-4 flex items-center justify-center w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40 text-white">
                    <item.icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <item.icon className={cn("w-6 h-6 mb-0.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                    </motion.div>
                    <span className={cn("text-[9px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute -bottom-0 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Desktop Sidebar */}
      {!hideBottomNav && (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 lg:w-64 glass border-r border-white/5 z-40 pt-20 px-3 pb-4">
          {/* Logo in sidebar (desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-display font-black text-white text-xs">RE</span>
            </div>
            <span className="font-display font-bold text-white text-sm">RUKİYE EKİNCİ</span>
          </div>

          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {sidebarMain.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    item.isAction && "bg-gradient-to-r from-primary/80 to-accent/80 text-white hover:from-primary hover:to-accent mt-1 mb-1"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive && !item.isAction ? "text-primary" : "")} />
                  <span className={cn("text-sm font-medium hidden lg:block truncate", item.isAction && "font-bold")}>
                    {item.label}
                  </span>
                  {isActive && !item.isAction && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="border-t border-white/5 my-3 mx-2" />

            {sidebarExtra.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "")} />
                  <span className="text-sm font-medium hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* AI at bottom */}
          <Link
            href="/ai"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all border mt-2",
              location === "/ai"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-white/10"
            )}
          >
            <Sparkles className="w-5 h-5 shrink-0 text-primary" />
            <span className="text-sm font-medium hidden lg:block">AI Asistanı</span>
          </Link>
        </aside>
      )}
    </div>
  );
}
