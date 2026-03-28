import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useCreateGame } from "@workspace/api-client-react";
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Upload() {
  const { mutate: createGame, isPending } = useCreateGame();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Aksiyon",
    orientation: "vertical" as "vertical" | "horizontal",
    gameUrl: "",
    thumbnail: "",
    tags: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGame(
      { 
        data: {
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Başarıyla Yüklendi!",
            description: "Oyununuz admin onayına gönderildi.",
          });
          setLocation("/profil/me");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Oyun yüklenirken bir sorun oluştu.",
          });
        }
      }
    );
  };

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Oyun Yükle</h1>
          <p className="text-muted-foreground mt-2">Yeni bir oyun yükleyerek toplulukla paylaşın.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Main Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer group h-64">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg text-white mb-1">Oyun Dosyası Seç</h3>
              <p className="text-sm text-muted-foreground">Sürükle bırak veya klasörden seç (ZIP, HTML5)</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" /> Veya Web Linki (URL)
                </label>
                <Input 
                  placeholder="https://oyun-siteniz.com/oyun" 
                  value={formData.gameUrl}
                  onChange={e => setFormData({...formData, gameUrl: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" /> Kapak Görseli (URL)
                </label>
                <Input 
                  placeholder="https://.../image.jpg" 
                  value={formData.thumbnail}
                  onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Details Form */}
          <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-border pb-4">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Oyun Detayları</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Oyun Adı *</label>
                <Input 
                  required 
                  placeholder="Efsanevi Maceram" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Açıklama *</label>
                <Textarea 
                  required 
                  placeholder="Oyununuz ne hakkında? Nasıl oynanır?" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Kategori *</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Aksiyon">Aksiyon</option>
                    <option value="Macera">Macera</option>
                    <option value="Bulmaca">Bulmaca</option>
                    <option value="Spor">Spor</option>
                    <option value="Strateji">Strateji</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Ekran Yönü *</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.orientation}
                    onChange={e => setFormData({...formData, orientation: e.target.value as any})}
                  >
                    <option value="vertical">Dikey (TikTok/IG Tarzı)</option>
                    <option value="horizontal">Yatay (Klasik PC/Konsol)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Etiketler (Virgülle ayırın)</label>
                <Input 
                  placeholder="2d, platform, retro" 
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg" isLoading={isPending} className="w-full sm:w-auto">
                Oyunu Yükle ve Onaya Gönder
              </Button>
            </div>
          </div>

        </form>
      </div>
    </Shell>
  );
}
