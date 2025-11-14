import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "aurora" | "sunrise";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
};

const THEME_STORAGE_KEY = "stockly-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") return "aurora";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === "aurora" || stored === "sunrise") {
    return stored;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
    .matches;
  return prefersDark ? "aurora" : "sunrise";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());

  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    document.body?.setAttribute("data-theme", next);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "aurora" ? "sunrise" : "aurora"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
