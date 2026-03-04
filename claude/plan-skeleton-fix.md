# Fix Missing Lines in Skeleton Render Mode

The "skeleton" render mode in `main.js` expects a `userData.skeletonGeo` property on the tree geometry, but `tree.js` currently fails to provide it. This plan outlines the changes to ensure skeleton geometry is correctly generated and attached.

## Proposed Changes

### [tree.js](file:///c:/Users/mkunstman/3DPythagorasTree/src/tree.js)

Summary: Modify tree building functions to generate and attach skeleton geometry.

#### [MODIFY] [tree.js](file:///c:/Users/mkunstman/3DPythagorasTree/src/tree.js)
- Update `buildTreeLineBased` to:
    - Create a `BufferGeometry` from the collected `skeletonPositions` and `skeletonColors`.
    - Attach this geometry to `geometry.userData.skeletonGeo`.
- Update `buildTreeManifoldLineBased` to:
    - Create a `BufferGeometry` from the collected `skeletonPositions` and `skeletonColors`.
    - Attach this geometry to `geometry.userData.skeletonGeo`.
- Update `buildTree` and `buildTreeManifold` to also generate and attach skeleton geometry for consistency.

## Verification Plan

### Manual Verification
1. Run the development server with `npm run dev`.
2. Open the application in the browser.
3. In the GUI panel, under the "View" folder, change "Render Mode" to "skeleton".
4. Verify that the tree skeleton (lines) is now visible.
5. Change "Build Mode" between "standard" and "lineBased" and verify that the skeleton is visible in both modes.
6. Click "Apply Manifold3D" and verify that the skeleton is still visible in "skeleton" render mode.
