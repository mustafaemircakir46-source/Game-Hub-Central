import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useGetPosts, useCreatePost, useLikePost, Post } from "@workspace/api-client-react";
import { Heart, MessageCircle, Share2, Image as ImageIcon, Users } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Social() {
  const { data, isLoading, refetch } = useGetPosts();
  const { mutate: createPost, isPending } = useCreatePost();
  const [newPostContent, setNewPostContent] = useState("");

  const handlePostSubmit = () => {
    if (!newPostContent.trim()) return;
    createPost({
      data: {
        content: newPostContent,
        type: "text"
      }
    }, {
      onSuccess: () => {
        setNewPostContent("");
        refetch();
      }
    });
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto p-4 md:py-8 space-y-6">
        
        {/* Create Post Card */}
        <div className="glass-card rounded-3xl p-4 md:p-6 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary shrink-0 overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=me" alt="me" />
            </div>
            <Textarea 
              placeholder="Aklından ne geçiyor? Bir oyun tavsiye et..." 
              className="min-h-[80px] border-none bg-transparent focus-visible:ring-0 px-0 text-lg placeholder:text-muted-foreground/60 resize-none"
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-primary rounded-full hover:bg-primary/10">
                <ImageIcon className="w-5 h-5" />
              </Button>
            </div>
            <Button onClick={handlePostSubmit} disabled={isPending || !newPostContent.trim()} className="rounded-full px-6">
              Paylaş
            </Button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card rounded-3xl p-5 border border-white/5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/60" />
                    <div className="space-y-2">
                      <div className="h-3 w-28 bg-secondary/60 rounded" />
                      <div className="h-2 w-16 bg-secondary/40 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-secondary/40 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-secondary/30 rounded" />
                </div>
              ))}
            </div>
          ) : !data?.posts.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-400">Henüz gönderi yok</p>
                <p className="text-sm text-muted-foreground mt-1">İlk gönderiyi sen paylaş!</p>
              </div>
            </div>
          ) : (
            data?.posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

      </div>
    </Shell>
  );
}

function PostCard({ post }: { post: Post }) {
  const { mutate: toggleLike } = useLikePost();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    toggleLike({ id: post.id });
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} className="w-10 h-10 rounded-full bg-secondary" alt="avatar" />
          <div>
            <h4 className="font-bold text-white text-sm">{post.authorName}</h4>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <p className="text-zinc-200 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      
      {post.mediaUrl && (
        <div className="rounded-2xl overflow-hidden mb-4 border border-border">
          <img src={post.mediaUrl} alt="post media" className="w-full h-auto object-cover" />
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-border">
        <button onClick={handleLike} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
          <Heart className={`w-5 h-5 group-active:scale-90 transition-transform ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
          <MessageCircle className="w-5 h-5 group-active:scale-90 transition-transform" />
          <span className="text-sm font-medium">{post.commentsCount}</span>
        </button>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
