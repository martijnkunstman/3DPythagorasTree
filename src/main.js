import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildTree, buildTreeLineBased, buildTreeManifold, buildTreeManifoldLineBased } from './tree.js';
import { createGUI } from './gui.js';
import './style.css';

// ─── Defaults & persistence ───────────────────────────────────────────────────

const STORAGE_KEY = 'pythagorasTree.params';

export const DEFAULTS = Object.freeze({
  depth: 6,
  angle: 45,
  twist: 0,
  branches: 4,
  buildMode: 'lineBased',
  length: 2,
  shrinkFactor: 1.2,
  startDiameter: 2.0,
  thicknessShrink: 1.5,
  sides: 6,
  trunkColor: '#3b1a08',
  leafColor: '#2d8a2d',
  autoRotateSpeed: 1.5,
  renderMode: 'visible',
  viewMode: 'perspective',
  manifoldSmoothness: 1.0,
  manifoldSharpAngle: 60,
  manifoldRefine: 2,
});

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveParams() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
}

export const params = { ...DEFAULTS, ...loadSaved() };

// ─── Scene ───────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// ─── Cameras ─────────────────────────────────────────────────────────────────

const aspect = window.innerWidth / window.innerHeight;

const perspCamera = new THREE.PerspectiveCamera(60, aspect, 0.01, 1000);
perspCamera.position.set(0, 4, 10);

const ORTHO_SIZE = 12;
const orthoCamera = new THREE.OrthographicCamera(
  -ORTHO_SIZE * aspect, ORTHO_SIZE * aspect,
  ORTHO_SIZE, -ORTHO_SIZE,
  0.01, 500
);

let activeCamera = perspCamera;

// ─── Renderer ────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ─── Controls ────────────────────────────────────────────────────────────────

const perspControls = new OrbitControls(perspCamera, renderer.domElement);
perspControls.enableDamping = true;
perspControls.dampingFactor = 0.05;
perspControls.autoRotate = true;
perspControls.autoRotateSpeed = params.autoRotateSpeed;
perspControls.target.set(0, 3, 0);

const orthoControls = new OrbitControls(orthoCamera, renderer.domElement);
orthoControls.enableDamping = true;
orthoControls.dampingFactor = 0.05;
orthoControls.autoRotate = false;
orthoControls.enabled = false;

let activeControls = perspControls;

// ─── Materials ───────────────────────────────────────────────────────────────

// Solid/wireframe material (vertex colours)
const solidMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

// Invisible depth-only mesh — fills the depth buffer so back edges are hidden
// in 'visible' mode without drawing any colour.
const depthOnlyMaterial = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthWrite: true,
  side: THREE.FrontSide,
});

// Edge line material — white lines, depth-tested so back edges are hidden.
const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: true });

// ─── Tree ────────────────────────────────────────────────────────────────────

let treeMesh = null;
let depthMesh = null;
let edgesMesh = null;

function applyRenderModeVisibility(mode) {
  solidMaterial.wireframe = (mode === 'wireframe');
  treeMesh.visible = (mode === 'solid' || mode === 'wireframe');
  depthMesh.visible = (mode === 'visible');
  edgesMesh.visible = (mode === 'edges' || mode === 'visible');
}

export function rebuild() {
  if (treeMesh) { treeMesh.geometry.dispose(); scene.remove(treeMesh); }
  if (depthMesh) { depthMesh.geometry.dispose(); scene.remove(depthMesh); }
  if (edgesMesh) { edgesMesh.geometry.dispose(); scene.remove(edgesMesh); }

  const geometry = params.buildMode === 'lineBased' ? buildTreeLineBased(params) : buildTree(params);
  const edgesGeo = new THREE.EdgesGeometry(geometry);

  // depthMesh renders first (renderOrder 0) to seed the depth buffer
  depthMesh = new THREE.Mesh(geometry, depthOnlyMaterial);
  depthMesh.renderOrder = 0;

  // edgesMesh tests against the depth buffer (renderOrder 1)
  edgesMesh = new THREE.LineSegments(edgesGeo, edgesMaterial);
  edgesMesh.renderOrder = 1;

  treeMesh = new THREE.Mesh(geometry, solidMaterial);

  scene.add(depthMesh);
  scene.add(edgesMesh);
  scene.add(treeMesh);

  applyRenderModeVisibility(params.renderMode);
  saveParams();
}

export async function applyManifold() {
  document.body.style.cursor = 'wait';
  try {
    const geometry = params.buildMode === 'lineBased' ? await buildTreeManifoldLineBased(params) : await buildTreeManifold(params);
    const edgesGeo = new THREE.EdgesGeometry(geometry);

    treeMesh.geometry.dispose();
    depthMesh.geometry.dispose();
    edgesMesh.geometry.dispose();

    // Reasign new geometries
    treeMesh.geometry = geometry;
    depthMesh.geometry = geometry;
    edgesMesh.geometry = edgesGeo;
  } catch (err) {
    console.error("Manifold operation failed:", err);
  } finally {
    document.body.style.cursor = 'default';
  }
}

// ─── View / Render mode ───────────────────────────────────────────────────────

export function setRenderMode(mode) {
  if (treeMesh) applyRenderModeVisibility(mode);
  saveParams();
}

export function setView(mode) {
  const a = window.innerWidth / window.innerHeight;

  if (mode === 'perspective') {
    perspControls.enabled = true;
    orthoControls.enabled = false;
    activeCamera = perspCamera;
    activeControls = perspControls;
    perspControls.autoRotate = true;
  } else {
    orthoCamera.left = -ORTHO_SIZE * a;
    orthoCamera.right = ORTHO_SIZE * a;
    orthoCamera.top = ORTHO_SIZE;
    orthoCamera.bottom = -ORTHO_SIZE;
    orthoCamera.updateProjectionMatrix();

    if (mode === 'top') {
      orthoCamera.position.set(0, 50, 0.001);
      orthoCamera.up.set(0, 0, -1);
      orthoControls.target.set(0, 0, 0);
    } else if (mode === 'front') {
      orthoCamera.position.set(0, 3, 50);
      orthoCamera.up.set(0, 1, 0);
      orthoControls.target.set(0, 3, 0);
    } else { // left
      orthoCamera.position.set(-50, 3, 0);
      orthoCamera.up.set(0, 1, 0);
      orthoControls.target.set(0, 3, 0);
    }
    orthoCamera.lookAt(orthoControls.target);
    orthoControls.update();

    perspControls.enabled = false;
    orthoControls.enabled = true;
    activeCamera = orthoCamera;
    activeControls = orthoControls;
  }
  saveParams();
}

// ─── GUI ─────────────────────────────────────────────────────────────────────

createGUI(params, DEFAULTS, rebuild, perspControls, setView, setRenderMode, saveParams, applyManifold);

// ─── Init ────────────────────────────────────────────────────────────────────

rebuild();
setRenderMode(params.renderMode);
setView(params.viewMode);

// ─── Resize ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const a = w / h;

  perspCamera.aspect = a;
  perspCamera.updateProjectionMatrix();

  orthoCamera.left = -ORTHO_SIZE * a;
  orthoCamera.right = ORTHO_SIZE * a;
  orthoCamera.top = ORTHO_SIZE;
  orthoCamera.bottom = -ORTHO_SIZE;
  orthoCamera.updateProjectionMatrix();

  renderer.setSize(w, h);
});

// ─── Loop ────────────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  activeControls.update();
  renderer.render(scene, activeCamera);
}

animate();
