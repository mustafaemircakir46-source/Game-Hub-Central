import { useState } from "react";
import { useLoginUser, useRegisterUser } from "@workspace/api-client-react";
import { useAuthStore } from "@/store/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shell } from "@/components/layout/Shell";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { mutate: login, isPending: isLoggingIn } = useLoginUser();
  const { mutate: register, isPending: isRegistering } = useRegisterUser();
  const setAuth = useAuthStore(s => s.setAuth);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login({ data: { emailOrUsername: formData.username, password: formData.password } }, {
        onSuccess: (res) => {
          setAuth(res.user, res.token);
          setLocation("/");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Hata", description: "Giriş başarısız. Bilgilerinizi kontrol edin." });
        }
      });
    } else {
      register({ data: formData }, {
        onSuccess: (res) => {
          setAuth(res.user, res.token);
          setLocation("/");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Hata", description: "Kayıt başarısız." });
        }
      });
    }
  };

  return (
    <Shell hideTopNav hideBottomNav>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
        {/* Abstract Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px]" />
        
        <div className="w-full max-w-md glass-card rounded-[2rem] p-8 relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="font-display font-bold text-white text-2xl">RE</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white">RUKİYE EKİNCİ</h1>
            <p className="text-muted-foreground mt-2">Oyun dünyasına katılın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input 
                placeholder="E-posta" 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            )}
            <Input 
              placeholder={isLogin ? "Kullanıcı Adı veya E-posta" : "Kullanıcı Adı"} 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
            <Input 
              placeholder="Şifre" 
              type="password" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
            
            <Button type="submit" className="w-full h-12 text-base rounded-xl mt-4" isLoading={isLoggingIn || isRegistering}>
              {isLogin ? "Giriş Yap" : "Kayıt Ol"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              {isLogin ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
