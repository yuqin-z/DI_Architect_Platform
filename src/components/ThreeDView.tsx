import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAnnotationStore } from '../store/annotationStore';
import { Floor, Node, Corridor } from '../types';
import { Layers, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Palette, Settings, Bug } from 'lucide-react';
import { pcsTo3D, createFloorPlaneGeometry, validateCoordinateMapping, createTestPoints, calculateWorldUnitsPerPixel } from '../utils/coordinateMapping';

// Floor component
const FloorPlane: React.FC<{ 
  floor: Floor; 
  yPosition: number; 
  worldUnitsPerPixel: number;
  showFloor: boolean;
  showDebug: boolean;
}> = ({ floor, yPosition, worldUnitsPerPixel, showFloor, showDebug }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const { getFloorDimensions } = useAnnotationStore();
  
  const floorDims = getFloorDimensions(floor.index);
  
  useEffect(() => {
    if (floor.backgroundImage) {
      const loader = new THREE.TextureLoader();
      loader.load(floor.backgroundImage, (loadedTexture) => {
        // Critical: Set flipY to false to prevent vertical mirroring
        loadedTexture.flipY = false;
        loadedTexture.anisotropy = 16;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.wrapS = THREE.ClampToEdgeWrap;
        loadedTexture.wrapT = THREE.ClampToEdgeWrap;
        // Ensure proper UV mapping - no offset or scaling
        loadedTexture.offset.set(0, 0);
        loadedTexture.repeat.set(1, 1);
        loadedTexture.center.set(0.5, 0.5);
        loadedTexture.rotation = 0;
        setTexture(loadedTexture);
      });
    }
  }, [floor.backgroundImage]);
  
  if (!showFloor) return null;
  
  if (!floorDims) {
    console.warn(`No dimensions found for floor ${floor.index}`);
    return (
      <group position={[0, yPosition, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }
  
  const planeGeometry = createFloorPlaneGeometry(floorDims, worldUnitsPerPixel);
  
  // Debug test points for coordinate validation
  const testPoints = showDebug ? createTestPoints(floorDims) : [];
  
  return (
    <group position={[0, yPosition, 0]}>
      {/* Floor plane in XZ orientation (Y up) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[planeGeometry.width, planeGeometry.height]} />
        <meshBasicMaterial 
          map={texture} 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Debug: Floor bounds wireframe */}
      {showDebug && (
        <group>
          {/* Floor boundary wireframe */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(planeGeometry.width, planeGeometry.height)]} />
            <lineBasicMaterial color="#ff0000" />
          </lineSegments>
          
          {/* Test point markers at corners and center */}
          {testPoints.map((point, index) => {
            const [x3D, y3D, z3D] = pcsTo3D(point, floorDims, worldUnitsPerPixel, floor.index, 0);
            return (
              <mesh key={index} position={[x3D, 1, z3D]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color="#ff0000" />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* Floor label */}
      <Html position={[planeGeometry.width / 2 - 10, 1, -planeGeometry.height / 2 + 10]}>
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-lg">
          {floor.name}
          {showDebug && (
            <div className="text-xs text-red-600">
              {floorDims.naturalWidth}×{floorDims.naturalHeight}px
              <br />
              Scale: {worldUnitsPerPixel.toFixed(4)} units/px
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

// Node component
const NodeMesh: React.FC<{ 
  node: Node; 
  floorSpacing: number;
  worldUnitsPerPixel: number;
  colorBy: 'type' | 'importance';
  showLabels: boolean;
  showDebug: boolean;
  onNodeClick: (node: Node) => void;
}> = ({ node, floorSpacing, worldUnitsPerPixel, colorBy, showLabels, showDebug, onNodeClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { getFloorDimensions } = useAnnotationStore();
  
  const floorDims = getFloorDimensions(node.floorIndex);
  
  if (!floorDims) {
    console.warn(`No dimensions found for floor ${node.floorIndex} for node ${node.id}`);
    return null;
  }
  
  const getNodeColor = () => {
    if (colorBy === 'importance') {
      switch (node.design_importance) {
        case 'yes': return '#10b981'; // Green
        case 'no': return '#ef4444'; // Red
        default: return '#6b7280'; // Gray
      }
    }
    
    // Color by type (same as 2D)
    switch (node.type) {
      case 'Decision Point (DP)': return '#dc2626';
      case 'Decision Zone (DZ)': return '#ea580c';
      case 'Entrance/Exit (E)': return '#16a34a';
      case 'Vertical Connection (VC)': return '#2563eb';
      case 'Activity Destination (AD)': return '#ea580c';
      default: return '#0891b2';
    }
  };
  
  // Convert PCS coordinates to 3D world coordinates
  const [x3D, y3D, z3D] = pcsTo3D(node.position, floorDims, worldUnitsPerPixel, node.floorIndex, floorSpacing);
  const position: [number, number, number] = [x3D, y3D + 2, z3D]; // +2 to place above floor
  
  const getGeometry = () => {
    switch (node.shape) {
      case 'circle':
        return <sphereGeometry args={[2, 16, 16]} />;
      case 'square':
        return <boxGeometry args={[3, 3, 3]} />;
      case 'diamond':
        return <octahedronGeometry args={[2]} />;
      case 'star':
        return <sphereGeometry args={[2, 5, 5]} />;
      default:
        return <sphereGeometry args={[2, 16, 16]} />;
    }
  };
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => onNodeClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        {getGeometry()}
        <meshStandardMaterial 
          color={getNodeColor()} 
          emissive={hovered ? getNodeColor() : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      
      {showLabels && (
        <Html position={[0, 4, 0]} center>
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-lg pointer-events-none">
            {node.id}
            {showDebug && (
              <div className="text-xs text-blue-600">
                PCS: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                <br />
                3D: ({x3D.toFixed(1)}, {y3D.toFixed(1)}, {z3D.toFixed(1)})
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// Corridor/Segment component
const CorridorLine: React.FC<{ 
  corridor: Corridor; 
  floorSpacing: number;
  worldUnitsPerPixel: number;
  showCrossFloor: boolean;
  showDebug: boolean;
}> = ({ corridor, floorSpacing, worldUnitsPerPixel, showCrossFloor, showDebug }) => {
  const { getFloorDimensions } = useAnnotationStore();
  
  const points = useMemo(() => {
    return corridor.path.map((point, index) => {
      const pointFloorIndex = point.z ?? corridor.floorIndex;
      const floorDims = getFloorDimensions(pointFloorIndex);
      
      if (!floorDims) {
        console.warn(`No dimensions found for floor ${pointFloorIndex} for corridor ${corridor.id} point ${index}`);
        return new THREE.Vector3(0, pointFloorIndex * floorSpacing + 2, 0);
      }
      
      const [x3D, y3D, z3D] = pcsTo3D(point, floorDims, worldUnitsPerPixel, pointFloorIndex, floorSpacing);
      return new THREE.Vector3(x3D, y3D + 2, z3D); // +2 to place above floor
    });
  }, [corridor.path, corridor.floorIndex, floorSpacing, worldUnitsPerPixel, getFloorDimensions]);
  
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);
  
  const isCrossFloor = corridor.isCrossFloor;
  
  if (isCrossFloor && !showCrossFloor) return null;
  
  return (
    <group>
      <line geometry={geometry}>
        <lineDashedMaterial
          color={isCrossFloor ? '#8b5cf6' : '#3b82f6'}
          dashSize={isCrossFloor ? 2 : 0}
          gapSize={isCrossFloor ? 1 : 0}
          linewidth={2}
        />
      </line>
      
      {/* Debug: Show corridor points */}
      {showDebug && points.map((point, index) => (
        <mesh key={index} position={[point.x, point.y + 1, point.z]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      ))}
    </group>
  );
};

// Camera controller
const CameraController: React.FC<{ 
  floors: Floor[];
  floorSpacing: number;
  focusFloor: number | null;
  onFocusComplete: () => void;
}> = ({ floors, floorSpacing, focusFloor, onFocusComplete }) => {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (focusFloor !== null && controls) {
      const targetY = focusFloor * floorSpacing;
      const targetPosition = new THREE.Vector3(50, targetY + 30, 50);
      const targetLookAt = new THREE.Vector3(0, targetY, 0);
      
      // Animate camera
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      
      let progress = 0;
      const animate = () => {
        progress += 0.05;
        if (progress >= 1) {
          camera.position.copy(targetPosition);
          controls.target.copy(targetLookAt);
          controls.update();
          onFocusComplete();
          return;
        }
        
        camera.position.lerpVectors(startPosition, targetPosition, progress);
        controls.target.lerpVectors(startTarget, targetLookAt, progress);
        controls.update();
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [focusFloor, floorSpacing, camera, controls, onFocusComplete]);
  
  return null;
};

// Main 3D View component
const ThreeDView: React.FC = () => {
  const {
    floors,
    nodes,
    corridors,
    canvasState,
    getFloorDimensions,
    openNodeModal,
    openCorridorModal
  } = useAnnotationStore();
  
  // 3D Settings
  const [floorSpacing, setFloorSpacing] = useState(8);
  const [worldUnitsPerPixel, setWorldUnitsPerPixel] = useState(0.02); // Normalized scale factor
  const [showLabels, setShowLabels] = useState(true);
  const [showCrossFloor, setShowCrossFloor] = useState(true);
  const [colorBy, setColorBy] = useState<'type' | 'importance'>('type');
  const [visibleFloors, setVisibleFloors] = useState<Set<number>>(new Set());
  const [focusFloor, setFocusFloor] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Initialize visible floors
  useEffect(() => {
    setVisibleFloors(new Set(floors.map(f => f.index)));
  }, [floors]);
  
  const handleNodeClick = (node: Node) => {
    openNodeModal(node);
  };
  
  const handleCorridorClick = (corridor: Corridor) => {
    openCorridorModal(corridor);
  };
  
  const handleFitView = () => {
    // This would be handled by the camera controller
    setFocusFloor(null);
  };
  
  const toggleFloorVisibility = (floorIndex: number) => {
    setVisibleFloors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(floorIndex)) {
        newSet.delete(floorIndex);
      } else {
        newSet.add(floorIndex);
      }
      return newSet;
    });
  };
  
  if (floors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Layers size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Floor Plans</h3>
          <p className="text-gray-500">Upload floor plans to view in 3D mode</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full relative bg-gray-900">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [50, 30, 50], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 20, 0]} intensity={0.5} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          screenSpacePanning={true}
          maxPolarAngle={Math.PI * 0.8}
          minDistance={10}
          maxDistance={200}
        />
        
        <CameraController
          floors={floors}
          floorSpacing={floorSpacing}
          focusFloor={focusFloor}
          onFocusComplete={() => setFocusFloor(null)}
        />
        
        {/* Render floors */}
        {floors.map(floor => (
          <FloorPlane
            key={floor.id}
            floor={floor}
            yPosition={floor.index * floorSpacing}
            worldUnitsPerPixel={worldUnitsPerPixel}
            showFloor={visibleFloors.has(floor.index)}
            showDebug={showDebug}
          />
        ))}
        
        {/* Render nodes */}
        {nodes.map(node => (
          <NodeMesh
            key={node.id}
            node={node}
            floorSpacing={floorSpacing}
            worldUnitsPerPixel={worldUnitsPerPixel}
            colorBy={colorBy}
            showLabels={showLabels}
            showDebug={showDebug}
            onNodeClick={handleNodeClick}
          />
        ))}
        
        {/* Render corridors */}
        {corridors.map(corridor => (
          <CorridorLine
            key={corridor.id}
            corridor={corridor}
            floorSpacing={floorSpacing}
            worldUnitsPerPixel={worldUnitsPerPixel}
            showCrossFloor={showCrossFloor}
            showDebug={showDebug}
          />
        ))}
      </Canvas>
      
      {/* 3D Toolbar */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="flex items-center gap-2 p-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-lg transition-colors ${
              showDebug ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
            }`}
            title="Toggle Debug Overlays"
          >
            <Bug size={16} />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
            title="3D Settings"
          >
            <Settings size={16} />
          </button>
          
          <button
            onClick={handleFitView}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fit View"
          >
            <ZoomOut size={16} />
          </button>
        </div>
        
        {showSettings && (
          <div className="border-t border-gray-200 p-4 space-y-4 min-w-64">
            {/* Floor Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor Spacing: {floorSpacing}m
              </label>
              <input
                type="range"
                min={4}
                max={15}
                step={0.5}
                value={floorSpacing}
                onChange={(e) => setFloorSpacing(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Scale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                World Scale: {worldUnitsPerPixel.toFixed(3)} units/pixel
              </label>
              <input
                type="range"
                min={0.005}
                max={0.1}
                step={0.005}
                value={worldUnitsPerPixel}
                onChange={(e) => setWorldUnitsPerPixel(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Normalized scale: smaller values = larger plans in 3D
              </div>
            </div>
            
            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Labels</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showCrossFloor}
                  onChange={(e) => setShowCrossFloor(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Cross-floor Links</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Debug Overlays</span>
              </label>
            </div>
            
            {/* Color By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color By
              </label>
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value as 'type' | 'importance')}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="type">Element Type</option>
                <option value="importance">Design Importance</option>
              </select>
            </div>
            
            {/* Debug Info */}
            {showDebug && (
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Debug Info:</strong></div>
                  <div>Floors: {floors.length}</div>
                  <div>Nodes: {nodes.length}</div>
                  <div>Corridors: {corridors.length}</div>
                  <div>Floor Spacing: {floorSpacing}m</div>
                  <div>World Scale: {worldUnitsPerPixel.toFixed(3)} units/px</div>
                  {floors.map(floor => {
                    const dims = getFloorDimensions(floor.index);
                    return dims ? (
                      <div key={floor.id}>
                        {floor.name}: {dims.naturalWidth}×{dims.naturalHeight}px
                        <br />
                        3D Size: {(dims.naturalWidth * worldUnitsPerPixel).toFixed(1)}×{(dims.naturalHeight * worldUnitsPerPixel).toFixed(1)}m
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floor Navigator */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 min-w-48">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Floor Navigator</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {floors
            .sort((a, b) => b.index - a.index)
            .map((floor) => {
              const isVisible = visibleFloors.has(floor.index);
              
              return (
                <div
                  key={floor.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => toggleFloorVisibility(floor.index)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title={isVisible ? 'Hide Floor' : 'Show Floor'}
                  >
                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  
                  <button
                    onClick={() => setFocusFloor(floor.index)}
                    className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600"
                    title="Focus on Floor"
                  >
                    {floor.name}
                  </button>
                  
                  <div className="text-xs text-gray-500">
                    Y: {floor.index * floorSpacing}m
                  </div>
                </div>
              );
            })}
        </div>
        
        {/* Instructions */}
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div>• Orbit: Left drag</div>
          <div>• Pan: Right drag</div>
          <div>• Zoom: Scroll wheel</div>
          <div>• Click elements to edit</div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <div className="text-sm text-gray-700">
          <div className="font-semibold mb-1">3D View</div>
          <div className="text-xs space-y-1">
            <div>{floors.length} floors</div>
            <div>{nodes.length} nodes</div>
            <div>{corridors.length} segments</div>
            <div>{corridors.filter(c => c.isCrossFloor).length} cross-floor</div>
            {showDebug && (
              <>
                <div className="border-t border-gray-300 mt-2 pt-2">
                  <div className="text-red-600 font-medium">Debug Mode</div>
                  <div>Red spheres = test points</div>
                  <div>Green spheres = corridor vertices</div>
                  <div>Red wireframes = floor bounds</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDView;