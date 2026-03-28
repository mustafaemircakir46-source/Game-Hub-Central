import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useGetGame, useLikeGame, useGetGameComments, useAddGameComment } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Heart, Share2, MessageSquare, Maximize, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function GameDetail() {
  const { id } = useParams();
  const gameId = parseInt(id || "0");
  const { data: game, isLoading } = useGetGame(gameId);
  const { data: commentsData, refetch: refetchComments } = useGetGameComments(gameId);
  const { mutate: toggleLike } = useLikeGame();
  const { mutate: addComment, isPending: isSubmittingComment } = useAddGameComment();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLike = () => {
    toggleLike({ id: gameId });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Kopyalandı", description: "Oyun bağlantısı kopyalandı." });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    addComment(
      { id: gameId, data: { content: commentText } },
      {
        onSuccess: () => {
          setCommentText("");
          refetchComments();
          toast({ title: "Başarılı", description: "Yorumunuz eklendi." });
        }
      }
    );
  };

  if (isLoading) {
    return <Shell><div className="p-8 text-center">Yükleniyor...</div></Shell>;
  }

  if (!game) {
    return <Shell><div className="p-8 text-center text-destructive">Oyun bulunamadı.</div></Shell>;
  }

  return (
    <Shell>
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Game Player Area */}
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 group">
            {isPlaying && game.gameUrl ? (
              <iframe 
                src={game.gameUrl} 
                className="w-full h-full border-none"
                allowFullScreen
              />
            ) : (
              <>
                <img 
                  src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop"} 
                  alt={game.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="w-24 h-24 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center text-white transform hover:scale-110 transition-all shadow-[0_0_40px_rgba(139,92,246,0.5)]"
                  >
                    <Play className="w-10 h-10 ml-2" />
                  </button>
                </div>
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button size="icon" variant="ghost-glass" className="rounded-full">
                 <Maximize className="w-5 h-5" />
               </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold font-display text-white mb-2">{game.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Play className="w-4 h-4" /> {game.playsCount} Oynanma</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {game.likesCount} Beğeni</span>
                  <span className="bg-secondary px-2 py-1 rounded-md text-secondary-foreground">{game.category}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={game.isLiked ? "default" : "secondary"} onClick={handleLike} className="rounded-full">
                  <Heart className={`w-5 h-5 mr-2 ${game.isLiked ? 'fill-current' : ''}`} /> 
                  {game.isLiked ? 'Beğendin' : 'Beğen'}
                </Button>
                <Button variant="secondary" onClick={handleShare} size="icon" className="rounded-full">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <p className="text-zinc-300 leading-relaxed mb-6">
              {game.description}
            </p>

            {/* Uploader Profile Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent p-0.5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${game.uploaderName}`} className="w-full h-full rounded-full bg-black" alt="avatar" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geliştirici</p>
                  <p className="font-bold text-white">@{game.uploaderName}</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full">Takip Et</Button>
            </div>
          </div>
        </div>

        {/* Sidebar: Comments & Related */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          
          {/* Comments Section */}
          <div className="glass-card rounded-3xl p-5 flex flex-col h-[500px]">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Yorumlar
            </h3>
            
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 mb-4">
              {commentsData?.comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorName}`} className="w-8 h-8 rounded-full bg-secondary" alt="avatar" />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-white">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
              {!commentsData?.comments.length && (
                <p className="text-sm text-muted-foreground text-center my-auto">İlk yorumu sen yap!</p>
              )}
            </div>

            <form onSubmit={submitComment} className="flex gap-2">
              <Input 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Yorum yaz..." 
                className="rounded-full bg-secondary/50"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isSubmittingComment}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>

        </div>
      </div>
    </Shell>
  );
}
