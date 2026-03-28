import { Link, useLocation } from "wouter";
import { Home, LayoutGrid, PlusSquare, ImagePlay, User, Sparkles, Search, Bell } from "lucide-react";
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

  const navItems = [
    { href: "/", icon: Home, label: "Keşfet" },
    { href: "/yatay-oyunlar", icon: LayoutGrid, label: "Yatay" },
    { href: "/yukle", icon: PlusSquare, label: "Yükle", isAction: true },
    { href: "/sosyal", icon: ImagePlay, label: "Sosyal" },
    { href: user ? `/profil/${user.id}` : "/giris", icon: User, label: "Profil" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col w-full max-w-md mx-auto md:max-w-none md:flex-row relative">
      {/* Top Navigation */}
      {!hideTopNav && (
        <header className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 md:max-w-md md:mx-auto lg:max-w-none transition-all duration-300",
          transparentTop ? "bg-gradient-to-b from-black/80 to-transparent" : "glass"
        )}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-display font-bold text-white text-sm">RE</span>
            </div>
            <span className="font-display font-bold text-lg hidden sm:block tracking-tight text-white">
              RUKİYE EKİNCİ
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Link href="/arama" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/bildirimler" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
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

      {/* Floating AI Button */}
      <Link href="/ai">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-primary via-accent to-blue-500 p-[2px] shadow-lg shadow-primary/30 cursor-pointer"
        >
          <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </motion.div>
      </Link>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 glass flex items-center justify-around px-2 pb-safe md:hidden max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-16 h-full relative">
                {item.isAction ? (
                  <div className="absolute -top-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 text-white transform rotate-3 hover:rotate-6 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <item.icon className={cn("w-6 h-6 mb-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      {!hideBottomNav && (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 lg:w-64 glass z-40 pt-24 px-4 pb-8">
          <nav className="flex flex-col gap-4 flex-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    item.isAction && "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                  )}
                >
                  <item.icon className={cn("w-6 h-6", isActive && !item.isAction ? "text-primary" : "")} />
                  <span className={cn("font-medium hidden lg:block", item.isAction && "font-bold")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}
    </div>
  );
}
