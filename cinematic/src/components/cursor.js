/** A restrained custom cursor for desktop pointer devices only — a small
 * dot that grows slightly over interactive elements. Disabled outright
 * on touch and under prefers-reduced-motion. */
export function initCursor() {
  const dot = document.createElement("div");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#f4efe6",
    mixBlendMode: "difference",
    pointerEvents: "none",
    zIndex: "150",
    transition: "width 0.25s ease, height 0.25s ease",
    willChange: "transform",
  });
  document.body.appendChild(dot);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let targetX = x;
  let targetY = y;
  let raf = 0;

  function onMove(event) {
    targetX = event.clientX;
    targetY = event.clientY;
    const over = event.target.closest("[data-cursor], a, button");
    const size = over ? 28 : 8;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
  }

  function loop() {
    x += (targetX - x) * 0.2;
    y += (targetY - y) * 0.2;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  raf = requestAnimationFrame(loop);

  return () => {
    window.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(raf);
    dot.remove();
  };
}
