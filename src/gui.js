import GUI from 'lil-gui';

/**
 * Create and attach the lil-gui config panel.
 * @param {object} params      - shared params object (mutated by GUI)
 * @param {function} rebuild   - called when tree params change (debounced)
 * @param {object} controls    - OrbitControls instance
 */
export function createGUI(params, rebuild, controls) {
  const gui = new GUI({ title: 'Pythagoras Tree' });

  let debounceTimer = null;
  function debouncedRebuild() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(rebuild, 150);
  }

  const treeFolder = gui.addFolder('Tree');
  treeFolder.add(params, 'depth', 1, 12, 1)
    .name('Depth')
    .onChange(debouncedRebuild);
  treeFolder.add(params, 'angle', 5, 85, 0.1)
    .name('Angle (°)')
    .onChange(debouncedRebuild);
  treeFolder.add(params, 'twist', 0, 180, 0.1)
    .name('Twist (°)')
    .onChange(debouncedRebuild);

  const colorFolder = gui.addFolder('Colors');
  colorFolder.addColor(params, 'trunkColor')
    .name('Trunk')
    .onChange(debouncedRebuild);
  colorFolder.addColor(params, 'leafColor')
    .name('Leaf')
    .onChange(debouncedRebuild);

  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(params, 'autoRotateSpeed', 0, 10, 0.1)
    .name('Rotate Speed')
    .onChange(() => {
      controls.autoRotateSpeed = params.autoRotateSpeed;
    });

  gui.add({ rebuild }, 'rebuild').name('Rebuild Now');

  return gui;
}
