const STORAGE_KEY = "timeClockState";

export const timerService = {
  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
