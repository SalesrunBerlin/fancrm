import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavigationToggle() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth");
  const [position, setPosition] = useState({ x: 15, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();
  
  // Don't show on auth pages
  if (isAuthPage) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable dragging on mobile
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isMobile) return;
    
    // Calculate new position but keep it within viewport bounds
    const newX = Math.min(Math.max(0, e.clientX - 20), window.innerWidth - 40);
    const newY = Math.min(Math.max(0, e.clientY - 20), window.innerHeight - 40);
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    // Don't set dragging state on mobile, just capture the touch
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Mobile touch events specifically blocked - toggle should stay fixed on mobile
    e.preventDefault();
  };

  // Add and clean up mouse move and up event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const mobilePosition = { x: 10, y: 70 };
  const buttonPosition = isMobile ? mobilePosition : position;

  return (
    <Button 
      variant="secondary"
      size="icon"
      className={cn(
        "fixed rounded-full z-50 shadow-lg w-8 h-8",
        isMobile ? "cursor-pointer" : (isDragging ? "cursor-grabbing" : "cursor-grab")
      )}
      style={{ 
        left: `${buttonPosition.x}px`, 
        top: `${buttonPosition.y}px`,
        touchAction: "none"
      }}
      onClick={toggleSidebar}
      onMouseDown={isMobile ? undefined : handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
