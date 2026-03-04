import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Build the 3D Pythagoras Tree geometry.
 * @param {object} params
 * @param {number} params.depth       - max recursion depth (1–12)
 * @param {number} params.angle       - split angle in degrees (5–85)
 * @param {number} params.twist       - Y-axis twist per level in degrees (0–180)
 * @param {string} params.trunkColor  - CSS hex color for deep branches
 * @param {string} params.leafColor   - CSS hex color for tip branches
 * @returns {THREE.BufferGeometry} merged geometry with vertex colors
 */
export function buildTree(params) {
  const maxDepth = params.depth;
  const splitAngle = THREE.MathUtils.degToRad(params.angle);
  const twistPerLevel = THREE.MathUtils.degToRad(params.twist);

  const trunkColor = new THREE.Color(params.trunkColor);
  const leafColor = new THREE.Color(params.leafColor);

  const geometries = [];

  function recurse(parentMatrix, size, depth, twistAccum) {
    const geo = new THREE.BoxGeometry(size, size, size);

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
      const leftSize  = size * Math.cos(splitAngle);
      const rightSize = size * Math.sin(splitAngle);

      for (const [sign, childSize] of [[+1, leftSize], [-1, rightSize]]) {
        const yOffset = size / 2 + childSize / 2;

        // Transform order (right-to-left composition):
        //   1. Rz(±splitAngle) — lean left or right in split plane
        //   2. Ry(twistAccum)  — orient the split plane around Y
        //   3. T(0, yOffset, 0) — move to top of parent box
        //   4. parentMatrix
        const childMatrix = parentMatrix.clone()
          .multiply(new THREE.Matrix4().makeTranslation(0, yOffset, 0))
          .multiply(new THREE.Matrix4().makeRotationY(twistAccum))
          .multiply(new THREE.Matrix4().makeRotationZ(sign * splitAngle));

        recurse(childMatrix, childSize, depth + 1, twistAccum + twistPerLevel);
      }
    }
  }

  recurse(new THREE.Matrix4(), 1.0, 0, 0);

  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  return mergeGeometries(geometries, false);
}
