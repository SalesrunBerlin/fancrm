
import { Header } from "./Header";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NavigationToggle } from "./NavigationToggle";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden relative bg-background">
        <NavigationToggle />
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 overflow-auto p-2 md:p-4 relative" style={{ isolation: "isolate" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
