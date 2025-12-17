import * as THREE from 'three';

export const generateTreePositions = (count: number, radius: number, height: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Spiral distribution
    const t = i / count;
    const angle = t * Math.PI * 60; // Many turns
    
    // Cone shape: Radius gets smaller as we go up (y increases)
    // y goes from -height/2 to height/2
    const y = (t * height) - (height / 2);
    
    // Normalized height (1 at bottom, 0 at top) for radius calc
    const hNorm = 1 - t;
    const r = radius * hNorm;

    // Add some randomness to volume
    const rRandom = r * (0.8 + Math.random() * 0.4);

    const x = Math.cos(angle) * rRandom;
    const z = Math.sin(angle) * rRandom;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};

export const generateNebulaPositions = (count: number, radius: number) => {
  // Radius default passed in is usually 15, we override logic if needed or caller passes new radius
  // But strictly following the function signature:
  const positions = new Float32Array(count * 3);
  const actualRadius = 20; // Hardcoded to match new PhotoFrame spacing
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    // Ring with volume
    const r = actualRadius + (Math.random() - 0.5) * 5; 
    const spreadY = (Math.random() - 0.5) * 2;

    const x = Math.cos(angle * 3 + Math.random()) * r; // Twist it a bit
    const z = Math.sin(angle * 3 + Math.random()) * r;
    const y = spreadY;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};