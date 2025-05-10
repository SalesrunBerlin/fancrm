
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserSession {
  id: string;
  user_id: string;
  login_time: string;
  last_activity_time: string;
  logout_time: string | null;
  is_active: boolean;
  session_duration_seconds: number | null;
  user_agent: string;
  ip_address: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface UserActivity {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: string;
  action: string;
  object_type: string | null;
  object_id: string | null;
  details: any;
  timestamp: string;
  created_at: string;
  user_email?: string;
}

export interface SessionStats {
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  total_sessions: number;
  total_duration_seconds: number | null;
  avg_session_duration: number | null;
  last_login: string;
  total_activities: number;
}

export function useUserSessions() {
  const { user, isSuperAdmin } = useAuth();

  // Get all user session stats (for superadmin only)
  const { data: sessionStats, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["user-session-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_user_session_stats')
        .select('*');

      if (error) {
        throw error;
      }

      return data as SessionStats[];
    },
    enabled: !!isSuperAdmin,
  });

  // Get detailed sessions for a specific user
  const getUserSessions = (userId: string | undefined) => {
    return useQuery({
      queryKey: ["user-sessions", userId],
      queryFn: async () => {
        if (!userId) return [];
        
        // Join with auth.users to get email
        const { data, error } = await supabase
          .from('user_sessions')
          .select(`
            *,
            user_email:user_id (email)
          `)
          .eq('user_id', userId)
          .order('login_time', { ascending: false });

        if (error) {
          throw error;
        }

        return data.map(session => ({
          ...session,
          user_email: session.user_email ? session.user_email.email : undefined
        })) as UserSession[];
      },
      enabled: !!userId && !!isSuperAdmin,
    });
  };

  // Get activities for a specific session
  const getSessionActivities = (sessionId: string | undefined) => {
    return useQuery({
      queryKey: ["session-activities", sessionId],
      queryFn: async () => {
        if (!sessionId) return [];

        const { data, error } = await supabase
          .from('user_activities')
          .select(`
            *,
            user_email:user_id (email)
          `)
          .eq('session_id', sessionId)
          .order('timestamp', { ascending: true });

        if (error) {
          throw error;
        }

        return data.map(activity => ({
          ...activity,
          user_email: activity.user_email ? activity.user_email.email : undefined
        })) as UserActivity[];
      },
      enabled: !!sessionId && !!isSuperAdmin,
    });
  };

  // Get all activities for a specific user
  const getUserActivities = (userId: string | undefined) => {
    return useQuery({
      queryKey: ["user-activities", userId],
      queryFn: async () => {
        if (!userId) return [];

        const { data, error } = await supabase
          .from('user_activities')
          .select(`
            *,
            user_email:user_id (email)
          `)
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (error) {
          throw error;
        }

        return data.map(activity => ({
          ...activity,
          user_email: activity.user_email ? activity.user_email.email : undefined
        })) as UserActivity[];
      },
      enabled: !!userId && !!isSuperAdmin,
    });
  };

  return {
    sessionStats,
    isLoadingStats,
    statsError,
    refetchStats,
    getUserSessions,
    getSessionActivities,
    getUserActivities
  };
}
