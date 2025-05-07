
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { AppSidebar } from "./AppSidebar";
import { NavigationToggle } from "./NavigationToggle";
import { useMobile } from "@/hooks/use-mobile";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <Header>
          {isMobile && (
            <NavigationToggle onToggle={toggleSidebar} className="mr-2" />
          )}
        </Header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
