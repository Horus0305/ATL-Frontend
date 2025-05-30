import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { User, TestTubeDiagonal, PieChart, ShieldCheck, Wrench, WrenchIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SectionHeadPage() {
    const { user } = useAuth();
    const isMechanical = user.role === 2;

    const data = {
        user: {
          name: user.firstname + " " + user.lastname,
          avatar: User
        },
        teams: [
          {
            name: user.firstname + " " + user.lastname,
            logo: isMechanical? WrenchIcon : TestTubeDiagonal,
            plan: isMechanical ? "Mechanical Section Head" : "Chemical Section Head",
          },
        ],
        sidebarlinks: [
          {
            name: "Home",
            url: "/sectionhead",
            icon: PieChart,
          },
          {
            name: "Tests",
            url: "/sectionhead/tests",
            icon: ShieldCheck,
          },
          {
            name: "Equipments",
            url: "/sectionhead/equipments",
            icon: Wrench,
          },
        ],
    };

    return (
        <SidebarProvider>
            <AppSidebar data={data}/>
            <SidebarInset>
                <header className="flex h-5 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    {/* ... existing header content ... */}
                </header>
                <div className="flex flex-col flex-1 gap-4 p-4 pt-0">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
} 