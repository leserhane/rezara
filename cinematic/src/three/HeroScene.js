import * as THREE from "three";

/**
 * A self-contained, auto-playing WebGL hero: a procedurally built pair
 * of glasses (no external 3D asset — every shape is primitives/tubes)
 * that spins continuously and cycles its lens material between a clear
 * "optical" look and a dark "sunglasses" tint. Nothing here is tied to
 * scroll position; it runs on its own timeline from the moment it
 * starts and never needs the user to scroll to see it move.
 */

const METAL_COLOR = 0xb8a98c; // --color-metal
const HINGE_COLOR = 0xd9c8ae; // --color-beige
// Against the hero's dark backdrop, a low-opacity light color and a
// high-opacity dark color both just read as "dark" — there's nothing
// bright behind the lens for a truly transparent pane to reveal. The
// clear/optical state instead needs real brightness (opacity + a light
// color) so it visibly reads as glass, not just "less black" than the
// tinted state.
const LENS_CLEAR = { color: 0xfaf6ee, opacity: 0.28 };
const LENS_TINT = { color: 0x0d0a08, opacity: 0.95 };
const LOOP_SECONDS = 9;

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this._raf = 0;
    this._running = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.camera.position.set(0, 0.1, 6.4);
    this.camera.lookAt(0, 0, 0);

    this._buildLights();
    this.lenses = [];
    this.group = this._buildGlasses();
    this.scene.add(this.group);

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(canvas);
    this.resize();
  }

  _buildLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const key = new THREE.DirectionalLight(0xffe9cf, 1.15);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(0xd9c8ae, 0.55);
    rim.position.set(-4, -1.5, -3);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-2, 2, 4);
    this.scene.add(ambient, key, rim, fill);
  }

  _lensMaterial() {
    // Unlit on purpose: a physically-lit lens (roughness/clearcoat)
    // picks up enough ambient + specular brightness that a dark, opaque
    // "tinted" state and a pale, translucent "clear" state end up
    // reading as the same medium grey once lighting interacts with
    // them. A flat, fully-controlled color+opacity makes the two states
    // unambiguous regardless of surrounding light.
    return new THREE.MeshBasicMaterial({
      color: LENS_CLEAR.color,
      transparent: true,
      opacity: LENS_CLEAR.opacity,
      side: THREE.DoubleSide,
    });
  }

  _metalMaterial() {
    return new THREE.MeshStandardMaterial({
      color: METAL_COLOR,
      metalness: 0.78,
      roughness: 0.26,
    });
  }

  _hingeMaterial() {
    return new THREE.MeshStandardMaterial({
      color: HINGE_COLOR,
      metalness: 0.5,
      roughness: 0.35,
    });
  }

  _buildLens(x) {
    const geo = new THREE.CircleGeometry(0.78, 48);
    const mesh = new THREE.Mesh(geo, this._lensMaterial());
    mesh.position.x = x;
    this.lenses.push(mesh);
    return mesh;
  }

  _buildRim(x) {
    const geo = new THREE.TorusGeometry(0.8, 0.045, 16, 64);
    const mesh = new THREE.Mesh(geo, this._metalMaterial());
    mesh.position.x = x;
    return mesh;
  }

  _tube(points, radius) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 24, radius, 8, false);
    return new THREE.Mesh(geo, this._metalMaterial());
  }

  _buildBridge() {
    return this._tube(
      [
        new THREE.Vector3(-0.68, 0.14, 0.02),
        new THREE.Vector3(0, 0.26, 0.08),
        new THREE.Vector3(0.68, 0.14, 0.02),
      ],
      0.035
    );
  }

  _buildTemple(sign) {
    const rimX = 0.95 * sign;
    return this._tube(
      [
        new THREE.Vector3(rimX + 0.78 * sign, 0, 0),
        new THREE.Vector3(rimX + 1.0 * sign, -0.04, -1.0),
        new THREE.Vector3(rimX + 0.92 * sign, -0.16, -2.15),
      ],
      0.032
    );
  }

  _buildHinge(sign) {
    const geo = new THREE.SphereGeometry(0.06, 16, 16);
    const mesh = new THREE.Mesh(geo, this._hingeMaterial());
    mesh.position.set((0.95 + 0.78) * sign, 0, 0);
    return mesh;
  }

  _buildGlasses() {
    const group = new THREE.Group();
    const leftX = -0.95;
    const rightX = 0.95;

    group.add(this._buildRim(leftX), this._buildRim(rightX));
    group.add(this._buildLens(leftX), this._buildLens(rightX));
    group.add(this._buildBridge());
    group.add(this._buildTemple(-1), this._buildTemple(1));
    group.add(this._buildHinge(-1), this._buildHinge(1));

    return group;
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
  }

  /** t: 0 = clear optical lens, 1 = fully tinted sunglasses lens. */
  _applyLensTint(t) {
    const color = new THREE.Color(LENS_CLEAR.color).lerp(new THREE.Color(LENS_TINT.color), t);
    const opacity = THREE.MathUtils.lerp(LENS_CLEAR.opacity, LENS_TINT.opacity, t);
    for (const lens of this.lenses) {
      lens.material.color.copy(color);
      lens.material.opacity = opacity;
    }
  }

  _renderFrame() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Starts the autonomous rotate + lens-tint loop. Never reads scroll
   * position or any other page state — it runs purely on its own clock. */
  start() {
    if (this._running) return;
    this._running = true;
    this.clock.start();

    const loop = () => {
      if (!this._running) return;
      const elapsed = this.clock.getElapsedTime();
      this.group.rotation.y = elapsed * 0.5;
      this.group.rotation.x = Math.sin(elapsed * 0.35) * 0.06;

      const phase = (elapsed % LOOP_SECONDS) / LOOP_SECONDS;
      const t = (1 - Math.cos(phase * Math.PI * 2)) / 2; // smooth 0->1->0
      this._applyLensTint(t);

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
    this.group.rotation.y = 0.5;
    this.group.rotation.x = 0.03;
    this._applyLensTint(0.5);
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

