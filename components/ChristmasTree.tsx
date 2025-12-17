import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Instance, Instances, useTexture, Text, Image as DreiImage, Sparkles as DreiSparkles } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useStore } from '../store';
import { PHOTO_URLS, PARTICLE_COUNT, ORNAMENT_COLORS } from '../constants';
import { generateTreePositions, generateNebulaPositions } from '../utils/geometry';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const vec3 = new THREE.Vector3();

// New Palette: Pink & White Gold
const TREE_COLORS = ['#FFB7C5', '#FF69B4', '#F1E6D2'];

// Morandi Cream Palette for Frames
const MORANDI_PALETTE = [
  '#E0CDCF', // Muted Pink
  '#DBC4AC', // Warm Beige
  '#C8D5CA', // Sage Greenish
  '#D7D0C8', // Mushroom
  '#E6DFD7', // Cream
  '#C5C6C6', // Warm Grey
  '#D8BFD8', // Thistle (Muted Purple)
  '#BFD0D6'  // Muted Blue
];

// Custom Star Shape
const createStarShape = () => {
  const shape = new THREE.Shape();
  const outerRadius = 0.8;
  const innerRadius = 0.35;
  const points = 5;
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2; // Start from top
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
};

const STAR_SHAPE = createStarShape();

// --- Spiral Ribbon Component ---
const SpiralRibbon = ({ progressRef }: { progressRef: React.MutableRefObject<number> }) => {
  const count = 2000; 
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const sparklesRef = useRef<THREE.Points>(null);
  
  const { treePos, nebulaPos, sparklePos } = useMemo(() => {
    const tPos = new Float32Array(count * 3);
    const nPos = new Float32Array(count * 3);
    const sPos = new Float32Array(count * 3); // Sparkle base positions
    
    for(let i=0; i<count; i++) {
        const t = i / count;
        // 3 full turns
        const angle = t * Math.PI * 2 * 3; 
        
        // Height: span full tree
        // Trimmed bottom (starts at -5) and top (ends at 4 to avoid star overlap)
        const baseY = (t * 9) - 5;
        
        // Adjusted fit: Base Radius ~5.2
        const baseR = 5.2 * (1 - t * 0.90) + 0.5; 

        // RIBBON WIDTH: Reduced by ~50% for a sleeker look
        const bandWidthY = (Math.random() - 0.5) * 0.8; 
        const bandWidthR = (Math.random() - 0.5) * 0.2;

        const r = baseR + bandWidthR;
        const y = baseY + bandWidthY;
        
        tPos[i*3] = Math.cos(angle) * r;
        tPos[i*3+1] = y;
        tPos[i*3+2] = Math.sin(angle) * r;

        // Sparkle Positions: loosely follow the ribbon
        sPos[i*3] = Math.cos(angle) * (baseR + 0.5);
        sPos[i*3+1] = baseY;
        sPos[i*3+2] = Math.sin(angle) * (baseR + 0.5);

        // Nebula Ring Positions
        const nAngle = (i / count) * Math.PI * 2 * 6; 
        const nR = 24 + (Math.random() - 0.5) * 4; 
        nPos[i*3] = Math.cos(nAngle) * nR;
        nPos[i*3+1] = (Math.random() - 0.5) * 3; 
        nPos[i*3+2] = Math.sin(nAngle) * nR;
    }
    return { treePos: tPos, nebulaPos: nPos, sparklePos: sPos };
  }, []);

  const colors = useMemo(() => {
     const arr = new Float32Array(count * 3);
     const c = new THREE.Color();
     for(let i=0; i<count; i++) {
         // Mix Champagne (#F7E7CE) and Light Purple (#E6E6FA)
         if (Math.random() > 0.4) c.set('#F7E7CE'); 
         else c.set('#E6E6FA');
         
         c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
         c.toArray(arr, i*3);
     }
     return arr;
  }, []);

  useFrame((state) => {
      const progress = progressRef.current;
      const time = state.clock.getElapsedTime();

      // Update Ribbon Tetrahedrons
      if(meshRef.current) {
        for(let i=0; i<count; i++) {
            const idx = i * 3;
            let x = THREE.MathUtils.lerp(treePos[idx], nebulaPos[idx], progress);
            let y = THREE.MathUtils.lerp(treePos[idx+1], nebulaPos[idx+1], progress);
            let z = THREE.MathUtils.lerp(treePos[idx+2], nebulaPos[idx+2], progress);

            if (progress < 0.1) {
              // Flowing shimmer
              y += Math.sin(time * 1.5 + i * 0.02) * 0.08; 
            }

            tempObject.position.set(x, y, z);
            tempObject.rotation.set(time + i, time * 0.5, i);
            
            // Small tetrahedrons
            const s = THREE.MathUtils.lerp(0.05, 0.0, progress); 
            tempObject.scale.setScalar(s);
            
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
      }

      // Update Ribbon Sparkles (Points)
      if (sparklesRef.current) {
          const positions = sparklesRef.current.geometry.attributes.position.array as Float32Array;
          for(let i=0; i<count; i++) {
              const idx = i*3;
              // Only active in Tree phase
              if (progress > 0.5) {
                   positions[idx+1] = 1000; // Hide
                   continue;
              }

              // Base spiral pos
              const bx = sparklePos[idx];
              const by = sparklePos[idx+1];
              const bz = sparklePos[idx+2];
              
              // Add dynamic flight orbit around the ribbon center
              // Reduced orbit radius to keep sparkles closer to the ribbon (just outside glow)
              const orbitR = 0.35; 
              const speed = 2.0;
              const ox = Math.sin(time * speed + i) * orbitR;
              const oy = Math.cos(time * speed * 0.8 + i) * orbitR + by; // Bob up/down
              const oz = Math.cos(time * speed + i) * orbitR;

              positions[idx] = bx + ox;
              positions[idx+1] = oy;
              positions[idx+2] = bz + oz;
          }
          sparklesRef.current.geometry.attributes.position.needsUpdate = true;
      }
  });

  return (
    <>
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <tetrahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
                color="#fff" 
                roughness={0.2} 
                metalness={0.8}
                // Light Purple Glow
                emissive="#D8BFD8"
                emissiveIntensity={2.0}
                toneMapped={false}
            />
            <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
        </instancedMesh>
        
        {/* Dynamic Ribbon Sparkles */}
        <points ref={sparklesRef}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position" 
                    count={count} 
                    array={new Float32Array(count * 3)} 
                    itemSize={3} 
                />
            </bufferGeometry>
            <pointsMaterial 
                size={0.15} 
                color="#E6E6FA" 
                transparent 
                opacity={0.8} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
            />
        </points>
    </>
  );
};

// --- Particles Component ---
const Particles = ({ progressRef }: { progressRef: React.MutableRefObject<number> }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { treePos, nebulaPos } = useMemo(() => ({
    treePos: generateTreePositions(PARTICLE_COUNT, 4, 10),
    nebulaPos: generateNebulaPositions(PARTICLE_COUNT, 15)
  }), []);

  const colors = useMemo(() => {
    const array = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Pick random color from palette
      const colorHex = TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)];
      tempColor.set(colorHex);
      
      // Slight variation
      tempColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      
      tempColor.toArray(array, i * 3);
    }
    return array;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const progress = progressRef.current;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Interpolate positions
      const tx = treePos[i * 3];
      const ty = treePos[i * 3 + 1];
      const tz = treePos[i * 3 + 2];

      const nx = nebulaPos[i * 3];
      const ny = nebulaPos[i * 3 + 1];
      const nz = nebulaPos[i * 3 + 2];

      // Lerp
      let x = THREE.MathUtils.lerp(tx, nx, progress);
      let y = THREE.MathUtils.lerp(ty, ny, progress);
      let z = THREE.MathUtils.lerp(tz, nz, progress);

      // Add float/sparkle movement
      y += Math.sin(time + x) * 0.1;

      // Mouse Repulsion Effect
      if (progress < 0.1) {
         const wave = Math.sin(time * 2 + y) * 0.05;
         x += wave;
         z += wave;
      }

      tempObject.position.set(x, y, z);
      
      // Scale particles
      const scale = THREE.MathUtils.lerp(0.08, 0.03, progress);
      tempObject.scale.setScalar(scale);
      
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#fff" // Base color white to let instance colors shine
        roughness={0.5}
        metalness={0.5}
        toneMapped={false}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
};

// --- Single Photo Component ---
interface PhotoFrameProps {
  url: string;
  index: number;
  total: number;
  progressRef: React.MutableRefObject<number>;
  isActive: boolean;
  onClick: (index: number) => void;
}

const PhotoFrame: React.FC<PhotoFrameProps> = ({ 
  url, 
  index, 
  total, 
  progressRef,
  isActive,
  onClick
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(url);
  const [hovered, setHover] = useState(false);
  
  const aspect = texture.image ? (texture.image.width / texture.image.height) : 1;
  const LANDSCAPE_IDS = [3, 5, 6, 12, 13, 15, 17, 21];
  const isLandscape = LANDSCAPE_IDS.includes(index + 1) || aspect > 1.1;

  const frameWidth = isLandscape ? 4.2 : 3.2;
  const frameHeight = isLandscape ? 3.2 : 4.2;
  
  const maxW = isLandscape ? 3.8 : 2.8;
  const maxH = isLandscape ? 2.5 : 3.5;

  let imgW = maxW;
  let imgH = imgW / aspect;

  if (imgH > maxH) {
    imgH = maxH;
    imgW = imgH * aspect;
  }

  // Determine Frame Color (Smart-ish Matching via deterministic assignment)
  // We map index to a Morandi color. 
  // For a real "Smart" match we'd need to analyze texture pixels, which is expensive in React/WebGL for 24 images quickly.
  // A deterministic palette assignment looks curated enough.
  const frameColor = MORANDI_PALETTE[index % MORANDI_PALETTE.length];

  useFrame((state) => {
    if (!meshRef.current) return;
    const progress = progressRef.current;
    
    // Tree Position
    const treeAngle = (index / total) * Math.PI * 10;
    const treeH = (index / total) * 8 - 4;
    const treeR = (1 - (treeH + 5)/10) * 3;
    const tx = Math.cos(treeAngle) * treeR * 0.5;
    const tz = Math.sin(treeAngle) * treeR * 0.5;
    const ty = treeH;

    // Nebula Position
    const nebAngle = (index / total) * Math.PI * 2;
    const baseR = 20;
    const popR = 23; 
    const nebR = isActive ? popR : baseR;
    
    const nx = Math.cos(nebAngle) * nebR;
    const nz = Math.sin(nebAngle) * nebR;
    const ny = Math.sin(index) * 0.5;

    const x = THREE.MathUtils.lerp(tx, nx, progress);
    const y = THREE.MathUtils.lerp(ty, ny, progress);
    const z = THREE.MathUtils.lerp(tz, nz, progress);

    meshRef.current.position.set(x, y, z);
    
    meshRef.current.lookAt(0, y, 0); 
    meshRef.current.rotateY(Math.PI); 
    
    const baseScale = 1.2;
    const activeMultiplier = isActive ? 1.3 : 1.0;
    const hoverMultiplier = hovered ? 1.1 : 1.0;
    
    const targetScale = THREE.MathUtils.lerp(0, baseScale * activeMultiplier * hoverMultiplier, progress);
    
    meshRef.current.scale.setScalar(targetScale);
  });

  return (
    <group 
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[frameWidth, frameHeight, 0.1]} />
        {/* Morandi Colored Frame */}
        <meshStandardMaterial 
            color={isActive ? "#fff" : frameColor} 
            roughness={0.9} // Matte finish
            metalness={0.1}
        />
      </mesh>
      <mesh ref={imageRef} position={[0, 0.2, 0.06]}>
         <planeGeometry args={[imgW, imgH]} />
         <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};

// --- Ornaments ---
const Ornaments = ({ progressRef }: { progressRef: React.MutableRefObject<number> }) => {
  const count = 100;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { treePos, nebulaPos } = useMemo(() => ({
    treePos: generateTreePositions(count, 4.2, 10),
    nebulaPos: generateNebulaPositions(count, 18)
  }), []);
  
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
        const c = new THREE.Color(ORNAMENT_COLORS[Math.floor(Math.random() * ORNAMENT_COLORS.length)]);
        c.toArray(arr, i*3);
    }
    return arr;
  }, []);

  useFrame((state) => {
      if(!meshRef.current) return;
      const progress = progressRef.current;
      const time = state.clock.getElapsedTime();

      for(let i=0; i<count; i++) {
          const tx = treePos[i*3];
          const ty = treePos[i*3+1];
          const tz = treePos[i*3+2];
          
          const nx = nebulaPos[i*3];
          const ny = nebulaPos[i*3+1];
          const nz = nebulaPos[i*3+2];

          const x = THREE.MathUtils.lerp(tx, nx, progress);
          const y = THREE.MathUtils.lerp(ty, ny, progress) + Math.sin(time + i)*0.2;
          const z = THREE.MathUtils.lerp(tz, nz, progress);

          tempObject.position.set(x, y, z);
          // Scale reduced: 0.18 for tree, 0.1 for nebula
          tempObject.scale.setScalar(THREE.MathUtils.lerp(0.18, 0.1, progress));
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial 
            color="white" 
            roughness={0.1} 
            metalness={1} 
            envMapIntensity={2}
          />
          <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
      </instancedMesh>
  )
}

// --- Main Container ---
const ChristmasTree = () => {
  const { phase, setPhase, gesture, setGesture, activePhotoIndex, nextPhoto, prevPhoto, setActivePhotoIndex } = useStore();
  const progressRef = useRef(0);
  const lastGestureTimeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (gesture === 'Open_Palm') {
      if (phase === 'tree') {
        setPhase('blooming');
      } else if (phase === 'nebula') {
         const now = Date.now();
         if (now - lastGestureTimeRef.current > 1000) {
            nextPhoto();
            lastGestureTimeRef.current = now;
         }
      }
    }
    if (gesture === 'Closed_Fist') {
      if (phase === 'nebula') {
        setPhase('collapsing');
      }
    }
  }, [gesture, phase, setPhase, nextPhoto]);

  useEffect(() => {
    if (phase === 'blooming') {
      gsap.to(progressRef, {
        current: 1,
        duration: 2.5,
        ease: 'elastic.out(1, 0.75)',
        onComplete: () => setPhase('nebula')
      });
      gsap.to(camera.position, { z: 30, y: 0, duration: 2 });
    } else if (phase === 'collapsing') {
      gsap.to(progressRef, {
        current: 0,
        duration: 2,
        ease: 'power3.inOut',
        onComplete: () => setPhase('tree')
      });
      gsap.to(camera.position, { z: 15, y: 0, duration: 2 });
    }
  }, [phase, setPhase, camera]);

  useFrame((state) => {
      const time = state.clock.getElapsedTime();

      // Rotate Star
      if (starRef.current) {
        starRef.current.rotation.y = time * 0.5;
        starRef.current.rotation.z = Math.sin(time) * 0.1;
      }

      if (phase === 'nebula') {
        const total = PHOTO_URLS.length;
        const angle = (activePhotoIndex / total) * Math.PI * 2;
        const targetRotation = -angle + Math.PI / 2;
        
        let currentY = groupRef.current!.rotation.y;
        const normalize = (a: number) => a - Math.PI * 2 * Math.floor((a + Math.PI) / (Math.PI * 2));
        const diff = normalize(targetRotation - currentY);
        
        groupRef.current!.rotation.y += diff * 0.05;
      } else {
        groupRef.current!.rotation.y += 0.002;
      }
  });

  return (
    <group ref={groupRef}>
      <Particles progressRef={progressRef} />
      <Ornaments progressRef={progressRef} />
      <SpiralRibbon progressRef={progressRef} />
      
      {/* Tree Trunk */}
      <mesh position={[0, -5.5, 0]}>
        <cylinderGeometry args={[0.4, 0.8, 2.5, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>

      {/* Fancy Star at top */}
      <group position={[0, 5.2, 0]} ref={starRef}>
         {/* The Shape */}
         <mesh>
            <extrudeGeometry args={[STAR_SHAPE, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }]} />
            <meshStandardMaterial 
              color="#FFFACD" 
              emissive="#FFFACD" 
              emissiveIntensity={3} 
              toneMapped={false} 
            />
         </mesh>
         {/* Halo/Glow Billboard */}
         <mesh scale={[2.5, 2.5, 1]} position={[0,0,-0.1]}>
             <planeGeometry />
             <meshBasicMaterial 
                color="#FFD700" 
                transparent 
                opacity={0.2} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
             />
         </mesh>
         <pointLight color="#FFFACD" intensity={3} distance={8} decay={2} />
         
         {/* Dynamic Star Sparkles */}
         <DreiSparkles 
            count={40} 
            scale={2.5} 
            size={4} 
            speed={0.4} 
            opacity={1} 
            color="#FFF" 
         />
      </group>

      {/* Photos */}
      {PHOTO_URLS.map((url, i) => (
        <PhotoFrame 
          key={i} 
          url={url} 
          index={i} 
          total={PHOTO_URLS.length} 
          progressRef={progressRef}
          isActive={i === activePhotoIndex}
          onClick={setActivePhotoIndex}
        />
      ))}
    </group>
  );
};

export default ChristmasTree;