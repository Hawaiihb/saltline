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

/* Movement bridge (shell-level, game code untouched):
   The game's built-in touch joystick renders and tracks the thumb, but on
   some mobile browsers (observed: iOS Chrome) its internal move axes never
   reach the player — the stick moves, the character does not. The keyboard
   input path is unaffected, so this bridge translates a left-side touch
   drag into WASD key events the game already understands. It only ADDS
   input: where the game's own joystick works, both feed the same
   normalized move vector, so there is no double speed. */
(() => {
  const DEAD = 14; // px of drag before a direction engages
  let stickId = null;
  let ox = 0;
  let oy = 0;
  const held = new Set();

  const setKey = (code, down) => {
    if (down === held.has(code)) return;
    if (down) held.add(code);
    else held.delete(code);
    window.dispatchEvent(
      new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true, cancelable: true }),
    );
  };
  const releaseAll = () => {
    for (const code of [...held]) setKey(code, false);
  };
  const isButton = (target) =>
    !!(target && target.closest && target.closest("button, .t-btn, a, input, select, textarea"));

  window.addEventListener(
    "touchstart",
    (event) => {
      if (stickId !== null) return;
      for (const touch of event.changedTouches) {
        if (touch.clientX < window.innerWidth * 0.45 && !isButton(touch.target)) {
          stickId = touch.identifier;
          ox = touch.clientX;
          oy = touch.clientY;
          break;
        }
      }
    },
    { passive: true, capture: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (stickId === null) return;
      for (const touch of event.changedTouches) {
        if (touch.identifier !== stickId) continue;
        const dx = touch.clientX - ox;
        const dy = touch.clientY - oy;
        setKey("KeyW", dy < -DEAD);
        setKey("KeyS", dy > DEAD);
        setKey("KeyA", dx < -DEAD);
        setKey("KeyD", dx > DEAD);
      }
    },
    { passive: true, capture: true },
  );

  const endTouch = (event) => {
    if (stickId === null) return;
    for (const touch of event.changedTouches) {
      if (touch.identifier === stickId) {
        stickId = null;
        releaseAll();
      }
    }
  };
  window.addEventListener("touchend", endTouch, { passive: true, capture: true });
  window.addEventListener("touchcancel", endTouch, { passive: true, capture: true });
})();
