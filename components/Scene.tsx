import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import ChristmasTree from './ChristmasTree';

const Scene = () => {
  return (
    <div className="w-full h-screen bg-[#050103]">
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          {/* Warm Main Light */}
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffaa00" castShadow />
          {/* Cool Rim Light */}
          <pointLight position={[-10, 0, -10]} intensity={1} color="#4455ff" />
          {/* Holy Top Spotlight */}
          <spotLight 
            position={[0, 15, 0]} 
            angle={0.3} 
            penumbra={1} 
            intensity={2} 
            color="#fff0f0" 
            castShadow
          />

          {/* Environment */}
          <Environment preset="city" /> 
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#ffcc00" />

          {/* Main Content */}
          <ChristmasTree />

          {/* Post Processing */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <Noise opacity={0.02} />
          </EffectComposer>

          {/* Controls - restricted slightly */}
          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5}
            minDistance={5}
            maxDistance={40}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
