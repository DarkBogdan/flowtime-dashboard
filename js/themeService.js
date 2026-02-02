const THEME_KEY = "theme";

export const themeService = {
  init() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    this.applyTheme(savedTheme);
  },

  toggleTheme() {
    const nextTheme = this.getTheme() === "dark" ? "light" : "dark";
    this.applyTheme(nextTheme);
  },

  applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem(THEME_KEY, theme);
  },

  getTheme() {
    return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  }
};

