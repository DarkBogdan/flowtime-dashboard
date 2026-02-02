const AUTH_KEY = "isAdmin";

export const authService = {
  login() {
    localStorage.setItem(AUTH_KEY, "true");
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === "true";
  }
};