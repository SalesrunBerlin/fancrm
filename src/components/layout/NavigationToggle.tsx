
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function NavigationToggle() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth");
  const [position, setPosition] = useState({ x: 15, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Don't show on auth pages
  if (isAuthPage) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate new position but keep it within viewport bounds
    const newX = Math.min(Math.max(0, e.clientX - 20), window.innerWidth - 40);
    const newY = Math.min(Math.max(0, e.clientY - 20), window.innerHeight - 40);
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  return (
    <Button 
      variant="secondary"
      size="icon"
      className={cn(
        "fixed rounded-full z-50 shadow-lg w-8 h-8",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        touchAction: "none"
      }}
      onClick={toggleSidebar}
      onMouseDown={handleMouseDown}
      onTouchStart={() => {}} // Add touch support later if needed
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
