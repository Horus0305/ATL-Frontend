import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";

export function TeamSwitcher({ teams }) {
  const { user } = useAuth();
  const activeTeam = teams[0];

  const getRoleText = (role) => {
    switch (role) {
      case 0: return 'Super Admin';
      case 1: return 'Chemical Section Head';
      case 2: return 'Mechanical Section Head';
      case 3: return 'Receptionist';
      case 4: return 'Mechanical Tester';
      case 5: return 'Chemical Tester';
      default: return 'Unknown Role';
    }
  };

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <SidebarMenu className="flex-1">
        <SidebarMenuItem className="w-full">
          <SidebarMenuButton
            size="lg"
            className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex items-center justify-center rounded-lg aspect-square size-8 bg-sidebar-primary text-sidebar-primary-foreground">
              <activeTeam.logo className="size-4" />
            </div>
            <div className="grid flex-1 text-sm leading-tight text-left min-w-0">
              <span className="font-semibold truncate">
                {user?.firstname} {user?.lastname}
              </span>
              <span className="text-xs truncate">{getRoleText(user?.role)}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <ThemeToggle />
    </div>
  );
}
