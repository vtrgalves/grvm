import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/app/AppLayout";
import Index from "./pages/Index.tsx";
import Signup from "./pages/Signup.tsx";
import Login from "./pages/Login.tsx";
import Welcome from "./pages/Welcome.tsx";
import Missions from "./pages/Missions.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Wallet from "./pages/app/Wallet.tsx";
import MissionsApp from "./pages/app/MissionsApp.tsx";
import Levels from "./pages/app/Levels.tsx";
import NFTs from "./pages/app/NFTs.tsx";
import Experiences from "./pages/app/Experiences.tsx";
import Feed from "./pages/app/Feed.tsx";
import Ranking from "./pages/app/Ranking.tsx";
import Studio from "./pages/app/Studio.tsx";
import StudioNewItem from "./pages/app/StudioNewItem.tsx";
import Explorer from "./pages/app/Explorer.tsx";
import VipClub from "./pages/app/VipClub.tsx";
import LiveDrops from "./pages/app/LiveDrops.tsx";
import StudioNewDrop from "./pages/app/StudioNewDrop.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="missions" element={<MissionsApp />} />
              <Route path="levels" element={<Levels />} />
              <Route path="nfts" element={<NFTs />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="feed" element={<Feed />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="studio" element={<Studio />} />
              <Route path="studio/new" element={<StudioNewItem />} />
              <Route path="explorer" element={<Explorer />} />
              <Route path="vip" element={<VipClub />} />

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
