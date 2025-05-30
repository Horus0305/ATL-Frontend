import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavProjects({ projects }) {
  const { isMobile } = useSidebar();
  const location = useLocation(); // Get the current route

  // Memoize menu items
  const menuItems = React.useMemo(
    () =>
      projects.map((item) => {
        const isActive = location.pathname === item.url; // Check if this project is active

        // If the item has a component, render it as a clickable button
        if (item.component) {
          const Component = item.component;
          return (
            <SidebarMenuItem key={item.name}>
              <Component>
                <SidebarMenuButton 
                  asChild
                  className="select-none"
                >
                  <div className={`flex items-center w-full gap-2 p-2 relative hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${
                    isActive ? "bg-gray-200 dark:bg-gray-800" : ""
                  }`}>
                    <item.icon className={`${
                      isActive 
                        ? "text-black dark:text-white" 
                        : "text-gray-500 dark:text-gray-400"
                    }`} />
                    <span className={`${
                      isActive 
                        ? "text-black dark:text-white font-semibold" 
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {item.name}
                    </span>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                </SidebarMenuButton>
              </Component>
            </SidebarMenuItem>
          );
        }

        // Otherwise render the normal Link
        return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className={
                isActive ? "bg-gray-200 dark:bg-gray-800 rounded-md" : ""
              }
            >
              <Link
                to={item.url}
                className="flex items-center w-full gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <item.icon
                  className={`${
                    isActive 
                      ? "text-black dark:text-white" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
                <span className={`${
                  isActive 
                    ? "text-black dark:text-white font-semibold" 
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {item.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }),
    [projects, location.pathname]
  );

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>{menuItems}</SidebarMenu>
    </SidebarGroup>
  );
}
