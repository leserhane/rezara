/** Feature-detects WebGL without pulling in Three.js — lets main.js
 * decide whether it's even worth lazy-loading the 3D scene module. */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}
