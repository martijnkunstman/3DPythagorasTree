import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Build the 3D Pythagoras Tree geometry.
 * @param {object} params
 * @param {number} params.depth        - max recursion depth (1–12)
 * @param {number} params.angle        - split angle in degrees (5–85)
 * @param {number} params.twist        - Y-axis twist per level in degrees (0–180)
 * @param {number} params.branches     - children per node (2–8)
 * @param {number} params.length       - root branch length
 * @param {number} params.shrinkFactor - length divisor per level (1=none, 2=half)
 * @param {number} params.sides        - cross-section polygon sides (3–8)
 * @param {string} params.trunkColor   - CSS hex color for deep branches
 * @param {string} params.leafColor    - CSS hex color for tip branches
 * @returns {THREE.BufferGeometry} merged geometry with vertex colors
 */
export function buildTree(params) {
  const maxDepth = params.depth;
  const splitAngle = THREE.MathUtils.degToRad(params.angle);
  const twistPerLevel = THREE.MathUtils.degToRad(params.twist);

  const sides = Math.round(params.sides);
  const trunkColor = new THREE.Color(params.trunkColor);
  const leafColor = new THREE.Color(params.leafColor);

  const geometries = [];

  function recurse(parentMatrix, size, length, depth, twistAccum) {
    // CylinderGeometry: axis along Y, centered at origin
    const geo = new THREE.CylinderGeometry(size / 2, size / 2, length, sides);

    // Strip unused attributes for performance (MeshBasicMaterial ignores them)
    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');

    geo.applyMatrix4(parentMatrix);

    // Interpolate color: trunk (depth 0) → leaf (depth maxDepth-1)
    const t = maxDepth > 1 ? depth / (maxDepth - 1) : 1;
    const color = trunkColor.clone().lerp(leafColor, t);

    const vertexCount = geo.attributes.position.count;
    const colorsArray = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      colorsArray[i * 3 + 0] = color.r;
      colorsArray[i * 3 + 1] = color.g;
      colorsArray[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    geometries.push(geo);

    if (depth < maxDepth - 1) {
      const N = Math.round(params.branches);
      const childSize = size / params.thicknessShrink;
      const childLength = length / params.shrinkFactor;

      for (let i = 0; i < N; i++) {
        // Distribute N children evenly around the parent's Y axis,
        // then lean each outward by splitAngle.
        //
        // Two-translation trick ensures exact connection:
        //   1. T(0, length/2, 0)      — move to parent's top in parent space
        //   2. Ry(azimuth) * Rz(angle) — apply rotations
        //   3. T(0, childLength/2, 0)  — offset child center up in child's local frame
        //      so child bottom lands exactly at step 1's point
        const azimuth = twistAccum + (2 * Math.PI * i / N);
        const childMatrix = parentMatrix.clone()
          .multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0))
          .multiply(new THREE.Matrix4().makeRotationY(azimuth))
          .multiply(new THREE.Matrix4().makeRotationZ(splitAngle))
          .multiply(new THREE.Matrix4().makeTranslation(0, childLength / 2, 0));

        recurse(childMatrix, childSize, childLength, depth + 1, twistAccum + twistPerLevel);
      }
    }
  }

  recurse(new THREE.Matrix4(), params.startDiameter, params.length, 0, 0);

  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  return mergeGeometries(geometries, false);
}

/**
 * Build tree by first generating a line-based skeleton, 
 * then building cylinders along those lines that continuously taper.
 */
export function buildTreeLineBased(params) {
  const maxDepth = params.depth;
  const splitAngle = THREE.MathUtils.degToRad(params.angle);
  const twistPerLevel = THREE.MathUtils.degToRad(params.twist);
  const sides = Math.round(params.sides);
  const trunkColor = new THREE.Color(params.trunkColor);
  const leafColor = new THREE.Color(params.leafColor);

  // Phase 1: Build the 3D model out of lines (skeleton)
  const lines = [];

  function recurseLines(parentMatrix, size, length, depth, twistAccum) {
    const t = maxDepth > 1 ? depth / (maxDepth - 1) : 1;
    const color = trunkColor.clone().lerp(leafColor, t);
    const childSize = size / params.thicknessShrink;
    const childLength = length / params.shrinkFactor;

    lines.push({
      matrix: parentMatrix.clone(),
      length: length,
      sizeBottom: size,
      sizeTop: childSize, // Gets thinner smoothly
      color: color,
      depth: depth
    });

    if (depth < maxDepth - 1) {
      const N = Math.round(params.branches);

      for (let i = 0; i < N; i++) {
        const azimuth = twistAccum + (2 * Math.PI * i / N);
        const childMatrix = parentMatrix.clone()
          .multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0))
          .multiply(new THREE.Matrix4().makeRotationY(azimuth))
          .multiply(new THREE.Matrix4().makeRotationZ(splitAngle))
          .multiply(new THREE.Matrix4().makeTranslation(0, childLength / 2, 0));

        recurseLines(childMatrix, childSize, childLength, depth + 1, twistAccum + twistPerLevel);
      }
    }
  }

  // Generate skeleton
  recurseLines(new THREE.Matrix4(), params.startDiameter, params.length, 0, 0);

  // Phase 2: Build branches based on the line model
  const geometries = [];
  for (const line of lines) {
    // Cylinder geometry that gets thinner smoothly: (radiusTop, radiusBottom)
    const geo = new THREE.CylinderGeometry(line.sizeTop / 2, line.sizeBottom / 2, line.length, sides);

    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');
    geo.applyMatrix4(line.matrix);

    const vertexCount = geo.attributes.position.count;
    const colorsArray = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      colorsArray[i * 3 + 0] = line.color.r;
      colorsArray[i * 3 + 1] = line.color.g;
      colorsArray[i * 3 + 2] = line.color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    geometries.push(geo);
  }

  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  return mergeGeometries(geometries, false);
}

let manifoldModule = null;

export async function initManifold() {
  if (!manifoldModule) {
    const Module = (await import('manifold-3d')).default;
    manifoldModule = await Module();
    manifoldModule.setup();
  }
  return manifoldModule;
}

/**
 * Build a true Manifold unified geometry.
 */
export async function buildTreeManifold(params) {
  const m = await initManifold();

  const maxDepth = params.depth;
  const splitAngle = THREE.MathUtils.degToRad(params.angle);
  const twistPerLevel = THREE.MathUtils.degToRad(params.twist);
  const sides = Math.round(params.sides);

  const trunkColor = new THREE.Color(params.trunkColor);
  const leafColor = new THREE.Color(params.leafColor);

  const mList = [];

  function recurse(parentMatrix, size, length, depth, twistAccum) {
    // Colors
    const t = maxDepth > 1 ? depth / (maxDepth - 1) : 1;
    const color = trunkColor.clone().lerp(leafColor, t);

    // Create Manifold cylinder mapping along Z from -height/2 to height/2
    const cyl = m.Manifold.cylinder(length, size / 2, size / 2, sides, true);
    let mesh = cyl.getMesh();

    // Add RGB properties (numProp = 6: X,Y,Z, R,G,B)
    mesh.numProp = 6;
    const newProps = new Float32Array((mesh.vertProperties.length / 3) * 6);
    for (let i = 0, j = 0; i < mesh.vertProperties.length; i += 3, j += 6) {
      newProps[j] = mesh.vertProperties[i];
      newProps[j + 1] = mesh.vertProperties[i + 1];
      newProps[j + 2] = mesh.vertProperties[i + 2];
      newProps[j + 3] = color.r;
      newProps[j + 4] = color.g;
      newProps[j + 5] = color.b;
    }
    mesh.vertProperties = newProps;
    let nodeManifold = new m.Manifold(mesh);

    // ThreeJS cylinder is along Y. We created along Z.
    // So rotate -90 around X to align with ThreeJS cylinder:
    const alignMtx = new THREE.Matrix4().makeRotationX(-Math.PI / 2);

    const nodeMatrix = parentMatrix.clone().multiply(alignMtx);

    // Convert to flat column-major 16-element array for transform
    const flatMatrix = Array.from(nodeMatrix.elements);
    nodeManifold = nodeManifold.transform(flatMatrix);

    mList.push(nodeManifold);

    if (depth < maxDepth - 1) {
      const N = Math.round(params.branches);
      const childSize = size / params.thicknessShrink;
      const childLength = length / params.shrinkFactor;

      for (let i = 0; i < N; i++) {
        const azimuth = twistAccum + (2 * Math.PI * i / N);
        const childMatrix = parentMatrix.clone()
          .multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0))
          .multiply(new THREE.Matrix4().makeRotationY(azimuth))
          .multiply(new THREE.Matrix4().makeRotationZ(splitAngle))
          .multiply(new THREE.Matrix4().makeTranslation(0, childLength / 2, 0));

        recurse(childMatrix, childSize, childLength, depth + 1, twistAccum + twistPerLevel);
      }
    }
  }

  recurse(new THREE.Matrix4(), params.startDiameter, params.length, 0, 0);

  if (mList.length === 0) return new THREE.BufferGeometry();

  // Compute union of everything
  let finalManifold = m.Manifold.union(mList);

  // Apply smoothing if requested
  if (params.manifoldSmoothness > 0 || params.manifoldRefine > 1) {
    if (params.manifoldSmoothness > 0) {
      finalManifold = finalManifold.smoothOut(params.manifoldSharpAngle, params.manifoldSmoothness);
    }
    if (params.manifoldRefine > 1) {
      finalManifold = finalManifold.refine(params.manifoldRefine);
    }
  }

  // Return to ThreeJS BufferGeometry
  const finalMesh = finalManifold.getMesh();
  const geo = new THREE.BufferGeometry();

  const numVerts = finalMesh.vertProperties.length / finalMesh.numProp;
  const positions = new Float32Array(numVerts * 3);
  const colors = new Float32Array(numVerts * 3);

  for (let i = 0; i < numVerts; i++) {
    const propIdx = i * finalMesh.numProp;
    positions[i * 3] = finalMesh.vertProperties[propIdx];
    positions[i * 3 + 1] = finalMesh.vertProperties[propIdx + 1];
    positions[i * 3 + 2] = finalMesh.vertProperties[propIdx + 2];

    colors[i * 3] = finalMesh.vertProperties[propIdx + 3];
    colors[i * 3 + 1] = finalMesh.vertProperties[propIdx + 4];
    colors[i * 3 + 2] = finalMesh.vertProperties[propIdx + 5];
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(finalMesh.triVerts, 1));
  geo.computeVertexNormals();

  return geo;
}
