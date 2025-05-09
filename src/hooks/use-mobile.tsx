
import { useState, useEffect } from "react";

export function useIsMobile() {
  // Initialize with null to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Set initial value once we're in the browser
    setIsMobile(window.innerWidth < 768);

    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // During SSR or initial render, default to false
  return isMobile === null ? false : isMobile;
}
