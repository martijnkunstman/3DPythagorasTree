# Plan: 3D Pythagoras Tree Web App

## Context
Greenfield project. The directory `c:\Users\mkunstman\3DPythagorasTree` is an empty git repo.
Goal: a browser app that renders a 3D Pythagoras Tree fractal using Three.js, with a live config panel, auto-orbit, and fast (no-lighting) rendering.

---

## Project Structure

```
3DPythagorasTree/
├── index.html
├── package.json
└── src/
    ├── main.js      - scene, renderer, OrbitControls, animation loop, rebuild()
    ├── tree.js      - buildTree(params) → merged BufferGeometry with vertex colors
    ├── gui.js       - lil-gui panel, debounced rebuild triggers
    └── style.css    - full-screen canvas, dark background
```

---

## Dependencies

```json
{
  "type": "module",
  "dependencies": { "three": "^0.172.0", "lil-gui": "^0.19.0" },
  "devDependencies": { "vite": "^6.0.0" },
  "scripts": { "dev": "vite", "build": "vite build" }
}
```

No `vite.config.js` needed — Vite zero-config handles this structure.

---

## Algorithm (src/tree.js)

`buildTree(params)` recurses to `params.depth` levels, producing one `BoxGeometry` per branch, then merges all into a single `BufferGeometry` via `mergeGeometries`.

**Child transform per branch (applied right-to-left):**
1. `Rz(±splitAngle)` — lean left (+) or right (−)
2. `Ry(twistAccum)` — rotate the split plane around Y
3. `T(0, parentSize/2 + childSize/2, 0)` — move to top of parent
4. Multiply by `parentMatrix`

**Child sizing (Pythagorean):**
- `leftSize  = parentSize * cos(angle)`
- `rightSize = parentSize * sin(angle)`

**Colors:** lerp `trunkColor → leafColor` by `depth / (maxDepth - 1)`, stored as vertex colors (`Float32Array`, 3 components × 24 vertices per box).

**Material:** `MeshBasicMaterial({ vertexColors: true })` — no lights, no shadows.

**Performance:** single draw call after merge; safe up to depth 12 (~4095 boxes).

**Import paths (Three.js r152+):**
- `import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'`
- `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`

---

## Config Panel (src/gui.js — lil-gui)

| Control | Range | Default |
|---------|-------|---------|
| Depth | 1–12 (int) | 8 |
| Angle (°) | 5–85 | 45 |
| Twist (°) | 0–180 | 30 |
| Trunk Color | color picker | `#3b1a08` |
| Leaf Color | color picker | `#2d8a2d` |
| Rotate Speed | 0–10 | 1.5 |
| Rebuild Now | button | — |

All tree params trigger `rebuild()` via 150 ms debounce. `autoRotateSpeed` updates `controls.autoRotateSpeed` immediately (no rebuild).

---

## Scene Setup (src/main.js)

- `PerspectiveCamera(60°)` at `(0, 4, 10)`, `lookAt(0, 3, 0)`
- `OrbitControls` with `autoRotate: true`, `enableDamping: true`, `target: (0, 3, 0)`
- `WebGLRenderer({ antialias: true })`, no shadow maps
- `scene.background = 0x0a0a0a`
- `rebuild()`: disposes old geometry, calls `buildTree(params)`, creates new `Mesh`, adds to scene
- Material created once and reused across rebuilds

---

## Implementation Steps

1. Create `package.json`
2. `npm install` (three, lil-gui, vite)
3. Create `index.html`
4. Create `src/style.css`
5. Create `src/tree.js` (algorithm)
6. Create `src/main.js` (scene + rebuild)
7. Create `src/gui.js` (GUI panel)
8. Run `npm run dev`, verify in browser

---

## Verification

- `npm run dev` → browser shows dark background, 3D tree, auto-rotating
- GUI panel (top-right) — sliders update tree in real-time
- Depth 10 renders smoothly (single draw call)
- At angle=45°, tree is symmetric
- Non-zero twist produces a visible 3D spiral effect
- Colors interpolate brown (trunk) → green (leaves)
