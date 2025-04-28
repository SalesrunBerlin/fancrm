
import { useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const isMobile = useIsMobile();
  
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
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`${isMobile ? 'fixed left-0 top-0 bottom-0 z-50' : ''} ${
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        } transition-transform duration-200 ease-in-out`}
      >
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={toggleSidebar} buttonRef={buttonRef} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 relative" style={{ isolation: "isolate" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
