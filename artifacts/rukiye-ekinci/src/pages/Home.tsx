import { useState, useRef, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useGetGames, useLikeGame, Game } from "@workspace/api-client-react";
import { Heart, MessageCircle, Share2, Play, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const categories = ["Tümü", "Aksiyon", "Macera", "Bulmaca", "Strateji", "Spor"];
  
  const { data, isLoading, error } = useGetGames({ 
    category: activeCategory !== "Tümü" ? activeCategory : undefined,
    orientation: "vertical",
    sortBy: "trending"
  });

  return (
    <Shell transparentTop hideBottomNav={false}>
      {/* Categories Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar md:max-w-md md:mx-auto lg:max-w-none lg:pl-64">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all backdrop-blur-md",
              activeCategory === cat 
                ? "bg-white text-black" 
                : "bg-black/40 text-white border border-white/10 hover:bg-black/60"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="snap-container bg-black">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
            <p>Oyunlar yüklenirken bir hata oluştu.</p>
          </div>
        ) : data?.games.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>Bu kategoride henüz oyun yok.</p>
          </div>
        ) : (
          data?.games.map((game) => (
            <GameFeedCard key={game.id} game={game} />
          ))
        )}
      </div>
    </Shell>
  );
}

function GameFeedCard({ game }: { game: Game }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(game.isLiked);
  const [likesCount, setLikesCount] = useState(game.likesCount);
  const { mutate: toggleLike } = useLikeGame();
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    toggleLike({ id: game.id });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/oyun/${game.id}`);
    toast({ title: "Bağlantı kopyalandı!", description: "Oyun bağlantısı panoya kopyalandı." });
  };

  return (
    <div className="snap-item relative w-full bg-zinc-900 group">
      {/* Video/Image Background */}
      <div className="absolute inset-0 w-full h-full">
        {game.videoPreview && isPlaying ? (
          <video 
            src={game.videoPreview} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop"} 
            alt={game.title}
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
      </div>

      {/* Play Overlay Button */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={() => setIsPlaying(true)}
        >
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center transform transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Content */}
      <div className="absolute bottom-20 md:bottom-8 left-4 right-16 z-20">
        <Link href={`/profil/${game.uploaderId}`} className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent p-0.5">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${game.uploaderName}`} className="w-full h-full rounded-full bg-black" alt="avatar" />
          </div>
          <span className="font-semibold text-white text-lg drop-shadow-md">@{game.uploaderName}</span>
        </Link>
        
        <Link href={`/oyun/${game.id}`}>
          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">{game.title}</h2>
          <p className="text-white/80 line-clamp-2 text-sm mb-3">{game.description}</p>
        </Link>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
            {game.category}
          </span>
          {game.tags?.slice(0,2).map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full bg-white/5 backdrop-blur-md text-xs text-white/70 border border-white/5">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right Sidebar Actions */}
      <div className="absolute bottom-24 right-2 z-20 flex flex-col gap-6 items-center">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <Heart className={cn("w-6 h-6", isLiked ? "fill-destructive text-destructive" : "text-white")} />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">{likesCount}</span>
        </button>

        <Link href={`/oyun/${game.id}`} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">{game.commentsCount}</span>
        </Link>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">Paylaş</span>
        </button>

        <div className="w-12 h-12 mt-4 rounded-full border-2 border-white/20 overflow-hidden animate-spin-slow">
           <img 
            src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop"} 
            alt="disc" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
