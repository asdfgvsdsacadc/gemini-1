import * as THREE from 'three';

export enum ParticleShape {
  Sphere = 'Sphere',
  Box = 'Box',
  Plane = 'Plane',
  Light = 'Light',
  Leaf = 'Leaf',
  Ribbon = 'Ribbon',
  Heart = 'Heart'
}

export interface ParticleData {
  id: number;
  shape: ParticleShape;
  color: string;
  initialPos: THREE.Vector3; // The tree spiral position
  explodedPos: THREE.Vector3; // The random scattered position
  rotation: THREE.Euler;
  scale: THREE.Vector3; // Changed to Vector3 to support non-uniform scaling (ribbons)
}