import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

// Pages
import Home from "@/pages/Home";
import HorizontalGames from "@/pages/HorizontalGames";
import GameDetail from "@/pages/GameDetail";
import Upload from "@/pages/Upload";
import Social from "@/pages/Social";
import Profile from "@/pages/Profile";
import AIAssistant from "@/pages/AIAssistant";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import Search from "@/pages/Search";
import Leaderboard from "@/pages/Leaderboard";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={Home} />
        <Route path="/yatay-oyunlar" component={HorizontalGames} />
        <Route path="/oyun/:id" component={GameDetail} />
        <Route path="/yukle" component={Upload} />
        <Route path="/sosyal" component={Social} />
        <Route path="/profil/:id" component={Profile} />
        <Route path="/ai" component={AIAssistant} />
        <Route path="/giris" component={Auth} />
        <Route path="/kayit" component={Auth} />
        <Route path="/admin" component={Admin} />
        
        <Route path="/arama" component={Search} />
        <Route path="/liderboard" component={Leaderboard} />
        <Route path="/bildirimler" component={Notifications} />
        
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
