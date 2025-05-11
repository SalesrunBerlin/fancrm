
import { useEffect, useCallback } from "react";
import { toast } from "sonner";

// Create a global counter for monitoring egress
let egressBytes = 0;
let warningShown = false;

export function useEgressMonitor() {
  // Function to track and log egress
  const trackEgress = useCallback((bytes: number, source: string) => {
    egressBytes += bytes;
    
    // Log to console for debugging
    console.log(`[Egress] ${formatBytes(bytes)} from ${source}, total: ${formatBytes(egressBytes)}`);
    
    // Show warning if egress is getting high
    if (egressBytes > 1024 * 1024 * 50 && !warningShown) { // 50MB threshold
      toast.warning("High database usage detected", {
        description: "Consider using more efficient queries to reduce database egress",
        duration: 5000
      });
      warningShown = true;
    }
  }, []);
  
  // Monkey patch fetch API to monitor Supabase REST API requests
  useEffect(() => {
    // Only in development to help with optimization
    if (process.env.NODE_ENV !== 'development') return;
    
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const response = await originalFetch(input, init);
      
      try {
        // Monitor only Supabase API calls
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
        if (url.includes('supabase.co')) {
          response.clone().text().then(text => {
            trackEgress(text.length, url.split('/').pop() || 'supabase');
          }).catch(e => {
            // Ignore errors in monitoring
          });
        }
      } catch (e) {
        // Don't break the app if monitoring fails
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [trackEgress]);
  
  return {
    trackEgress,
    getTotalEgress: () => egressBytes,
    resetEgressCounter: () => { egressBytes = 0; warningShown = false; }
  };
}

// Helper to format bytes in a human-readable way
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
