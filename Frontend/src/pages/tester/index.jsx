import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User, TestTubeDiagonal, PieChart } from "lucide-react";

export default function TesterPage() {
    const data = {
        user: {
          name: "Tester",
          avatar: User,
          email: "tester@avant.com"  
        },
        teams: [
          {
            name: "Me",
            logo: User,
            plan: "Tester",
          },
        ],
        sidebarlinks: [
          {
            name: "Test Details",
            url: "/tester",
            icon: TestTubeDiagonal,
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