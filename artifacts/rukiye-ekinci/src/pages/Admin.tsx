import { useState, useEffect } from "react";
import { useAdminLogin, useGetAdminStats, useGetPendingGames, useApproveGame, useRejectGame } from "@workspace/api-client-react";
import { Lock, Users, Gamepad2, Check, X, Activity, Settings, FileText, BarChart3, Eye, EyeOff, Trash2, Ban, RefreshCw, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
let adminToken = "";

async function adminFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}/admin${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Admin ${adminToken}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { mutate: login, isPending } = useAdminLogin();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "mustafa4606") {
      login({ data: { password } }, {
        onSuccess: (res: any) => {
          adminToken = res.token || "";
          setIsAuthenticated(true);
        },
        onError: () => {
          adminToken = password;
          setIsAuthenticated(true);
        }
      });
    } else {
      toast({ variant: "destructive", title: "Hatalı Şifre", description: "Lütfen doğru admin şifresini girin." });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-2xl shadow-red-600/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Yönetici Girişi</h1>
            <p className="text-zinc-500 text-sm mt-1">RUKİYE EKİNCİ Admin Panel</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Admin Şifresi</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 h-12 pr-12 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl"
                disabled={isPending}
              >
                {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-zinc-600 mt-4">
            Bu panel sadece yetkili kişilere açıktır.
          </p>
        </motion.div>
      </div>
    );
  }

  return <AdminDashboard />;
}

const TABS = [
  { key: "dashboard", label: "Genel Bakış", icon: BarChart3 },
  { key: "users", label: "Kullanıcılar", icon: Users },
  { key: "games", label: "Oyunlar", icon: Gamepad2 },
  { key: "posts", label: "Gönderiler", icon: FileText },
  { key: "settings", label: "Ayarlar", icon: Settings },
  { key: "activity", label: "Aktivite", icon: Activity },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: stats, refetch: refetchStats } = useGetAdminStats();
  const { data: pending, refetch: refetchPending } = useGetPendingGames();
  const { mutate: approve } = useApproveGame();
  const { mutate: reject } = useRejectGame();
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    approve({ id }, {
      onSuccess: () => { toast({ title: "✅ Oyun onaylandı" }); refetchPending(); refetchStats(); }
    });
  };

  const handleReject = (id: number) => {
    const reason = prompt("Ret nedeni giriniz:") || "Uygunsuz içerik";
    reject({ id, data: { reason } }, {
      onSuccess: () => { toast({ title: "❌ Oyun reddedildi" }); refetchPending(); refetchStats(); }
    });
  };

  return (
    <div className="min-h-screen bg-[#06060A] text-zinc-300">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">RUKİYE EKİNCİ</span>
            <span className="text-red-400 text-xs ml-2">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pending?.games && pending.games.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
              <Bell className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">{pending.games.length} onay bekliyor</span>
            </div>
          )}
          <button onClick={() => { refetchStats(); refetchPending(); }} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 border-r border-zinc-800/50 bg-zinc-900/20 pt-6 px-3">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                  activeTab === tab.key
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                <tab.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.key === "games" && pending?.games?.length ? (
                  <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending.games.length}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "dashboard" && <DashboardTab stats={stats} />}
              {activeTab === "users" && <UsersTab />}
              {activeTab === "games" && <GamesTab pending={pending} onApprove={handleApprove} onReject={handleReject} stats={stats} />}
              {activeTab === "posts" && <PostsTab />}
              {activeTab === "settings" && <SettingsTab />}
              {activeTab === "activity" && <ActivityTab stats={stats} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ====== DASHBOARD TAB ======
function DashboardTab({ stats }: { stats: any }) {
  const statCards = [
    { label: "Toplam Kullanıcı", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", sub: `+${stats?.newUsersToday ?? 0} bugün` },
    { label: "Toplam Oyun", value: stats?.totalGames ?? 0, icon: Gamepad2, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", sub: `+${stats?.newGamesToday ?? 0} bugün` },
    { label: "Onay Bekleyen", value: stats?.pendingGames ?? 0, icon: Bell, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", sub: "oyun" },
    { label: "Toplam Gönderi", value: stats?.totalPosts ?? 0, icon: FileText, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", sub: "gönderi" },
    { label: "Toplam Oynanma", value: (stats?.totalPlays ?? 0).toLocaleString(), icon: Activity, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", sub: "kez" },
    { label: "Toplam Beğeni", value: (stats?.totalLikes ?? 0).toLocaleString(), icon: Check, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", sub: "beğeni" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Genel Bakış</h1>
        <p className="text-zinc-500 text-sm">Platform istatistiklerine bakın.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className={cn("rounded-2xl p-5 border", bg)}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-400 text-sm">{label}</p>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className={cn("text-3xl font-bold", color)}>{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Top Games */}
      {stats?.topGames?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">En Popüler Oyunlar</h2>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
            {stats.topGames.map((game: any, i: number) => (
              <div key={game.id} className="flex items-center gap-4 p-4 border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/20 transition-colors">
                <span className="text-2xl font-black text-zinc-700 w-8 text-center">#{i + 1}</span>
                <img src={game.thumbnail || "https://via.placeholder.com/60"} alt="" className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{game.title}</p>
                  <p className="text-xs text-zinc-500">{game.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{game.playsCount.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">oynanma</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ====== USERS TAB ======
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch(`/users?search=${search}`);
      setUsers(data.users || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleBan = async (id: number, isBanned: boolean) => {
    try {
      await adminFetch(`/users/${id}/ban`, { method: "POST" });
      toast({ title: isBanned ? "Engel kaldırıldı" : "Kullanıcı engellendi" });
      load();
    } catch { toast({ variant: "destructive", title: "Hata oluştu" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h1>
        <Input
          placeholder="Kullanıcı ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 bg-zinc-900 border-zinc-700"
        />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_100px_120px] gap-4 p-4 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <span>Kullanıcı</span>
          <span>Email</span>
          <span>Oyunlar</span>
          <span>Takipçi</span>
          <span>İşlemler</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Yükleniyor...</div>
        ) : !users.length ? (
          <div className="p-8 text-center text-zinc-500">Kullanıcı bulunamadı.</div>
        ) : (
          users.map(user => (
            <div key={user.id} className={cn(
              "grid grid-cols-[1fr_1fr_100px_100px_120px] gap-4 p-4 items-center border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/20 transition-colors",
              user.isBanned && "opacity-50"
            )}>
              <div className="flex items-center gap-3 min-w-0">
                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" alt="" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{user.displayName || user.username}</p>
                  <p className="text-xs text-zinc-500">@{user.username}</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm truncate">{user.email}</p>
              <p className="text-white font-medium">{user.gamesCount}</p>
              <p className="text-white font-medium">{user.followersCount}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBan(user.id, user.isBanned)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    user.isBanned
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  )}
                >
                  <Ban className="w-3 h-3" />
                  {user.isBanned ? "Aç" : "Engelle"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ====== GAMES TAB ======
function GamesTab({ pending, onApprove, onReject, stats }: any) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Oyun Yönetimi</h1>
        <p className="text-zinc-500 text-sm">Onay bekleyen oyunları yönetin.</p>
      </div>

      {/* Pending Games */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Onay Bekleyen</h2>
          {pending?.games?.length > 0 && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.games.length}
            </span>
          )}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          {!pending?.games?.length ? (
            <div className="p-10 text-center">
              <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-zinc-400">Tüm oyunlar incelendi!</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {pending.games.map((game: any) => (
                <div key={game.id} className="p-5 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-start gap-5">
                    <img src={game.thumbnail || "https://via.placeholder.com/100"} alt="" className="w-20 h-20 rounded-xl object-cover bg-zinc-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{game.title}</h3>
                          <p className="text-zinc-400 text-sm">@{game.uploaderName} • {game.category}</p>
                          <p className="text-zinc-500 text-sm mt-2 line-clamp-2">{game.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => onApprove(game.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 text-sm font-medium transition-colors"
                          >
                            <Check className="w-4 h-4" /> Onayla
                          </button>
                          <button
                            onClick={() => onReject(game.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-sm font-medium transition-colors"
                          >
                            <X className="w-4 h-4" /> Reddet
                          </button>
                        </div>
                      </div>
                      {game.gameUrl && (
                        <a href={game.gameUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-2 inline-block hover:underline">
                          🔗 {game.gameUrl}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== POSTS TAB ======
function PostsTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/posts");
      setPosts(data.posts || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deletePost = async (id: number) => {
    if (!confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
    try {
      await adminFetch(`/content/post/${id}`, { method: "DELETE" });
      toast({ title: "Gönderi silindi" });
      load();
    } catch { toast({ variant: "destructive", title: "Hata oluştu" }); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Gönderi Yönetimi</h1>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Yükleniyor...</div>
        ) : !posts.length ? (
          <div className="p-8 text-center text-zinc-500">Henüz gönderi yok.</div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {posts.map(post => (
              <div key={post.id} className="p-4 hover:bg-zinc-800/20 transition-colors flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">@{post.authorName}</span>
                    <span className="text-zinc-600 text-xs">{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  <p className="text-zinc-400 text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                    <span>❤️ {post.likesCount}</span>
                    <span>💬 {post.commentsCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  className="p-2 text-zinc-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====== SETTINGS TAB ======
function SettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    adminFetch("/settings").then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch("/settings", { method: "PUT", body: JSON.stringify(settings) });
      toast({ title: "✅ Ayarlar kaydedildi" });
    } catch { toast({ variant: "destructive", title: "Kaydetme başarısız" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-zinc-500 text-center p-8">Yükleniyor...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Platform Ayarları</h1>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-6">
        <SettingField
          label="Site Adı"
          value={settings?.siteName || ""}
          onChange={v => setSettings({ ...settings, siteName: v })}
        />
        <SettingField
          label="Site Açıklaması"
          value={settings?.siteDescription || ""}
          onChange={v => setSettings({ ...settings, siteDescription: v })}
          multiline
        />
        <SettingToggle
          label="Yeni Kayıt İzni"
          description="Yeni kullanıcılar kayıt olabilir"
          value={settings?.allowRegistration ?? true}
          onChange={v => setSettings({ ...settings, allowRegistration: v })}
        />
        <SettingToggle
          label="Oyun Onayı Gerekli"
          description="Yüklenen oyunlar admin onayı bekler"
          value={settings?.requireGameApproval ?? true}
          onChange={v => setSettings({ ...settings, requireGameApproval: v })}
        />
        <SettingToggle
          label="Bakım Modu"
          description="Site bakım moduna alınır"
          value={settings?.maintenanceMode ?? false}
          onChange={v => setSettings({ ...settings, maintenanceMode: v })}
        />

        <div className="pt-4 border-t border-zinc-800">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange, multiline }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-400 mb-2 block">{label}</label>
      {multiline ? (
        <Textarea value={value} onChange={e => onChange(e.target.value)} className="bg-zinc-950 border-zinc-700 resize-none" />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} className="bg-zinc-950 border-zinc-700" />
      )}
    </div>
  );
}

function SettingToggle({ label, description, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          value ? "bg-green-500" : "bg-zinc-700"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
          value ? "left-6" : "left-1"
        )} />
      </button>
    </div>
  );
}

// ====== ACTIVITY TAB ======
function ActivityTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Son Aktiviteler</h1>
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        {!stats?.recentActivity?.length ? (
          <div className="p-8 text-center text-zinc-500">Henüz aktivite yok.</div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {stats.recentActivity.map((item: any, i: number) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                  item.type === "user" ? "bg-blue-500/20" : "bg-purple-500/20"
                )}>
                  {item.type === "user" ? <Users className="w-4 h-4 text-blue-400" /> : <Gamepad2 className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200 text-sm">{item.message}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
