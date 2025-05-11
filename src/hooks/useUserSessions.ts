
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

  // Query for user session statistics using the optimized view
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
        .from("admin_user_session_stats_optimized")
        .select("*");
      
      if (error) throw error;
      return data as UserSessionStats[];
    },
    enabled: isSuperAdmin,
    staleTime: 300000, // 5 minutes before considering data stale (increased from 1 minute)
    cacheTime: 1800000, // Cache for 30 minutes (increased from 5 minutes)
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

      // Count total rows for pagination - Use an optimized count query
      const { count, error: countError } = await supabase
        .from("user_sessions")
        .select("id", { count: "exact", head: true })
        .order('login_time', { ascending: false })
        // Add time filter to reduce data volume
        .gte('login_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      
      if (countError) throw countError;
      
      if (count) {
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      }

      // Fetch the actual data with pagination
      let query = supabase
        .from("user_sessions")
        .select(`
          id,
          user_id,
          login_time,
          logout_time,
          is_active,
          user_agent,
          ip_address,
          last_activity_time,
          session_duration_seconds,
          profiles:user_id (email, first_name, last_name),
          activities_count:user_activities (count)
        `)
        .order('login_time', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
        // Add time filter to reduce data volume
        .gte('login_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      
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
    staleTime: 120000, // 2 minutes before considering data stale (increased from 30 seconds)
    keepPreviousData: true, // Keep previous data while loading new data
  });

  // New function to get user sessions by ID
  const getUserSessions = (userId) => {
    return useQuery({
      queryKey: ["user-sessions-by-id", userId],
      queryFn: async () => {
        if (!isSuperAdmin || !userId) throw new Error("Unauthorized or invalid user ID");
        
        const { data, error } = await supabase
          .from("user_sessions")
          .select("*")
          .eq("user_id", userId)
          .order('login_time', { ascending: false })
          // Add time filter to reduce data volume
          .gte('login_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
        
        if (error) throw error;
        return data;
      },
      enabled: isSuperAdmin && !!userId,
      staleTime: 120000, // 2 minutes
    });
  };

  // New function to get session activities
  const getSessionActivities = (sessionId) => {
    return useQuery({
      queryKey: ["session-activities", sessionId],
      queryFn: async () => {
        if (!isSuperAdmin || !sessionId) throw new Error("Unauthorized or invalid session ID");
        
        const { data, error } = await supabase
          .from("user_activities")
          .select("*, profiles:user_id(email) as user_email")
          .eq("session_id", sessionId)
          .order('timestamp', { ascending: false });
        
        if (error) throw error;
        return data;
      },
      enabled: isSuperAdmin && !!sessionId,
      staleTime: 120000, // 2 minutes
    });
  };

  return {
    sessionStats,
    sessionDetails,
    isLoadingStats,
    isLoadingDetails,
    statsError,
    detailsError,
    refetchStats,
    refetchDetails,
    getUserSessions,
    getSessionActivities,
    pagination: {
      currentPage: page,
      totalPages
    }
  };
}
