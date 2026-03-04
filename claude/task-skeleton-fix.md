# Task: Fix missing lines in line renderer mode

- [x] Research missing lines in line renderer mode
    - [x] Explore `gui.js` for "line renderer mode" toggle and state
    - [x] Explore `tree.js` and `main.js` for rendering logic
- [x] Identify the cause of missing lines
    - [x] Found that `tree.js` doesn't attach skeleton geometry to `userData`
- [x] Implement fix
    - [x] Update `buildTreeLineBased` in `tree.js` to return skeleton geometry
    - [x] Update `buildTreeManifoldLineBased` in `tree.js` to return skeleton geometry
    - [x] Update `buildTree` and `buildTreeManifold` to also provide skeleton lines
- [x] Verify fix
    - [x] Verified line visibility in "skeleton" render mode in browser
    - [x] Verified consistency across all build modes and Manifold3D
