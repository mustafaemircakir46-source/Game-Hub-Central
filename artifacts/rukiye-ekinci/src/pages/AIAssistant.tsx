import { useState, useRef, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useAiChat, useGenerateGame } from "@workspace/api-client-react";
import { Sparkles, Send, Bot, Code, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Merhaba! Ben RUKİYE EKİNCİ AI Asistanı. Senin için oyun kodlayabilir, poster tasarlayabilir veya makale yazabilirim. Nasıl yardımcı olabilirim?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutate: sendChat, isPending: isChatting } = useAiChat();
  const { mutate: generateGame, isPending: isGenerating } = useGenerateGame();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatting) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    sendChat({ data: { message: userMsg, history: messages } }, {
      onSuccess: (res) => {
        setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: "Üzgünüm, bir hata oluştu. Lütfen tekrar dene." }]);
      }
    });
  };

  const quickAction = (action: string) => {
    const prompts = {
      game: "Bana HTML5 ve JS kullanarak basit bir yılan oyunu (snake) kodla.",
      poster: "Siberpunk temalı karanlık bir sokakta geçen bir yarış oyunu için poster oluştur.",
      article: "Son yılların en popüler indie oyunları hakkında kısa bir makale yaz."
    };
    
    setInput(prompts[action as keyof typeof prompts]);
  };

  return (
    <Shell transparentTop>
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} className="w-full h-full object-cover opacity-30" alt="bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative z-10 flex flex-col h-[calc(100dvh-5rem)] md:h-screen max-w-4xl mx-auto p-4 md:p-6">
        
        <div className="flex items-center gap-3 mb-6 mt-16 md:mt-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Yapay Zeka</h1>
            <p className="text-sm text-primary-foreground/70">Oyun, Tasarım ve Metin Asistanı</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <ActionCard icon={Code} label="Oyun Yap" onClick={() => quickAction('game')} />
          <ActionCard icon={ImageIcon} label="Poster Çiz" onClick={() => quickAction('poster')} />
          <ActionCard icon={FileText} label="Makale Yaz" onClick={() => quickAction('article')} />
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden border border-white/10">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-secondary" : "bg-primary"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-[15px] leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary text-white rounded-tr-sm" 
                    : "bg-secondary/50 border border-white/5 text-zinc-200 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isChatting && (
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-5 py-3 rounded-2xl bg-secondary/50 border border-white/5 text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Düşünüyor...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-background/40 border-t border-white/5 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Yapay zekaya ne yaratmasını istersin?" 
                className="rounded-full h-14 bg-secondary/30 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50 text-base"
              />
              <Button type="submit" disabled={isChatting || !input.trim()} size="icon" className="h-14 w-14 rounded-full shrink-0">
                <Send className="w-5 h-5 ml-1" />
              </Button>
            </form>
          </div>
        </div>

      </div>
    </Shell>
  );
}

function ActionCard({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-secondary/30 border border-white/5 hover:bg-secondary/60 hover:border-primary/50 transition-all group"
    >
      <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
      <span className="text-xs font-medium text-zinc-300">{label}</span>
    </button>
  );
}

// Just for the icon mapping in chat
import { User } from "lucide-react";
