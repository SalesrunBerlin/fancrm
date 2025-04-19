
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Building
} from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && isOpen && e.target instanceof Element) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
          onClose();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      <aside
        id="sidebar"
        className={cn(
          "fixed md:sticky top-0 h-screen bg-sidebar z-50 border-r transition-all duration-300 ease-in-out",
          isOpen ? "left-0" : "-left-64 md:left-0",
          isMobile ? "w-64" : isOpen ? "w-64" : "w-20",
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className={cn(
            "flex items-center justify-between h-16 px-4 border-b",
            !isOpen && !isMobile && "justify-center"
          )}>
            {(isOpen || isMobile) ? (
              <h1 className="font-bold text-xl text-beauty-dark">CRMbeauty</h1>
            ) : (
              <span className="font-bold text-xl text-beauty-dark">CRM</span>
            )}
            
            {(isOpen || isMobile) && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="md:hidden"
              >
                <span className="sr-only">Close sidebar</span>
                ✕
              </Button>
            )}
          </div>
          
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="px-3 py-2">
              {!isOpen && !isMobile && <p className="mb-2 text-xs text-center text-muted-foreground">Menu</p>}
              <ul className="space-y-1">
                <li>
                  <Link to="/dashboard">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        !isOpen && !isMobile && "justify-center"
                      )}
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      {(isOpen || isMobile) && <span>Dashboard</span>}
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link to="/contacts">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        !isOpen && !isMobile && "justify-center"
                      )}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      {(isOpen || isMobile) && <span>Contacts</span>}
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link to="/accounts">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        !isOpen && !isMobile && "justify-center"
                      )}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      {(isOpen || isMobile) && <span>Accounts</span>}
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link to="/deals">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        !isOpen && !isMobile && "justify-center"
                      )}
                    >
                      <Briefcase className="h-5 w-5 mr-2" />
                      {(isOpen || isMobile) && <span>Deals</span>}
                    </Button>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
          
          <div className={cn(
            "flex items-center p-4 border-t",
            !isOpen && !isMobile && "justify-center"
          )}>
            <Button 
              variant="outline" 
              size={!isOpen && !isMobile ? "icon" : "default"}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              {(isOpen || isMobile) && <span>Create New</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
