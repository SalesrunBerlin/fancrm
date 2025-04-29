
import { Header } from "./Header";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full overflow-hidden relative bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6 relative" style={{ isolation: "isolate" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
