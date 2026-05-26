import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import NotificationBell from "./NotificationBell";
import BetaBadge from "./BetaBadge";
import WelcomeOverlay from "./WelcomeOverlay";
import { GrvFxProvider } from "./GrvFxProvider";
import { useAuth } from "@/hooks/useAuth";
import { getLevel } from "@/lib/levels";
import { Coins } from "lucide-react";

export default function AppLayout() {
  const { profile } = useAuth();
  const level = profile ? getLevel(profile.grv_points) : null;

  return (
    <SidebarProvider>
      <GrvFxProvider>
      <WelcomeOverlay />
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/40 px-4 glass-card sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <BetaBadge />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              {profile && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="font-display font-bold text-primary text-sm">
                      {profile.grv_points.toLocaleString("pt-BR")} GRVM
                    </span>
                  </div>
                  {level && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
                      <span className="font-display font-bold text-accent text-xs uppercase tracking-wider">
                        {level.name}
                      </span>
                    </div>
                  )}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-background text-sm">
                    {profile.name?.[0]?.toUpperCase() ?? "G"}
                  </div>
                </>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      </GrvFxProvider>
    </SidebarProvider>
  );
}
