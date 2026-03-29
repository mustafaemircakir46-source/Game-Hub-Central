import { useState, useEffect, useRef } from "react";
import { Shell } from "@/components/layout/Shell";
import { Send, MessageCircle, Users, Plus, Mic, MicOff, X, Hash, ChevronLeft, Search, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api/messages";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type ConversationSummary = {
  userId: number;
  username: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

type DM = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isMe: boolean;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
};

type Room = {
  id: number;
  name: string;
  description?: string;
  hostId: number;
  hostName: string;
  hostAvatar?: string;
  isVoice: boolean;
  isActive: boolean;
  participantsCount: number;
  maxParticipants: number;
  createdAt: string;
};

type RoomMessage = {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
  createdAt: string;
};

export default function Messages() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"dms" | "rooms">("dms");
  const [selectedConvo, setSelectedConvo] = useState<ConversationSummary | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  if (!user) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4 text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground/30" />
          <p className="text-lg font-semibold text-zinc-400">Mesajları görmek için giriş yap</p>
          <a href="/giris" className="text-primary hover:underline text-sm">Giriş Yap</a>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "flex flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl transition-all duration-300",
          (selectedConvo || selectedRoom) ? "hidden md:flex w-80" : "flex w-full md:w-80"
        )}>
          {/* Tab Header */}
          <div className="p-4 border-b border-white/5">
            <h1 className="text-lg font-bold text-white mb-3">Mesajlar</h1>
            <div className="flex gap-1 bg-zinc-900/60 rounded-xl p-1">
              <button
                onClick={() => setTab("dms")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === "dms" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageCircle className="w-4 h-4 inline mr-1.5" />DM
              </button>
              <button
                onClick={() => setTab("rooms")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === "rooms" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Hash className="w-4 h-4 inline mr-1.5" />Odalar
              </button>
            </div>
          </div>

          {tab === "dms" ? (
            <DMList onSelect={setSelectedConvo} selectedId={selectedConvo?.userId} />
          ) : (
            <RoomList onSelect={setSelectedRoom} selectedId={selectedRoom?.id} />
          )}
        </div>

        {/* Main Panel */}
        <div className={cn(
          "flex-1",
          !(selectedConvo || selectedRoom) && "hidden md:flex"
        )}>
          {selectedConvo ? (
            <DMChat
              convo={selectedConvo}
              myId={user.id}
              onBack={() => setSelectedConvo(null)}
            />
          ) : selectedRoom ? (
            <RoomChat
              room={selectedRoom}
              myId={user.id}
              onBack={() => setSelectedRoom(null)}
              onRoomUpdate={setSelectedRoom}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full gap-4 text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 text-white/10" />
              <p className="text-zinc-500">Bir konuşma veya oda seçin</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ===== DM List =====
function DMList({ onSelect, selectedId }: { onSelect: (c: ConversationSummary) => void; selectedId?: number }) {
  const [convos, setConvos] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [newDmId, setNewDmId] = useState("");
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const data = await apiFetch("/conversations");
      setConvos(data.conversations || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startNewDM = () => {
    const id = parseInt(newDmId);
    if (!id || id === user?.id) return;
    onSelect({ userId: id, username: "kullanıcı", displayName: "Kullanıcı", lastMessage: "", lastAt: new Date().toISOString(), unreadCount: 0 });
    setNewDmId("");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* New DM */}
      <div className="p-3 border-b border-white/5">
        <div className="flex gap-2">
          <Input
            placeholder="Kullanıcı ID ile DM başlat..."
            value={newDmId}
            onChange={e => setNewDmId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startNewDM()}
            className="h-9 text-sm bg-zinc-900/60 border-white/10"
            type="number"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={startNewDM}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1 pl-1">Profil sayfasından kullanıcı ID'sini bulun</p>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-3 items-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-secondary/50" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 bg-secondary/50 rounded" />
                <div className="h-3 w-3/4 bg-secondary/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !convos.length ? (
        <div className="p-6 text-center text-muted-foreground/50 text-sm">
          Henüz DM yok. Yukarıdan yeni başlat!
        </div>
      ) : (
        convos.map(c => (
          <button
            key={c.userId}
            onClick={() => onSelect(c)}
            className={cn(
              "w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left",
              selectedId === c.userId && "bg-primary/10"
            )}
          >
            <div className="relative shrink-0">
              <img
                src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`}
                className="w-12 h-12 rounded-full bg-secondary"
                alt=""
              />
              {c.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  {c.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{c.displayName}</p>
              <p className="text-muted-foreground text-xs truncate">{c.lastMessage}</p>
            </div>
            <span className="text-xs text-muted-foreground/50 shrink-0">{formatRelativeTime(c.lastAt)}</span>
          </button>
        ))
      )}
    </div>
  );
}

// ===== DM Chat =====
function DMChat({ convo, myId, onBack }: { convo: ConversationSummary; myId: number; onBack: () => void }) {
  const [messages, setMessages] = useState<DM[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await apiFetch(`/dm/${convo.userId}`);
      setMessages(data.messages || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [convo.userId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    try {
      const msg = await apiFetch(`/dm/${convo.userId}`, { method: "POST", body: JSON.stringify({ content }) });
      setMessages(prev => [...prev, msg]);
    } catch { }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <button onClick={onBack} className="md:hidden p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <img src={convo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${convo.username}`} className="w-10 h-10 rounded-full bg-secondary" alt="" />
        <div>
          <p className="font-semibold text-white">{convo.displayName}</p>
          <p className="text-xs text-muted-foreground">@{convo.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Yükleniyor...</div>
        ) : !messages.length ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Henüz mesaj yok. İlk mesajı gönder!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn("flex gap-2 max-w-[80%]", msg.isMe ? "ml-auto flex-row-reverse" : "")}>
              {!msg.isMe && (
                <img src={msg.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} className="w-8 h-8 rounded-full bg-secondary shrink-0" alt="" />
              )}
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.isMe
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-secondary/50 text-zinc-200 rounded-tl-sm border border-white/5"
              )}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={`${convo.displayName}'e mesaj gönder...`}
            className="rounded-full h-11 bg-secondary/30 border-white/10 text-white placeholder:text-muted-foreground/50"
          />
          <Button size="icon" onClick={send} disabled={!input.trim()} className="rounded-full h-11 w-11 shrink-0">
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== Room List =====
function RoomList({ onSelect, selectedId }: { onSelect: (r: Room) => void; selectedId?: number }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isVoice, setIsVoice] = useState(false);
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const data = await apiFetch("/rooms");
      setRooms(data.rooms || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createRoom = async () => {
    if (!newName.trim()) return;
    try {
      const room = await apiFetch("/rooms", { method: "POST", body: JSON.stringify({ name: newName, description: newDesc, isVoice }) });
      setRooms(prev => [room, ...prev]);
      setCreating(false);
      setNewName("");
      setNewDesc("");
      onSelect(room);
    } catch { }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Create Room */}
      <div className="p-3 border-b border-white/5">
        <Button
          onClick={() => setCreating(!creating)}
          className="w-full h-9 text-sm"
          variant={creating ? "outline" : "default"}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {creating ? "İptal" : "Yeni Oda Oluştur"}
        </Button>

        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 mt-3">
                <Input
                  placeholder="Oda adı *"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="h-9 text-sm bg-zinc-900/60 border-white/10"
                />
                <Input
                  placeholder="Açıklama (isteğe bağlı)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="h-9 text-sm bg-zinc-900/60 border-white/10"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVoice(!isVoice)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      isVoice ? "bg-primary/20 border-primary/40 text-primary" : "border-white/10 text-muted-foreground"
                    )}
                  >
                    <Mic className="w-3 h-3" />
                    {isVoice ? "Sesli Oda" : "Metin Odası"}
                  </button>
                </div>
                <Button onClick={createRoom} disabled={!newName.trim()} className="w-full h-9 text-sm">
                  Oluştur
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary/20 animate-pulse" />)}
        </div>
      ) : !rooms.length ? (
        <div className="p-6 text-center text-muted-foreground/50 text-sm">
          Henüz oda yok. İlk odayı sen oluştur!
        </div>
      ) : (
        rooms.map(room => (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={cn(
              "w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5",
              selectedId === room.id && "bg-primary/10"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              room.isVoice ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {room.isVoice ? <Mic className="w-5 h-5 text-green-400" /> : <Hash className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{room.name}</p>
              <p className="text-muted-foreground text-xs">{room.participantsCount} katılımcı • {room.hostName}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ===== Room Chat =====
function RoomChat({ room, myId, onBack }: { room: Room; myId: number; onBack: () => void; onRoomUpdate: (r: Room) => void }) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await apiFetch(`/rooms/${room.id}/messages`);
      setMessages(data.messages || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 2000); return () => clearInterval(t); }, [room.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    try {
      const msg = await apiFetch(`/rooms/${room.id}/messages`, { method: "POST", body: JSON.stringify({ content }) });
      setMessages(prev => [...prev, msg]);
    } catch { }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <button onClick={onBack} className="md:hidden p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          room.isVoice ? "bg-green-500/20" : "bg-primary/20"
        )}>
          {room.isVoice ? <Mic className="w-5 h-5 text-green-400" /> : <Hash className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">{room.name}</p>
          <p className="text-xs text-muted-foreground">
            {room.isVoice ? "🎙️ Sesli Oda" : "💬 Metin Odası"} • {room.participantsCount} katılımcı
          </p>
        </div>
        {room.isVoice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Canlı</span>
          </div>
        )}
      </div>

      {/* Voice indicator */}
      {room.isVoice && (
        <div className="p-3 bg-green-500/5 border-b border-green-500/10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-7 h-7 rounded-full bg-green-500/30 border-2 border-background flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            ))}
          </div>
          <p className="text-xs text-green-400 font-medium">Sesli konuşma aktif • Tarayıcı izni gerekli</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Yükleniyor...</div>
        ) : !messages.length ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Oda sessiz. İlk mesajı gönder!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn("flex gap-2 max-w-[80%]", msg.isMe ? "ml-auto flex-row-reverse" : "")}>
              {!msg.isMe && (
                <img
                  src={msg.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`}
                  className="w-8 h-8 rounded-full bg-secondary shrink-0 self-end"
                  alt=""
                />
              )}
              <div className={cn("max-w-full", msg.isMe ? "items-end flex flex-col" : "")}>
                {!msg.isMe && <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.senderName}</p>}
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.isMe
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-secondary/50 text-zinc-200 rounded-tl-sm border border-white/5"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={`#${room.name} odasına mesaj gönder...`}
            className="rounded-full h-11 bg-secondary/30 border-white/10 text-white placeholder:text-muted-foreground/50"
          />
          <Button size="icon" onClick={send} disabled={!input.trim()} className="rounded-full h-11 w-11 shrink-0">
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
