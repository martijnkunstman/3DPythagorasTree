# Manifold3D Integration Integration Plan

## Task Checklist
- [ ] Install `manifold-3d` via npm.
- [ ] Initialize `manifold-3d` in the application (load WASM module).
- [ ] Add an action button in the `lil-gui` config panel to manually trigger Manifold3D smoothing.
- [ ] Implement the `applyManifold` logic inside `tree.js` or `main.js`:
  - Convert the existing non-manifold Three.js BufferGeometry (or individual cylinder parts) into a Manifold object.
  - Perform geometric union of all cylinder segments.
  - Apply smoothing (e.g. `smoothOut` or similar if desired, or at least return the cleaned manifold mesh).
  - Convert back to Three.js BufferGeometry.
  - Update the displayed mesh.
- [ ] Test the integration.

## Implementation Plan

The user wants to add an option to make the Pythagoras Tree model "smoother and better distributed" using Manifold3D, triggered via a button in the config panel.

### Proposed Changes

#### Dependencies
- Add `manifold-3d` to the project via `npm install manifold-3d`.

#### Initialization
- Load and initialize the Manifold WASM module in `main.js` or a new `manifoldUtils.js` file.

#### GUI Update (`src/gui.js`)
- Add a new button "Apply Manifold3D (Smooth)" to the GUI constraints.
- Pass a callback function from `main.js` that handles the Manifold3D processing when clicked.

#### Tree Logic (`src/tree.js` and `src/main.js`)
**tree.js**
- The current tree is a merged BufferGeometry of hundreds/thousands of `CylinderGeometry`.
- To make a union, we can either:
  1. Pass the entire merged geometry to Manifold3D, though finding intersections of a soup of triangles isn't always robust without explicit objects.
  2. Better: Keep track of the individual `CylinderGeometry` objects (or their matrices) and perform a `manifold.union()` of all branch segments.
- After taking the union, apply Manifold3D's refinement or smoothing features (if available/requested) or rely on the cleanly unioned mesh to look "smoother" without internal faces.
- Extract the resulting geometry and convert it back to a `THREE.BufferGeometry` with proper vertex colors or materials.

**main.js**
- Receive the manifolded geometry and update `treeMesh`, `depthMesh`, and `edgesMesh` geometries to display the new smooth version.
- Ensure the materials still look good (vertex colors might be lost during naive union unless vertex attributes are preserved, so we might need to handle coloring or assign a unified material if coloring is lost, OR interpolate properties).

### Verification Plan
1. Start the Vite dev server.
2. Build a tree of reasonable depth.
3. Click the "Apply Manifold3D (Smooth)" button.
4. Verify visually that intersecting branches are merged cleanly, hidden internal faces are gone, and the mesh becomes a single continuous surface.
