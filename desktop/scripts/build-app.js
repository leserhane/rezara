// Builds the shared React frontend in "desktop" mode (see
// frontend/vite.config.ts — swaps in the local SQLite-backed data client,
// auth context and login page) and copies the output into desktop/app,
// which is what main.js loads and what electron-builder packages. Runs on
// both Windows and Linux/macOS CI runners, so this uses Node's fs instead
// of shell copy commands.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const frontendDir = path.join(__dirname, '..', '..', 'frontend')
const appDir = path.join(__dirname, '..', 'app')

execFileSync('npm', ['ci'], { cwd: frontendDir, stdio: 'inherit', shell: true })
// Invoked directly (rather than via `npm run build -- --mode desktop`) so
// `--mode desktop` unambiguously reaches vite and not tsc.
execFileSync('npx', ['tsc', '-b'], { cwd: frontendDir, stdio: 'inherit', shell: true })
execFileSync('npx', ['vite', 'build', '--mode', 'desktop'], { cwd: frontendDir, stdio: 'inherit', shell: true })

fs.rmSync(appDir, { recursive: true, force: true })
fs.cpSync(path.join(frontendDir, 'dist'), appDir, { recursive: true })

console.log(`Copied ${path.join(frontendDir, 'dist')} -> ${appDir}`)
