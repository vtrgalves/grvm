import { NavLink, useLocation } from "react-router-dom";
import { Wallet, Trophy, Sparkles, Image, Ticket, LogOut, Rss, Crown, Mic, Boxes, Gem, Radio, User, BarChart3, Flame, Wand2, Zap, Package, Headphones } from "lucide-react";
import GrooviumHeartIcon from "@/components/web3/GrooviumHeartIcon";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import BetaBadge from "./BetaBadge";
import Web3Badges from "@/components/web3/Web3Badges";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const fanItems = [
  { title: "Meu Perfil", url: "/app/profile", icon: User },
  { title: "Feed", url: "/app/feed", icon: Rss },
  { title: "Ranking", url: "/app/ranking", icon: Crown },
  { title: "Wallet", url: "/app/wallet", icon: Wallet },
  { title: "Missões", url: "/app/missions", icon: Sparkles },
  { title: "Níveis", url: "/app/levels", icon: Trophy },
  { title: "Conquistas", url: "/app/badges", icon: Flame },
  { title: "Drops ao Vivo", url: "/app/live", icon: Radio },
  { title: "Clube VIP", url: "/app/vip", icon: Gem },
  { title: "Boosts", url: "/app/boosts", icon: Zap },
  { title: "Crates", url: "/app/crates", icon: Package },
  { title: "NFTs", url: "/app/nfts", icon: Image },
  { title: "Experiências", url: "/app/experiences", icon: Ticket },
  { title: "IA Groovium", url: "/app/ai", icon: Wand2 },
  { title: "Explorer", url: "/app/explorer", icon: Boxes },
];

const artistItems = [
  { title: "Dashboard", url: "/app/studio/dashboard", icon: BarChart3 },
  { title: "Studio", url: "/app/studio", icon: Mic, end: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const isArtist = profile?.profile_type === "musician";

  const isActive = (url: string, end?: boolean) => end ? pathname === url : pathname.startsWith(url);
  const heartActive = pathname === "/app" || pathname.startsWith("/app/heart") || pathname.startsWith("/app/oracle");

  const renderItem = (item: { title: string; url: string; icon: any; end?: boolean }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild isActive={isActive(item.url, item.end)}>
        <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
          <item.icon className="h-4 w-4" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderHeartItem = () => (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={heartActive}
        className={cn(
          "relative group transition-all duration-200",
          heartActive
            ? "!bg-[hsl(195_100%_50%/0.10)] !border !border-[hsl(195_100%_50%/0.45)] [box-shadow:0_0_12px_hsl(195_100%_50%/0.25)] !text-white hover:!bg-[hsl(195_100%_50%/0.14)]"
            : "hover:!bg-[linear-gradient(90deg,hsl(195_100%_50%/0.12),hsl(270_100%_58%/0.12))] hover:!border hover:!border-[hsl(195_100%_50%/0.30)]"
        )}
      >
        <NavLink to="/app" end className="flex items-center gap-2 relative">
          {heartActive && !collapsed && (
            <span
              aria-hidden
              className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[hsl(195_100%_50%)] [box-shadow:0_0_8px_hsl(195_100%_50%/0.8)]"
            />
          )}
          <GrooviumHeartIcon
            className="shrink-0 h-[18px] w-[18px] text-[hsl(195_100%_50%)]"
            animated={heartActive}
          />
          {!collapsed && (
            <>
              <span className="flex-1 font-medium text-[13px] tracking-wide">Groovium Heart</span>
              <span className="text-[9px] font-display font-bold tracking-[0.12em] px-1.5 py-0.5 rounded border bg-[hsl(330_100%_59%/0.12)] border-[hsl(330_100%_59%/0.25)] text-[hsl(330_100%_72%)]">
                HEART
              </span>
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5 border-b border-border/40">
          {!collapsed ? (
            <span className="font-display text-xl font-bold gradient-neon-text">GROOVIUM</span>
          ) : (
            <span className="font-display text-xl font-bold text-primary">G</span>
          )}
        </div>

        {!isArtist && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <div className="flex flex-col gap-0.5 px-2 pt-3 pb-2 h-auto">
                <div className="flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
                  <span className="font-display font-bold tracking-[0.18em] text-white text-[11px]">FÃ</span>
                </div>
                {!collapsed && (
                  <>
                    <span className="text-[10px] text-[#8B9BB4] normal-case tracking-normal leading-snug">
                      Quem apoia a música constrói reputação.
                    </span>
                    <div className="mt-1.5 h-px bg-gradient-to-r from-[hsl(195_100%_50%/0.4)] via-[hsl(270_100%_58%/0.2)] to-transparent" />
                  </>
                )}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderHeartItem()}
                {fanItems.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isArtist && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <div className="flex flex-col gap-0.5 px-2 pt-3 pb-2 h-auto">
                <div className="flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-[hsl(330_100%_59%)]" />
                  <span className="font-display font-bold tracking-[0.18em] text-white text-[11px]">ARTISTA</span>
                </div>
                {!collapsed && (
                  <>
                    <span className="text-[10px] text-[#8B9BB4] normal-case tracking-normal leading-snug">
                      Quem cria música constrói comunidade.
                    </span>
                    <div className="mt-1.5 h-px bg-gradient-to-r from-[hsl(330_100%_59%/0.4)] via-[hsl(270_100%_58%/0.2)] to-transparent" />
                  </>
                )}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderHeartItem()}
                {artistItems.map(renderItem)}
                {fanItems.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && (
          <div className="px-3 pb-2 flex flex-col items-center gap-2">
            <Web3Badges variant="compact" />
            <BetaBadge />
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
