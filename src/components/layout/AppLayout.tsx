
// Track page visits
import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackActivity } from "@/services/ActivityTrackingService";
import { Toaster } from "@/components/ui/toaster";

export function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Track page views
  useEffect(() => {
    if (user) {
      trackActivity(
        user.id,
        'view_page',
        'Page viewed',
        undefined,
        undefined,
        { path: location.pathname }
      );
    }
  }, [location.pathname, user]);
  
  return (
    <div className="min-h-screen">
      <Outlet />
      <Toaster />
    </div>
  );
}
