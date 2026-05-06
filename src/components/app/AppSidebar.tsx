import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, Trophy, Sparkles, Image, Ticket, LogOut, Rss, Crown, Mic, Boxes, Gem, Radio, User, BarChart3 } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const fanItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Meu Perfil", url: "/app/profile", icon: User },
  { title: "Feed", url: "/app/feed", icon: Rss },
  { title: "Ranking", url: "/app/ranking", icon: Crown },
  { title: "Wallet", url: "/app/wallet", icon: Wallet },
  { title: "Missões", url: "/app/missions", icon: Sparkles },
  { title: "Níveis", url: "/app/levels", icon: Trophy },
  { title: "Drops ao Vivo", url: "/app/live", icon: Radio },
  { title: "Clube VIP", url: "/app/vip", icon: Gem },
  { title: "NFTs", url: "/app/nfts", icon: Image },
  { title: "Experiências", url: "/app/experiences", icon: Ticket },
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
        <SidebarGroup>
          <SidebarGroupLabel>Fã</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{fanItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isArtist && (
          <SidebarGroup>
            <SidebarGroupLabel>Artista</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{artistItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
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
