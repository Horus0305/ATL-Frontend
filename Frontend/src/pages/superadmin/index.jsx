import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User, TestTubeDiagonal, Wrench, PieChart, ShieldCheck, Users } from "lucide-react";


export default function SuperAdminPage() {
    const data = {
        user: {
          name: "Sadanand Govilkar",
          avatar: "https://www.avant-techlab.com/Avant/wp-content/uploads/2023/07/sadanand.jpeg",
        },
        teams: [
          {
            name: "Me",
            logo: User,
            plan: "Superadmin",
          }
        ],
        sidebarlinks: [
          {
            name: "Home",
            url: "/superadmin",
            icon: PieChart,
          },
          {
            name: "Tests",
            url: "/superadmin/tests",
            icon: ShieldCheck,
          },
          {
            name: "Users",
            url: "/superadmin/users",
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