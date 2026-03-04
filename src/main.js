import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildTree } from './tree.js';
import { createGUI } from './gui.js';
import './style.css';

// ─── Params ──────────────────────────────────────────────────────────────────

export const params = {
  depth:           8,
  angle:           45,
  twist:           30,
  trunkColor:      '#3b1a08',
  leafColor:       '#2d8a2d',
  autoRotateSpeed: 1.5,
};

// ─── Scene ───────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(0, 4, 10);
camera.lookAt(0, 3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ─── Controls ────────────────────────────────────────────────────────────────

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = params.autoRotateSpeed;
controls.target.set(0, 3, 0);

// ─── Tree ────────────────────────────────────────────────────────────────────

const material = new THREE.MeshBasicMaterial({ vertexColors: true });
let treeMesh = null;

export function rebuild() {
  if (treeMesh) {
    treeMesh.geometry.dispose();
    scene.remove(treeMesh);
  }
  const geometry = buildTree(params);
  treeMesh = new THREE.Mesh(geometry, material);
  scene.add(treeMesh);
}

// ─── GUI ─────────────────────────────────────────────────────────────────────

createGUI(params, rebuild, controls);

// ─── Init ────────────────────────────────────────────────────────────────────

rebuild();

// ─── Resize ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Loop ────────────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
