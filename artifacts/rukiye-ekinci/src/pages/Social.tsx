import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useGetPosts, useCreatePost, useLikePost, Post } from "@workspace/api-client-react";
import { Heart, MessageCircle, Share2, Plus, Image as ImageIcon } from "lucide-react";
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

        {/* Stories Bar (Mocked) */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-accent">
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="story" className="bg-secondary" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">User {i}</span>
            </div>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center p-8 text-muted-foreground">Yükleniyor...</div>
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
