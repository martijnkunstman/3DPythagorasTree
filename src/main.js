import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildTree } from './tree.js';
import { createGUI } from './gui.js';
import './style.css';

// ─── Defaults & persistence ───────────────────────────────────────────────────

const STORAGE_KEY = 'pythagorasTree.params';

export const DEFAULTS = Object.freeze({
  depth:           8,
  angle:           45,
  twist:           30,
  branches:        2,
  length:          1.5,
  shrinkFactor:    1.2,
  startDiameter:   1.0,
  thicknessShrink: 1.5,
  sides:           4,
  trunkColor:      '#3b1a08',
  leafColor:       '#2d8a2d',
  autoRotateSpeed: 1.5,
  renderMode:      'solid',
  viewMode:        'perspective',
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

// ─── Tree ────────────────────────────────────────────────────────────────────

const solidMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

let treeMesh  = null;
let edgesMesh = null;

function applyRenderModeVisibility(mode) {
  solidMaterial.wireframe = (mode === 'wireframe');
  treeMesh.visible  = (mode !== 'edges');
  edgesMesh.visible = (mode === 'edges');
}

export function rebuild() {
  if (treeMesh)  { treeMesh.geometry.dispose();  scene.remove(treeMesh);  }
  if (edgesMesh) { edgesMesh.geometry.dispose(); scene.remove(edgesMesh); }

  const geometry = buildTree(params);
  treeMesh  = new THREE.Mesh(geometry, solidMaterial);
  edgesMesh = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgesMaterial);

  scene.add(treeMesh);
  scene.add(edgesMesh);
  applyRenderModeVisibility(params.renderMode);
  saveParams();
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
    activeCamera   = perspCamera;
    activeControls = perspControls;
    perspControls.autoRotate = true;
  } else {
    orthoCamera.left   = -ORTHO_SIZE * a;
    orthoCamera.right  =  ORTHO_SIZE * a;
    orthoCamera.top    =  ORTHO_SIZE;
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
    activeCamera   = orthoCamera;
    activeControls = orthoControls;
  }
  saveParams();
}

// ─── GUI ─────────────────────────────────────────────────────────────────────

createGUI(params, DEFAULTS, rebuild, perspControls, setView, setRenderMode, saveParams);

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

  orthoCamera.left   = -ORTHO_SIZE * a;
  orthoCamera.right  =  ORTHO_SIZE * a;
  orthoCamera.top    =  ORTHO_SIZE;
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
