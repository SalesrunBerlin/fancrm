
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// Pagination settings
const PAGE_SIZE = 10;

interface UserSessionStats {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  total_sessions: number;
  total_activities: number;
  avg_session_duration: number | null;
  last_login: string | null;
}

interface SessionDetails {
  id: string;
  user_id: string;
  login_time: string;
  logout_time: string | null;
  is_active: boolean;
  user_agent: string;
  ip_address: string;
  last_activity_time: string | null;
  session_duration_seconds: number | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  activities_count: number;
}

export function useUserSessions(page = 1, filterOptions = {}) {
  const { isSuperAdmin } = useAuth();
  const [totalPages, setTotalPages] = useState(1);

  // Query for user session statistics (aggregated data)
  const {
    data: sessionStats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["user-session-stats"],
    queryFn: async () => {
      if (!isSuperAdmin) throw new Error("Unauthorized");
      
      const { data, error } = await supabase
        .from("admin_user_session_stats")
        .select("*");
      
      if (error) throw error;
      return data as UserSessionStats[];
    },
    enabled: isSuperAdmin,
    staleTime: 60000, // 1 minute before considering data stale
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Query for detailed session data with pagination
  const {
    data: sessionDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails
  } = useQuery({
    queryKey: ["user-sessions", page, filterOptions],
    queryFn: async () => {
      if (!isSuperAdmin) throw new Error("Unauthorized");

      // Count total rows for pagination
      const { count, error: countError } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true });
      
      if (countError) throw countError;
      
      if (count) {
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      }

      // Fetch the actual data with pagination
      let query = supabase
        .from("user_sessions")
        .select(`
          *,
          profiles:user_id (email, first_name, last_name),
          activities_count:user_activities (count)
        `)
        .order('login_time', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      
      // Apply filters if provided
      // Filter logic can be extended here based on filterOptions
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data for easier consumption
      return data.map(session => ({
        ...session,
        email: session.profiles?.email,
        first_name: session.profiles?.first_name,
        last_name: session.profiles?.last_name,
        activities_count: session.activities_count?.[0]?.count || 0
      })) as SessionDetails[];
    },
    enabled: isSuperAdmin,
    staleTime: 30000, // 30 seconds before considering data stale
    keepPreviousData: true, // Keep previous data while loading new data
  });

  return {
    sessionStats,
    sessionDetails,
    isLoadingStats,
    isLoadingDetails,
    statsError,
    detailsError,
    refetchStats,
    refetchDetails,
    pagination: {
      currentPage: page,
      totalPages
    }
  };
}
