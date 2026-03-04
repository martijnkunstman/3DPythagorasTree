# Plan: Add N-Branch Support with Dynamic Depth Limit

## Context
Currently the tree always spawns exactly 2 children per node. The user wants to configure how many branches grow from each node (2–8). Because branch count grows exponentially, a higher branch count must cap the allowed depth to keep total geometry under a reasonable limit (~20,000 nodes).

---

## Files to Modify
- [src/tree.js](../src/tree.js) — change 2-child loop to N-child radial arrangement
- [src/gui.js](../src/gui.js) — add `branches` slider, dynamic depth limit + clamp
- [src/main.js](../src/main.js) — add `branches: 2` to params

---

## 1. Branch Count Limits (≤ 20,000 total nodes)

Precomputed — `computeMaxDepth(b)` returns these values:

| Branches | Max Depth | Max Nodes |
|----------|-----------|-----------|
| 2 | 14 (capped to 12 in GUI) | 16,383 |
| 3 | 9 | 9,841 |
| 4 | 7 | 5,461 |
| 5 | 7 | 19,531 |
| 6 | 6 | 9,331 |
| 7 | 6 | 19,608 |
| 8 | 5 | 4,681 |

```js
function computeMaxDepth(branches, limit = 20000) {
  let total = 0;
  for (let d = 1; d <= 20; d++) {
    total += Math.pow(branches, d - 1);
    if (total > limit) return Math.min(d - 1, 12); // also cap at 12 for b=2
  }
  return 12;
}
```

---

## 2. src/main.js — add `branches` param

```js
export const params = {
  depth:           8,
  angle:           45,
  twist:           30,
  branches:        2,      // ← NEW
  length:          1.5,
  shrinkFactor:    1.2,
  sides:           4,
  trunkColor:      '#3b1a08',
  leafColor:       '#2d8a2d',
  autoRotateSpeed: 1.5,
};
```

---

## 3. src/tree.js — N-child radial arrangement

Replace the current 2-child `for` loop with an N-child loop.

**Child arrangement:** N children placed conically — all lean by `splitAngle` from the parent's Y axis, distributed evenly at azimuths `twistAccum + (2π * i / N)`.

**Child size:** `parentSize * cos(splitAngle)` for all N children uniformly. At the default 45° this equals the original left-child size (cos45° = sin45° so no change for N=2).

**Transform per child `i`:**
```
childMatrix = parentMatrix
  * T(0, yOffset, 0)              // move to top of parent cylinder
  * Ry(twistAccum + 2π*i/N)      // spread children evenly around azimuth
  * Rz(splitAngle)                // lean outward by split angle
```

The `twistAccum + twistPerLevel` is passed to recursive calls as before, adding a per-level global rotation to the whole cone — preserving the spiral effect.

---

## 4. src/gui.js — branches slider + dynamic depth cap

Add `branches` slider to the **Tree** folder. Keep a reference to the `depth` controller. On branches change: recalculate max depth, clamp `params.depth`, update the controller, then rebuild.

```js
const depthCtrl = treeFolder.add(params, 'depth', 1, 12, 1)
  .name('Depth')
  .onChange(debouncedRebuild);

treeFolder.add(params, 'branches', 2, 8, 1)
  .name('Branches')
  .onChange(() => {
    const max = computeMaxDepth(params.branches);
    if (params.depth > max) params.depth = max;
    depthCtrl.max(max).updateDisplay();
    debouncedRebuild();
  });
```

---

## Verification

1. `npm run dev` — tree renders, GUI shows new **Branches** slider in Tree folder
2. Branches=2: tree looks identical to before (two opposing branches)
3. Branches=4, Depth=7: four-branch conical tree, ~5,461 nodes, runs at 60fps
4. Branches=8: depth slider max changes to 5 automatically
5. Set Branches=8, drag Depth to max (5): renders without lag (~4,681 nodes)
6. Set Branches=2, Depth slider max returns to 12
7. Drag Branches while depth is near max for that branch count — depth clamps correctly
8. `npm run build` — clean build, no errors
