import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User, TestTubeDiagonal, Wrench, PieChart, ShieldCheck, Users } from "lucide-react";


export default function ReceptionistPage() {
    const data = {
        user: {
          name: "Receptionist",
          avatar: User
        },
        teams: [
          {
            name: "Me",
            logo: User,
            plan: "Receptionist",
          },
        ],
        sidebarlinks: [
          {
            name: "Home",
            url: "/receptionist",
            icon: PieChart,
          },
          {
            name: "Material Tests",
            url: "/receptionist/materialTests",
            icon: ShieldCheck,
          },
          {
            name: "Clients",
            url: "/receptionist/clients",
            icon: Users,
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