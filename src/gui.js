import GUI from 'lil-gui';

function computeMaxDepth(branches, limit = 20000) {
  let total = 0;
  for (let d = 1; d <= 20; d++) {
    total += Math.pow(branches, d - 1);
    if (total > limit) return Math.min(d - 1, 12);
  }
  return 12;
}

export function createGUI(params, DEFAULTS, rebuild, controls, setView, setRenderMode, saveParams) {
  const gui = new GUI({ title: 'Pythagoras Tree' });

  let debounceTimer = null;
  function debouncedRebuild() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(rebuild, 150); // rebuild() calls saveParams internally
  }

  // ─── Tree ─────────────────────────────────────────────────────────────────

  const treeFolder = gui.addFolder('Tree');
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
  treeFolder.add(params, 'angle', 5, 85, 0.1)
    .name('Angle (°)')
    .onChange(debouncedRebuild);
  treeFolder.add(params, 'twist', 0, 180, 0.1)
    .name('Twist (°)')
    .onChange(debouncedRebuild);

  // ─── Branch ───────────────────────────────────────────────────────────────

  const branchFolder = gui.addFolder('Branch');
  branchFolder.add(params, 'sides', 3, 8, 1)
    .name('Sides (3–8)')
    .onChange(debouncedRebuild);
  branchFolder.add(params, 'startDiameter', 0.2, 2.0, 0.05)
    .name('Start Diameter')
    .onChange(debouncedRebuild);
  branchFolder.add(params, 'thicknessShrink', 1, 2, 0.05)
    .name('Thickness Shrink')
    .onChange(debouncedRebuild);
  branchFolder.add(params, 'length', 0.5, 4, 0.05)
    .name('Length')
    .onChange(debouncedRebuild);
  branchFolder.add(params, 'shrinkFactor', 1, 2, 0.05)
    .name('Length Shrink')
    .onChange(debouncedRebuild);

  // ─── Colors ───────────────────────────────────────────────────────────────

  const colorFolder = gui.addFolder('Colors');
  colorFolder.addColor(params, 'trunkColor')
    .name('Trunk')
    .onChange(debouncedRebuild);
  colorFolder.addColor(params, 'leafColor')
    .name('Leaf')
    .onChange(debouncedRebuild);

  // ─── Camera ───────────────────────────────────────────────────────────────

  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(params, 'autoRotateSpeed', 0, 10, 0.1)
    .name('Rotate Speed')
    .onChange(() => {
      controls.autoRotateSpeed = params.autoRotateSpeed;
      saveParams();
    });

  // ─── View ─────────────────────────────────────────────────────────────────

  const viewFolder = gui.addFolder('View');
  viewFolder.add(params, 'renderMode', ['solid', 'wireframe', 'edges'])
    .name('Render Mode')
    .onChange(setRenderMode);
  viewFolder.add(params, 'viewMode', ['perspective', 'top', 'front', 'left'])
    .name('Camera')
    .onChange(setView);

  // ─── Actions ──────────────────────────────────────────────────────────────

  gui.add({ rebuild }, 'rebuild').name('Rebuild Now');

  gui.add({
    reset() {
      Object.assign(params, DEFAULTS);
      gui.controllersRecursive().forEach(c => c.updateDisplay());
      // Sync depth slider max for default branches count
      depthCtrl.max(computeMaxDepth(params.branches)).updateDisplay();
      setRenderMode(params.renderMode);
      setView(params.viewMode);
      controls.autoRotateSpeed = params.autoRotateSpeed;
      rebuild();
    }
  }, 'reset').name('Reset to Defaults');

  return gui;
}
