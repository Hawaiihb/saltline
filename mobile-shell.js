(() => {
  const root = document.documentElement;

  const updateViewportHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    root.style.setProperty("--app-height", `${Math.round(height)}px`);
  };

  updateViewportHeight();
  window.addEventListener("resize", updateViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewportHeight, {
    passive: true,
  });

  if (window.matchMedia("(display-mode: standalone)").matches) {
    root.classList.add("is-standalone");
  }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("[pwa] service worker registration failed", error);
      });
    });
  }
})();
