(() => {
  const STORAGE_KEY = "genavatar-theme";
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia("(prefers-color-scheme: light)");

  const readStoredTheme = () => {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : undefined;
    } catch {
      return undefined;
    }
  };

  const systemTheme = () => (media.matches ? "light" : "dark");

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (meta) {
      meta.content = theme === "light" ? "#f7f8f7" : "#0c0d0f";
    }

    const button = document.getElementById("theme-toggle");
    if (!button) {
      return;
    }

    const next = theme === "light" ? "dark" : "light";
    button.setAttribute("aria-label", `Switch to ${next} mode`);
  };

  let preference = readStoredTheme();
  applyTheme(preference ?? systemTheme());

  window.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("theme-toggle");
    if (!button) {
      return;
    }

    applyTheme(root.dataset.theme === "light" ? "light" : "dark");

    button.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      preference = next;

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Keep the in-memory choice when storage is unavailable.
      }

      applyTheme(next);
    });
  });

  media.addEventListener("change", (event) => {
    if (!preference) {
      applyTheme(event.matches ? "light" : "dark");
    }
  });
})();
