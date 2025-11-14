import { useTheme } from "../state/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="ghost theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "aurora" ? "🌙 Aurora" : "🌅 Sunrise"}
    </button>
  );
}
