import { Shell } from "@/components/layout/Shell";
import { useGetHorizontalGames } from "@workspace/api-client-react";
import { Play, Star, Users } from "lucide-react";
import { Link } from "wouter";

export default function HorizontalGames() {
  const { data, isLoading } = useGetHorizontalGames();

  return (
    <Shell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Yatay Oyunlar</h1>
            <p className="text-muted-foreground">Tam ekran deneyimi için tasarlanmış yatay oyunlar.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl h-64 bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.games.map((game) => (
              <Link key={game.id} href={`/oyun/${game.id}`}>
                <div className="group glass-card rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer border border-white/5 hover:border-primary/50">
                  <div className="relative h-48 w-full">
                    <img 
                      src={game.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop"} 
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center text-white">
                        <Play className="w-8 h-8 ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="px-2 py-1 rounded bg-primary/20 backdrop-blur-md text-primary text-xs font-bold mb-2 inline-block border border-primary/20">
                        {game.category}
                      </span>
                      <h3 className="text-xl font-bold text-white drop-shadow-md truncate">{game.title}</h3>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-900/50 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{game.playsCount.toLocaleString()} oynanma</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span>4.8</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
