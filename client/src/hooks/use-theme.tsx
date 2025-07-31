import { useState, useEffect } from "react";

type Theme = "theme-default" | "theme-luxury-gold" | "theme-elegant-dark";

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("theme-default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as Theme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const changeTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("app-theme", theme);
  };

  return { currentTheme, changeTheme };
}
