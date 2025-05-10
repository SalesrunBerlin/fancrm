
import { useState, useEffect } from "react";

export function useIsMobile() {
  // Initialize with null to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Function to check if we're on mobile
    const checkMobile = () => {
      // Using 768px as the breakpoint for mobile devices (md in Tailwind)
      return window.innerWidth < 768;
    };
    
    // Set initial value once we're in the browser
    setIsMobile(checkMobile());

    function handleResize() {
      setIsMobile(checkMobile());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // During SSR or initial render, default to false
  return isMobile === null ? false : isMobile;
}
