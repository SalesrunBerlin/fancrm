
import { Header } from "./Header";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider } from "@/components/ui/sidebar";

export function Layout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full overflow-hidden relative bg-background">
        <Sidebar />
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
