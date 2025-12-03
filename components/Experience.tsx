import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './StarField';
import MagicTree from './MagicTree';

interface ExperienceProps {
  isExploded: boolean;
}

const Experience: React.FC<ExperienceProps> = ({ isExploded }) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 14], fov: 60 }}
        dpr={[1, 2]} 
        gl={{ 
            antialias: false,
            alpha: false,
            stencil: false,
            depth: true
        }} 
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#020202']} />
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={35}
          />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.5}
            penumbra={1}
            intensity={50}
            castShadow
          />
          <pointLight position={[-10, -5, -10]} intensity={20} color="#004400" />
          
          {/* Reflections */}
          <Environment preset="night" />

          {/* Content */}
          <StarField />
          <MagicTree isExploded={isExploded} />
          
          {/* Ground Reflection hints */}
          <ContactShadows 
            opacity={0.5} 
            scale={20} 
            blur={2.5} 
            far={10} 
            resolution={256} 
            color="#000000" 
          />

          {/* Post Processing for Dazzling Effect */}
          <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={1.1} // Threshold to make lights pop
                mipmapBlur 
                intensity={1.8} // High intensity for magical feel
                radius={0.7}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Experience;