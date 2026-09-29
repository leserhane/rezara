import { defineConfig } from "vite";

// Static, framework-free build: the output is plain HTML/CSS/JS that can be
// hosted anywhere (this prototype is not wired into the repo's GitHub Pages
// deploy — see cinematic/README.md).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
