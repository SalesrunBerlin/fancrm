
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Theme = "light" | "dark";

interface ProfileTheme {
  profile_id: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  font_weight: number;
  font_width: number;
  radius_scale: string;
  shadow_level: string;
  density: string;
  icon_pack: string;
  logo_url: string | null;
}

interface ThemeContextType {
  theme: Theme;
  profileTheme: ProfileTheme | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  updateProfileTheme: (updates: Partial<ProfileTheme>) => Promise<void>;
  isLoading: boolean;
}

const defaultTheme: ProfileTheme = {
  profile_id: "",
  primary_color: "#2563eb", // blue-600
  accent_color: "#f97316", // orange-500
  font_family: "Inter",
  font_weight: 400,
  font_width: 100,
  radius_scale: "md",
  shadow_level: "sm",
  density: "comfortable",
  icon_pack: "lucide",
  logo_url: null
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to convert hex to HSL values for CSS variables
function hexToHSL(hex: string): string {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find the min and max values to calculate saturation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate HSL values
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h *= 60;
  }
  
  // Return the HSL values in the format needed for CSS variables
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getRadiusValue(scale: string): Record<string, string> {
  const scales: Record<string, Record<string, string>> = {
    none: { sm: "0px", md: "0px", lg: "0px" },
    sm: { sm: "2px", md: "4px", lg: "6px" },
    md: { sm: "4px", md: "6px", lg: "8px" },
    lg: { sm: "8px", md: "12px", lg: "16px" },
    full: { sm: "9999px", md: "9999px", lg: "9999px" },
  };
  
  return scales[scale] || scales.md;
}

function getShadowValue(level: string): string {
  const shadows: Record<string, string> = {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  };
  
  return shadows[level] || shadows.sm;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });
  const [profileTheme, setProfileTheme] = useState<ProfileTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's theme when authenticated
  useEffect(() => {
    async function loadProfileTheme() {
      if (!user) {
        setProfileTheme(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ui_theme_profile')
          .select('*')
          .eq('profile_id', user.id)
          .single();
          
        if (error) {
          console.error("Error loading theme:", error);
          setProfileTheme(null);
        } else {
          setProfileTheme(data as ProfileTheme);
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfileTheme();
  }, [user]);
  
  // Apply theme colors to CSS variables
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    
    // Apply profile theme if available
    if (profileTheme) {
      // Create a style element to hold our CSS variables
      let styleEl = document.getElementById("theme-vars");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "theme-vars";
        document.head.appendChild(styleEl);
      }
      
      // Get radius and shadow values
      const radius = getRadiusValue(profileTheme.radius_scale);
      const shadow = getShadowValue(profileTheme.shadow_level);
      
      // Convert hex colors to HSL
      const primaryHSL = hexToHSL(profileTheme.primary_color);
      const accentHSL = hexToHSL(profileTheme.accent_color);
      
      // Set custom properties
      styleEl.innerHTML = `
        :root {
          --font-family: ${profileTheme.font_family}, system-ui, sans-serif;
          --font-weight: ${profileTheme.font_weight};
          --font-width: ${profileTheme.font_width};
          --radius-sm: ${radius.sm};
          --radius-md: ${radius.md};
          --radius-lg: ${radius.lg};
          --shadow: ${shadow};
          --density-scale: ${profileTheme.density === 'compact' ? '0.75' : '1'};
          --color-primary: hsl(${primaryHSL});
          --color-primary-foreground: hsl(0 0% 98%);
          --color-accent: hsl(${accentHSL});
          --color-accent-foreground: hsl(0 0% 98%);
          --color-beauty: var(--color-primary);
          --color-beauty-light: hsl(${primaryHSL.split(' ')[0]} 80% 95%);
          --color-beauty-dark: hsl(${primaryHSL.split(' ')[0]} 80% 40%);
        }
        
        html[data-theme="light"] {
          --color-secondary: hsl(0 0% 96.1%);
          --color-secondary-foreground: hsl(0 0% 9%);
          --color-card: hsl(0 0% 100%);
          --color-card-foreground: hsl(0 0% 3.9%);
          --color-popover: hsl(0 0% 100%);
          --color-popover-foreground: hsl(0 0% 3.9%);
          --color-muted: hsl(0 0% 96.1%);
          --color-muted-foreground: hsl(0 0% 45.1%);
          --color-destructive: hsl(0 84.2% 60.2%);
          --color-destructive-foreground: hsl(0 0% 98%);
          --color-border: hsl(0 0% 89.8%);
          --color-input: hsl(0 0% 89.8%);
          --color-ring: hsl(${primaryHSL});
          --color-background: hsl(0 0% 100%);
          --color-foreground: hsl(0 0% 3.9%);
        }
        
        html[data-theme="dark"] {
          --color-secondary: hsl(0 0% 14.9%);
          --color-secondary-foreground: hsl(0 0% 98%);
          --color-card: hsl(0 0% 3.9%);
          --color-card-foreground: hsl(0 0% 98%);
          --color-popover: hsl(0 0% 3.9%);
          --color-popover-foreground: hsl(0 0% 98%);
          --color-muted: hsl(0 0% 14.9%);
          --color-muted-foreground: hsl(0 0% 63.9%);
          --color-destructive: hsl(0 62.8% 30.6%);
          --color-destructive-foreground: hsl(0 0% 98%);
          --color-border: hsl(0 0% 14.9%);
          --color-input: hsl(0 0% 14.9%);
          --color-ring: hsl(${primaryHSL});
          --color-background: hsl(0 0% 3.9%);
          --color-foreground: hsl(0 0% 98%);
        }
        
        body {
          font-family: var(--font-family);
          font-weight: var(--font-weight);
          font-stretch: var(--font-width);
        }
        
        .font-feature-settings {
          font-feature-settings: "wght" var(--font-weight), "wdth" var(--font-width);
        }
      `;
      
      // Also apply the theme as a data attribute
      document.documentElement.setAttribute("data-theme", "custom");
    } else {
      // Remove custom theme if not available
      const styleEl = document.getElementById("theme-vars");
      if (styleEl) styleEl.remove();
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme, profileTheme]);

  const setTheme = (theme: Theme) => setThemeState(theme);
  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  
  // Function to update profile theme
  const updateProfileTheme = async (updates: Partial<ProfileTheme>) => {
    if (!user || !profileTheme) return;
    
    try {
      const updatedTheme = { ...profileTheme, ...updates };
      
      const { error } = await supabase
        .from('ui_theme_profile')
        .update(updates)
        .eq('profile_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setProfileTheme(updatedTheme);
      
      // Dispatch event for real-time updates across components
      window.dispatchEvent(new CustomEvent('themeUpdated', { detail: updatedTheme }));
      
    } catch (err) {
      console.error("Failed to update theme:", err);
      throw err;
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      profileTheme, 
      updateProfileTheme,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
