
import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | 'object_create' 
  | 'object_update' 
  | 'object_delete'
  | 'field_create'
  | 'field_update'
  | 'field_delete'
  | 'record_create'
  | 'record_update'
  | 'record_delete'
  | 'action_create'
  | 'action_update'
  | 'action_delete'
  | 'app_create'
  | 'app_update'
  | 'app_delete'
  | 'login'
  | 'logout'
  | 'view_page';

interface ActivityDetails {
  [key: string]: any;
}

let currentSessionId: string | null = null;

/**
 * Creates a new user session when a user logs in
 */
export const startUserSession = async (userId: string): Promise<string | null> => {
  try {
    // Get user agent and IP information
    let userAgent = '';
    let ipAddress = '';
    
    if (typeof window !== 'undefined') {
      userAgent = window.navigator.userAgent;
    }
    
    // Create a new session
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting user session:', error);
      return null;
    }

    currentSessionId = data.id;
    return data.id;
  } catch (err) {
    console.error('Failed to start user session:', err);
    return null;
  }
};

/**
 * Ends a user session when a user logs out
 */
export const endUserSession = async (): Promise<boolean> => {
  try {
    if (!currentSessionId) {
      // Try to find the active session
      const { data } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (data) {
        currentSessionId = data.id;
      } else {
        console.warn('No active session found');
        return false;
      }
    }

    // Update the session to mark it as ended
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        logout_time: new Date().toISOString()
      })
      .eq('id', currentSessionId);

    if (error) {
      console.error('Error ending user session:', error);
      return false;
    }

    currentSessionId = null;
    return true;
  } catch (err) {
    console.error('Failed to end user session:', err);
    return false;
  }
};

/**
 * Track a user activity
 */
export const trackActivity = async (
  userId: string,
  activityType: ActivityType,
  action: string,
  objectType?: string,
  objectId?: string,
  details?: ActivityDetails
): Promise<boolean> => {
  try {
    if (!userId) {
      console.warn('Cannot track activity: No user ID provided');
      return false;
    }

    // If no current session, try to find the active session
    if (!currentSessionId) {
      const { data } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('login_time', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        currentSessionId = data.id;
      } else {
        // No active session found, create one
        const newSessionId = await startUserSession(userId);
        if (!newSessionId) {
          console.error('Failed to create session for activity tracking');
          return false;
        }
      }
    }

    // Insert the activity
    const { error } = await supabase
      .from('user_activities')
      .insert({
        session_id: currentSessionId,
        user_id: userId,
        activity_type: activityType,
        action,
        object_type: objectType,
        object_id: objectId,
        details: details || {}
      });

    if (error) {
      console.error('Error tracking activity:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to track activity:', err);
    return false;
  }
};

/**
 * Update the session's last activity time
 */
export const updateLastActivity = async (): Promise<void> => {
  try {
    if (!currentSessionId) return;

    await supabase
      .from('user_sessions')
      .update({ last_activity_time: new Date().toISOString() })
      .eq('id', currentSessionId);
  } catch (err) {
    console.error('Failed to update last activity time:', err);
  }
};

/**
 * Setup a periodic heartbeat to update the last_activity_time
 */
export const setupActivityHeartbeat = (intervalMs = 60000): () => void => {
  const intervalId = setInterval(updateLastActivity, intervalMs);
  return () => clearInterval(intervalId);
};

/**
 * Retrieve the current session ID
 */
export const getCurrentSessionId = (): string | null => {
  return currentSessionId;
};
