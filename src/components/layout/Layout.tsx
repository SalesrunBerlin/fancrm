
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
