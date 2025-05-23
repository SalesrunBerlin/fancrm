
import { Header } from "./Header";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function Layout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden relative bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <Header />
          <main 
            className={`flex-1 overflow-auto relative ${isMobile ? 'p-2' : 'p-2 md:p-4'}`} 
            style={{ isolation: "isolate" }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
