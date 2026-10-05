import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * A WebGL scene built around a real supplied 3D model
 * (public/models/monture.glb) — not procedural geometry. Rotation and
 * lens tint are driven entirely by `setProgress()`, which main.js feeds
 * from how far the visitor has scrolled through the 6-chapter stage (see
 * src/utils/scrollStage.js) — there's no free-running clock once started;
 * nothing moves unless scroll position changes.
 *
 * The two lens materials' color/opacity values below are the model's own
 * (read from its embedded glTF material defs — "Verre_Optique" and
 * "Verre_Solaire"), not invented.
 */

const MODEL_URL = `${import.meta.env.BASE_URL}models/monture.glb`;

const LENS_OPTIQUE = { color: new THREE.Color(0.93, 0.97, 1.0), opacity: 0.08 };
const LENS_SOLAIRE = { color: new THREE.Color(0.13, 0.14, 0.16), opacity: 0.9 };

// One full turn across the whole scroll stage (progress 0 -> 1) — the
// model ends the journey facing front again, same pose it opened on.
const TOTAL_TURNS = 1;
// How fast the rendered rotation/tint catches up to the latest scroll
// position, as an exponential-decay rate (see loop() below) — higher
// tracks the scrollbar more tightly, lower trails further behind for a
// softer, heavier feel. Framerate-independent either way.
const FOLLOW_RATE = 4.5;

function ease(t) {
  return t * t * (3 - 2 * t);
}

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this._raf = 0;
    this._running = false;
    this._ready = false;

    this._progress = 0; // smoothed, currently-rendered scroll progress
    this._targetProgress = 0; // latest raw value from setProgress()

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(24, 1, 0.01, 50);

    this._buildLights();
    this.lensMaterials = [];
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(canvas);
    this.resize();
  }

  _buildLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const key = new THREE.DirectionalLight(0xffe9cf, 1.6);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(0xd9c8ae, 0.7);
    rim.position.set(-4, -1.5, -3);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-2, 2, 4);
    this.scene.add(ambient, key, rim, fill);
  }

  /** Loads the real model and frames the camera to it. Resolves once the
   * scene is ready to render. */
  async load() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(MODEL_URL);
    const model = gltf.scene;
    this.pivot.add(model);

    model.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.name === "Verre_Droit" || obj.name === "Verre_Gauche") {
        obj.material.transparent = true;
        obj.material.depthWrite = false;
        if (!this.lensMaterials.includes(obj.material)) {
          this.lensMaterials.push(obj.material);
        }
      }
    });
    this._applyLensMix(0);

    this._frameCamera(model);
    this._ready = true;
  }

  /** Positions the camera so the model fills the frame regardless of its
   * authored scale/units, based on its actual bounding sphere. Shifting
   * the model itself (not the pivot) by -center puts the model's own
   * center at the pivot's local origin, so spinning the pivot rotates it
   * in place — shifting the pivot's position instead would leave the
   * model offset from the rotation axis and make it orbit in a circle. */
  _frameCamera(model) {
    const box = new THREE.Box3().setFromObject(model);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    this._radius = sphere.radius || 0.1;
    model.position.sub(sphere.center);
    this._placeCamera();
  }

  _placeCamera() {
    if (!this._radius) return;
    const aspect = this.camera.aspect || 1;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const halfFov = Math.atan(Math.tan(fov / 2) * aspect);
    const limitingHalfAngle = Math.min(halfFov, (fov / 2) * 1.9);
    const dist = (this._radius / Math.sin(limitingHalfAngle)) * 1.15;
    this.camera.position.set(0, this._radius * 0.12, dist);
    this.camera.lookAt(0, 0, 0);
    this.camera.near = Math.max(0.01, dist - this._radius * 4);
    this.camera.far = dist + this._radius * 4;
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this._placeCamera();
  }

  /** e: 0 = fully "Optique" (clear), 1 = fully "Solaire" (tinted). */
  _applyLensMix(e) {
    const color = LENS_OPTIQUE.color.clone().lerp(LENS_SOLAIRE.color, e);
    const opacity = THREE.MathUtils.lerp(LENS_OPTIQUE.opacity, LENS_SOLAIRE.opacity, e);
    for (const material of this.lensMaterials) {
      material.color.copy(color);
      material.opacity = opacity;
    }
  }

  _renderFrame() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Latest scroll progress through the 6-chapter stage: 0 at the top,
   * 1 at the bottom. Cheap — just records a number; the render loop
   * smooths it into motion on the next frame. Safe to call at any time,
   * including before start(). */
  setProgress(p) {
    this._targetProgress = THREE.MathUtils.clamp(p, 0, 1);
  }

  /** Starts the render loop that follows scroll progress. Rotation and
   * lens tint are a damped function of setProgress()'s latest value —
   * nothing advances on its own; stop scrolling and it settles in place. */
  start() {
    if (this._running || !this._ready) return;
    this._running = true;
    this.clock.start();
    let last = 0;

    const loop = () => {
      if (!this._running) return;
      const elapsed = this.clock.getElapsedTime();
      const dt = Math.min(0.1, elapsed - last || 0);
      last = elapsed;

      // Frame-rate independent exponential smoothing toward the latest
      // scroll-derived target, so a fast flick settles in smoothly
      // instead of the model snapping straight to the new angle.
      const k = 1 - Math.exp(-FOLLOW_RATE * dt);
      this._progress += (this._targetProgress - this._progress) * k;

      this.pivot.rotation.y = this._progress * Math.PI * 2 * TOTAL_TURNS;
      this._applyLensMix(ease(this._progress));

      this._renderFrame();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  pause() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }

  /** prefers-reduced-motion fallback: one still frame, no spin, lenses
   * held at a mid-tint so the "optical to sun" idea still reads. */
  renderStatic() {
    if (!this._ready) return;
    this.pivot.rotation.y = 0.3;
    this._applyLensMix(0.5);
    this._renderFrame();
  }

  destroy() {
    this.pause();
    this._resizeObserver.disconnect();
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.renderer.dispose();
  }
}
