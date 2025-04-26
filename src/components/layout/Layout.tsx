
import { useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);
  
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);
  
  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} ref={sidebarRef} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={toggleSidebar} buttonRef={buttonRef} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 relative" style={{ isolation: "isolate" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
