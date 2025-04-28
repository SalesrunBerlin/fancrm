
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useColorPreferences } from "./useColorPreferences";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });
  
  const { preferences, savePreferences } = useColorPreferences();

  // Apply theme whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save theme to database when it changes, but only if we have preferences loaded
  useEffect(() => {
    if (preferences && preferences.theme !== theme) {
      savePreferences({
        ...preferences,
        theme: theme,
      });
    }
  }, [theme, preferences, savePreferences]);

  const setTheme = (theme: Theme) => setThemeState(theme);
  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
