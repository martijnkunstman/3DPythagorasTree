# 3D Pythagoras Tree

An interactive 3D fractal tree visualiser built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).

The tree is based on the classic Pythagoras Tree fractal, extended into 3D with a configurable twist angle that spirals branches through space at each recursion level.

![3D Pythagoras Tree](claude/plan-initial.md)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### Install dependencies

```bash
npm install
```

---

## npm Commands

### `npm run dev`

Starts the **development server** using Vite.

- Opens a local server at `http://localhost:5173` (or the next available port)
- Hot-reloads automatically when you save source files
- Fast — Vite serves ES modules directly to the browser without bundling
- Use this during development

```bash
npm run dev
```

---

### `npm run build`

Creates a **production build** in the `dist/` folder.

- Bundles and minifies all source files (JS, CSS, HTML)
- Optimises assets for deployment
- The output in `dist/` is what you upload to a web host or CDN
- Run this when you are ready to deploy

```bash
npm run build
```

---

### `npm run preview`

Serves the **production build locally** for final testing.

- Requires `npm run build` to have been run first
- Starts a local server pointing at the `dist/` folder
- Lets you verify the production build behaves identically to development before deploying
- Does not watch for file changes

```bash
npm run build   # build first
npm run preview # then preview
```

---

## Configuration Panel

The GUI panel (top-right corner) exposes the key tree parameters:

| Control | Description | Range |
|---------|-------------|-------|
| **Depth** | Number of branch recursion levels | 1 – 12 |
| **Angle (°)** | Split angle between left and right child branches | 5° – 85° |
| **Twist (°)** | How much the split plane rotates around the parent axis per level | 0° – 180° |
| **Trunk** | Color of the deep/base branches | color picker |
| **Leaf** | Color of the tip branches | color picker |
| **Rotate Speed** | Auto-orbit rotation speed | 0 – 10 |
| **Rebuild Now** | Force a manual tree rebuild | button |

---

## How It Works

- Each branch is a box scaled by the Pythagorean relationship:
  - Left child width = `parentWidth × cos(angle)`
  - Right child width = `parentWidth × sin(angle)`
- The **twist** parameter rotates the splitting plane around the parent's Y-axis at every level, creating a 3D helical structure
- All branches are merged into a **single draw call** using `BufferGeometryUtils.mergeGeometries` for maximum performance
- Rendering uses `MeshBasicMaterial` — no lights, no shadows, purely colour-based

---

## Project Structure

```
3DPythagorasTree/
├── index.html          Entry point
├── package.json        Dependencies and scripts
├── .gitignore
├── claude/             AI planning docs used during development
│   └── plan-initial.md
└── src/
    ├── main.js         Three.js scene, renderer, OrbitControls, animation loop
    ├── tree.js         Fractal algorithm — builds merged BufferGeometry
    ├── gui.js          lil-gui config panel
    └── style.css       Full-screen canvas styling
```

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| [Three.js](https://threejs.org/) | ^0.172.0 | 3D rendering |
| [lil-gui](https://lil-gui.georgealways.com/) | ^0.19.0 | Config panel UI |
| [Vite](https://vitejs.dev/) | ^6.0.0 | Dev server and bundler |
