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
      const N           = Math.round(params.branches);
      const childSize   = size / params.thicknessShrink;
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
