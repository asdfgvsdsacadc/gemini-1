import React, { useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ParticleData, ParticleShape } from '../types';

interface MagicTreeProps {
  isExploded: boolean;
}

const PALETTE = [
  '#FFD700', // Gold
  '#C41E3A', // Cardinal Red
  '#C0C0C0', // Silver
  '#FFFFFF', // White
  '#FF4500', // OrangeRed (accent)
];

const GREEN_PALETTE = [
  '#006400', // DarkGreen
  '#228B22', // ForestGreen
  '#32CD32', // LimeGreen
  '#2E8B57', // SeaGreen
  '#008000', // Green
];

const ITEM_COUNT = 2200; 
const RIBBON_SEGMENTS = 600; 
const TREE_HEIGHT = 14;
const MAX_RADIUS = 5.5;

// --- HEART SHADER ---
const HeartShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = scattered/hidden, 1 = heart form
    uAlpha: { value: 0 },
    uColor1: { value: new THREE.Color('#FF007F') }, // Deep Pink
    uColor2: { value: new THREE.Color('#FFC0CB') }, // Light Pink
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    attribute vec3 aTarget;
    attribute float aRandom;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Delay logic: each particle starts moving at a slightly different time based on uProgress
      // map uProgress (0..1) to individual progress (0..1) based on aRandom
      float startAt = aRandom * 0.4; // start between 0.0 and 0.4 progress
      float duration = 0.6; // take 0.6 progress to complete
      float t = smoothstep(startAt, startAt + duration, uProgress);

      // Interpolate position: Start (position) -> End (aTarget)
      // Add some noise during flight
      vec3 noise = vec3(
         sin(uTime * 5.0 + position.x) * 0.2 * (1.0 - t),
         cos(uTime * 5.0 + position.y) * 0.2 * (1.0 - t),
         0.0
      );
      
      vec3 pos = mix(position, aTarget, t) + noise;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size attenuation
      // Particles scale up as they arrive (t)
      float scale = mix(0.0, 1.0, t);
      // Adjusted size for higher density (slightly smaller base)
      gl_PointSize = (6.0 * aRandom + 2.0) * scale * (1.0 / -mvPosition.z);

      // Color gradient
      vColor = mix(uColor1, uColor2, aRandom);
      vAlpha = t; 
    }
  `,
  fragmentShader: `
    uniform float uAlpha;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Circle shape
      vec2 xy = gl_PointCoord.xy - 0.5;
      float dist = length(xy);
      if (dist > 0.5) discard;

      // Soft glow
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);

      // HDR Brightness: Multiply color by 6.0 to trigger heavy bloom
      vec3 hdrColor = vColor * 6.0;

      gl_FragColor = vec4(hdrColor, strength * uAlpha * vAlpha);
    }
  `
};

const HeartParticles: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  // Significantly increased count for "more obvious" volume
  const count = 15000;

  const { positions, targets, randoms } = useMemo(() => {
    const posArray = new Float32Array(count * 3);
    const targetArray = new Float32Array(count * 3);
    const randomArray = new Float32Array(count);

    let i = 0;
    while (i < count) {
      // 1. Generate Target (Heart Shape) via Rejection Sampling
      // Implicit: (x^2 + 9/4y^2 + z^2 - 1)^3 - x^2z^3 - 9/80y^2z^3 < 0
      const range = 1.3;
      const x = (Math.random() - 0.5) * 2 * range;
      const y = (Math.random() - 0.5) * 2 * range;
      const z = (Math.random() - 0.5) * 2 * range;
      
      const a = x*x + (9/4)*(y*y) + z*z - 1;
      const term2 = x*x*z*z*z;
      const term3 = (9/80)*y*y*z*z*z;
      
      if (a*a*a - term2 - term3 < 0) {
        // Inside heart!
        // Scale it up
        const s = 3.5;
        // Map: Math X -> Three X, Math Y -> Three Z, Math Z -> Three Y (to stand upright)
        targetArray[i * 3] = x * s;
        targetArray[i * 3 + 1] = z * s + 2; 
        targetArray[i * 3 + 2] = y * s;
        
        // 2. Generate Start Position (Center/Exploded Cloud)
        posArray[i * 3] = 0; 
        posArray[i * 3 + 1] = 0;
        posArray[i * 3 + 2] = 0;

        randomArray[i] = Math.random();
        i++;
      }
    }
    return { positions: posArray, targets: targetArray, randoms: randomArray };
  }, []);

  useLayoutEffect(() => {
    // IMPORTANT: We do NOT use ctx.revert() on dependency change here.
    // We want the animation to smoothly redirect from its current state.
    
    if (isVisible) {
      // EXPLODE / FORM HEART
      gsap.killTweensOf(materialRef.current.uniforms.uProgress);
      gsap.killTweensOf(materialRef.current.uniforms.uAlpha);
      
      // Slower, smooth buildup for the heart
      gsap.to(materialRef.current.uniforms.uProgress, {
        value: 1,
        duration: 3.0,
        ease: "power2.out"
      });
      gsap.to(materialRef.current.uniforms.uAlpha, {
        value: 1,
        duration: 1.5,
        delay: 0.1,
        ease: "power1.out"
      });
    } else {
      // GATHER / HIDE HEART
      gsap.killTweensOf(materialRef.current.uniforms.uProgress);
      gsap.killTweensOf(materialRef.current.uniforms.uAlpha);

      // Fast dispersal
      gsap.to(materialRef.current.uniforms.uProgress, {
        value: 0,
        duration: 1.2,
        ease: "power2.in"
      });
      gsap.to(materialRef.current.uniforms.uAlpha, {
        value: 0,
        duration: 0.5,
        ease: "power1.out"
      });
    }
  }, [isVisible]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    // Rotate heart slowly
    if (pointsRef.current && isVisible) {
        pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTarget"
          count={targets.length / 3}
          array={targets}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[HeartShaderMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};


// --- TREE COMPONENT ---
const MagicTree: React.FC<MagicTreeProps> = ({ isExploded }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const particles: ParticleData[] = useMemo(() => {
    const data: ParticleData[] = [];
    let idCounter = 0;

    // --- 1. Generate Main Tree ---
    for (let i = 0; i < ITEM_COUNT; i++) {
      const t = i / ITEM_COUNT;
      const angle = t * Math.PI * 50 + (Math.random() * 0.5); 
      const radius = (1 - t) * MAX_RADIUS;
      const randomOffset = 0.8; 
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * randomOffset;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * randomOffset;
      const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2);

      const initialPos = new THREE.Vector3(x, y, z);
      const rand = Math.random();
      let shape, color, scaleVec;

      if (rand < 0.65) {
        shape = ParticleShape.Leaf;
        color = GREEN_PALETTE[Math.floor(Math.random() * GREEN_PALETTE.length)];
        const s = 0.2 + Math.random() * 0.3;
        scaleVec = new THREE.Vector3(s, s, s);
      } else if (rand < 0.80) {
        shape = ParticleShape.Light;
        const lightColors = ['#fffec4', '#ffeb3b', '#ff9800', '#ffffff'];
        color = lightColors[Math.floor(Math.random() * lightColors.length)];
        const s = 0.15 + Math.random() * 0.15;
        scaleVec = new THREE.Vector3(s, s, s);
      } else {
        const geometryShapes = [ParticleShape.Sphere, ParticleShape.Box];
        shape = geometryShapes[Math.floor(Math.random() * geometryShapes.length)];
        color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const s = 0.2 + Math.random() * 0.3;
        scaleVec = new THREE.Vector3(s, s, s);
      }
      
      // Explosion logic: Scatter OUTWARDS heavily to clear center for heart
      const explodeRadius = 25 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const ex = explodeRadius * Math.sin(phi) * Math.cos(theta);
      const ey = explodeRadius * Math.sin(phi) * Math.sin(theta);
      const ez = explodeRadius * Math.cos(phi);
      const explodedPos = new THREE.Vector3(ex, ey, ez);

      const rotation = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

      data.push({ id: idCounter++, shape, color, initialPos, explodedPos, rotation, scale: scaleVec });
    }

    // --- 2. Generate Ribbons ---
    const ribbons = 2;
    for (let r = 0; r < ribbons; r++) {
       const offsetPhase = (r * Math.PI); 
       for (let i = 0; i < RIBBON_SEGMENTS / ribbons; i++) {
          const t = i / (RIBBON_SEGMENTS / ribbons);
          const angle = (t * Math.PI * 12) + offsetPhase; 
          const radius = ((1 - t) * MAX_RADIUS) + 0.6; 
          const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const initialPos = new THREE.Vector3(x, y, z);

          // LookAt logic
          const nextAngle = ((t + 0.01) * Math.PI * 12) + offsetPhase;
          const nextRadius = ((1 - (t + 0.01)) * MAX_RADIUS) + 0.6;
          const nextY = ((t + 0.01) * TREE_HEIGHT) - (TREE_HEIGHT / 2);
          const nextPos = new THREE.Vector3(Math.cos(nextAngle)*nextRadius, nextY, Math.sin(nextAngle)*nextRadius);
          
          const dummyObj = new THREE.Object3D();
          dummyObj.position.copy(initialPos);
          dummyObj.lookAt(nextPos);
          const rotation = dummyObj.rotation.clone();
          
          const explodeRadius = 30;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const explodedPos = new THREE.Vector3(
              explodeRadius * Math.sin(phi) * Math.cos(theta),
              explodeRadius * Math.sin(phi) * Math.sin(theta),
              explodeRadius * Math.cos(phi)
          );

          data.push({
            id: idCounter++,
            shape: ParticleShape.Ribbon,
            color: r === 0 ? '#FFD700' : '#C41E3A',
            initialPos,
            explodedPos,
            rotation,
            scale: new THREE.Vector3(0.15, 0.6, 1)
          });
       }
    }
    return data;
  }, []);

  useLayoutEffect(() => {
    if (!meshRefs.current) return;
    
    // We are NOT using gsap.context().revert() here for the main animation logic.
    // This allows animations to interrupt each other smoothly without snapping particles back to start.
    
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = particles[i];

      // Kill previous tweens on this specific object to prevent conflicts
      gsap.killTweensOf(mesh.position);
      gsap.killTweensOf(mesh.rotation);
      gsap.killTweensOf(mesh.scale);

      if (isExploded) {
        // EXPLODE ANIMATION
        // "expo.out" gives a very strong, fast initial burst that slows down significantly.
        // It feels more like a physical explosion force than "power3".
        gsap.to(mesh.position, {
          x: p.explodedPos.x,
          y: p.explodedPos.y,
          z: p.explodedPos.z,
          duration: 1.2 + Math.random() * 0.8, // Faster, punchier burst
          ease: "expo.out",
        });
        gsap.to(mesh.rotation, {
          x: p.rotation.x + Math.random() * 5,
          y: p.rotation.y + Math.random() * 5,
          z: p.rotation.z + Math.random() * 5,
          duration: 2.5,
          ease: "none"
        });
        if (p.shape === ParticleShape.Ribbon) {
           gsap.to(mesh.scale, { x: 0, y: 0, z: 0, duration: 0.6, ease: "power2.out" }); // Ribbons disappear fast
        }
      } else {
        // GATHER ANIMATION
        // "expo.out" creates a magnetic, high-speed return that decelerates gracefully into place.
        gsap.to(mesh.position, {
          x: p.initialPos.x,
          y: p.initialPos.y,
          z: p.initialPos.z,
          duration: 2.2 + Math.random() * 0.4,
          ease: "expo.out", 
          delay: Math.random() * 0.15 // Less random delay for more cohesive reformation
        });
        gsap.to(mesh.rotation, {
          x: p.rotation.x,
          y: p.rotation.y,
          z: p.rotation.z,
          duration: 2.0,
          ease: "expo.out"
        });
         if (p.shape === ParticleShape.Ribbon) {
           gsap.to(mesh.scale, { 
             x: p.scale.x, 
             y: p.scale.y, 
             z: p.scale.z, 
             duration: 2.0,
             ease: "expo.out"
           });
        }
      }
    });
  }, [isExploded, particles]);

  useFrame((state, delta) => {
    if (groupRef.current) {
        // Slow rotation when tree, very slow when exploded
        const speed = isExploded ? 0.01 : 0.15;
        groupRef.current.rotation.y += delta * speed;
    }
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const leafGeo = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);
  const ribbonGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const octGeo = useMemo(() => new THREE.OctahedronGeometry(0.7, 0), []);

  useEffect(() => {
    return () => {
        sphereGeo.dispose();
        boxGeo.dispose();
        leafGeo.dispose();
        ribbonGeo.dispose();
        octGeo.dispose();
    };
  }, [sphereGeo, boxGeo, leafGeo, ribbonGeo, octGeo]);

  return (
    <>
        <group ref={groupRef}>
            {/* Tree Top Star */}
            <mesh position={[0, TREE_HEIGHT / 2 + 0.5, 0]} geometry={octGeo}>
                <meshStandardMaterial 
                    color="#FFD700" 
                    emissive="#FFD700" 
                    emissiveIntensity={isExploded ? 0 : 4} // Dim star when exploded
                    toneMapped={false} 
                />
            </mesh>

            {particles.map((p, i) => {
                let geometry;
                let material;

                if (p.shape === ParticleShape.Light) {
                    return (
                        <mesh
                            key={p.id}
                            ref={(el) => (meshRefs.current[i] = el)}
                            position={p.initialPos}
                            scale={[p.scale.x, p.scale.y, p.scale.z]}
                            geometry={sphereGeo}
                        >
                            <meshStandardMaterial 
                                color={p.color} 
                                emissive={p.color} 
                                emissiveIntensity={3.0} 
                                toneMapped={false} 
                            />
                        </mesh>
                    );
                }

                if (p.shape === ParticleShape.Leaf) {
                    geometry = leafGeo;
                    material = <meshStandardMaterial color={p.color} roughness={0.6} metalness={0.1} />;
                } else if (p.shape === ParticleShape.Ribbon) {
                    geometry = ribbonGeo;
                    material = <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} roughness={0.2} metalness={0.9} side={THREE.DoubleSide} />;
                } else if (p.shape === ParticleShape.Box) {
                    geometry = boxGeo;
                    material = <meshStandardMaterial color={p.color} roughness={0.2} metalness={0.8} />;
                } else {
                    geometry = sphereGeo;
                    material = <meshStandardMaterial color={p.color} roughness={0.2} metalness={0.8} />;
                }

                return (
                    <mesh
                        key={p.id}
                        ref={(el) => (meshRefs.current[i] = el)}
                        position={p.initialPos}
                        rotation={p.rotation}
                        scale={[p.scale.x, p.scale.y, p.scale.z]}
                        geometry={geometry}
                    >
                        {material}
                    </mesh>
                );
            })}
        </group>

        {/* The Heart Particles Layer */}
        <HeartParticles isVisible={isExploded} />
    </>
  );
};

export default MagicTree;