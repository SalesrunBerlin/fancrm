
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

interface PendingActivity {
  userId: string;
  activityType: ActivityType;
  action: string;
  objectType?: string;
  objectId?: string;
  details?: ActivityDetails;
  timestamp: number;
}

let currentSessionId: string | null = null;
let pendingActivities: PendingActivity[] = [];
let activityBatchTimeout: number | null = null;
const BATCH_INTERVAL = 2000; // 2 seconds
const MAX_BATCH_SIZE = 10;

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
    // Process any pending activities before ending session
    if (pendingActivities.length > 0) {
      await processPendingActivities();
    }
    
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
 * Schedule processing of pending activities
 */
const scheduleBatchProcessing = () => {
  if (activityBatchTimeout !== null) {
    return;
  }
  
  activityBatchTimeout = window.setTimeout(async () => {
    await processPendingActivities();
    activityBatchTimeout = null;
    
    // If there are still pending activities after processing, schedule another batch
    if (pendingActivities.length > 0) {
      scheduleBatchProcessing();
    }
  }, BATCH_INTERVAL);
};

/**
 * Process pending activities in batches
 */
const processPendingActivities = async () => {
  if (pendingActivities.length === 0) return;
  
  // Get the current batch (up to MAX_BATCH_SIZE activities)
  const batch = pendingActivities.splice(0, MAX_BATCH_SIZE);
  
  try {
    // Ensure we have a session for at least one user in the batch
    if (!currentSessionId) {
      const firstUserId = batch[0].userId;
      const { data } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', firstUserId)
        .eq('is_active', true)
        .order('login_time', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        currentSessionId = data.id;
      } else {
        // Create a new session if none exists
        const newSessionId = await startUserSession(firstUserId);
        if (!newSessionId) {
          console.error('Failed to create session for activity tracking');
          // Add activities back to queue
          pendingActivities = [...batch, ...pendingActivities];
          return;
        }
      }
    }
    
    // Prepare activities for batch insert
    const activitiesToInsert = batch.map(activity => ({
      session_id: currentSessionId,
      user_id: activity.userId,
      activity_type: activity.activityType,
      action: activity.action,
      object_type: activity.objectType,
      object_id: activity.objectId,
      details: activity.details || {},
      created_at: new Date(activity.timestamp).toISOString()
    }));
    
    // Insert activities in batch
    const { error } = await supabase
      .from('user_activities')
      .insert(activitiesToInsert);
      
    if (error) {
      console.error('Error batch tracking activities:', error);
      // Add activities back to queue on failure
      pendingActivities = [...batch, ...pendingActivities];
    }
    
  } catch (err) {
    console.error('Failed to process activity batch:', err);
    // Add activities back to queue on failure
    pendingActivities = [...batch, ...pendingActivities];
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

    // Add activity to pending queue
    pendingActivities.push({
      userId,
      activityType,
      action,
      objectType,
      objectId,
      details,
      timestamp: Date.now()
    });
    
    // Schedule batch processing
    scheduleBatchProcessing();
    
    // Process immediately if we have enough activities
    if (pendingActivities.length >= MAX_BATCH_SIZE) {
      if (activityBatchTimeout !== null) {
        clearTimeout(activityBatchTimeout);
        activityBatchTimeout = null;
      }
      await processPendingActivities();
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
  const intervalId = setInterval(() => {
    // Throttle activity updates to reduce database load
    updateLastActivity();
    
    // Process any pending activities
    if (pendingActivities.length > 0 && activityBatchTimeout === null) {
      processPendingActivities();
    }
  }, intervalMs);
  
  return () => clearInterval(intervalId);
};

/**
 * Retrieve the current session ID
 */
export const getCurrentSessionId = (): string | null => {
  return currentSessionId;
};

/**
 * Force process all pending activities immediately
 * Useful when navigating away from the app or during critical operations
 */
export const flushPendingActivities = async (): Promise<void> => {
  if (activityBatchTimeout !== null) {
    clearTimeout(activityBatchTimeout);
    activityBatchTimeout = null;
  }
  
  await processPendingActivities();
};

// Add event listener for beforeunload to flush pending activities
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingActivities();
  });
}
