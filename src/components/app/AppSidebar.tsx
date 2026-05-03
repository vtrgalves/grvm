import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, Trophy, Sparkles, Image, Ticket, LogOut, Rss, Crown, Mic } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const fanItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Feed", url: "/app/feed", icon: Rss },
  { title: "Ranking", url: "/app/ranking", icon: Crown },
  { title: "Wallet", url: "/app/wallet", icon: Wallet },
  { title: "Missões", url: "/app/missions", icon: Sparkles },
  { title: "Níveis", url: "/app/levels", icon: Trophy },
  { title: "NFTs", url: "/app/nfts", icon: Image },
  { title: "Experiências", url: "/app/experiences", icon: Ticket },
];

const artistItem = { title: "Studio", url: "/app/studio", icon: Mic };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (url: string, end?: boolean) => end ? pathname === url : pathname.startsWith(url);

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
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.end)}>
                    <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
