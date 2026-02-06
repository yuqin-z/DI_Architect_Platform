import React from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, Plus, Trash2, Edit3 } from 'lucide-react';
import { useAnnotationStore } from '../store/annotationStore';

const FloorNavigator: React.FC = () => {
  const {
    floors,
    canvasState,
    nodes,
    corridors,
    setCurrentFloor,
    deleteFloor,
    openFloorModal
  } = useAnnotationStore();
  
  if (floors.length <= 1) return null;
  
  const currentFloor = floors.find(f => f.index === canvasState.currentFloorIndex);
  
  // Count elements on each floor
  const getFloorElementCount = (floorIndex: number) => {
    const nodeCount = nodes.filter(n => n.floorIndex === floorIndex).length;
    const corridorCount = corridors.filter(c => 
      c.floorIndex === floorIndex || 
      (c.isCrossFloor && (c.fromFloor === floorIndex || c.toFloor === floorIndex))
    ).length;
    return nodeCount + corridorCount;
  };
  
  // Check if floor has cross-floor connections
  const hasConnections = (floorIndex: number) => {
    return corridors.some(c => 
      c.isCrossFloor && (c.fromFloor === floorIndex || c.toFloor === floorIndex)
    );
  };
  
  return (
    <div className="fixed bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-48 z-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Floor Navigator</h3>
        <button
          onClick={() => openFloorModal()}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Manage Floors"
        >
          <Edit3 size={14} />
        </button>
      </div>
      
      {/* Current Floor Display */}
      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm font-medium text-blue-800">
          Current: {currentFloor?.name || `Floor ${canvasState.currentFloorIndex}`}
        </div>
        <div className="text-xs text-blue-600">
          {getFloorElementCount(canvasState.currentFloorIndex)} elements
          {hasConnections(canvasState.currentFloorIndex) && (
            <span className="ml-2 text-purple-600">• Cross-floor</span>
          )}
        </div>
      </div>
      
      {/* Floor List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {floors
          .sort((a, b) => b.index - a.index) // Highest floor first
          .map((floor) => {
            const isActive = floor.index === canvasState.currentFloorIndex;
            const elementCount = getFloorElementCount(floor.index);
            const hasConnections = corridors.some(c => 
              c.isCrossFloor && (c.fromFloor === floor.index || c.toFloor === floor.index)
            );
            
            return (
              <div
                key={floor.id}
                className={`flex items-center gap-2 p-2 rounded-md transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-100 border border-blue-300' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => setCurrentFloor(floor.index)}
              >
                {/* Floor indicator */}
                <div className="flex flex-col items-center">
                  {floor.index > canvasState.currentFloorIndex && (
                    <ChevronUp size={12} className="text-gray-400" />
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {floor.index}
                  </div>
                  {floor.index < canvasState.currentFloorIndex && (
                    <ChevronDown size={12} className="text-gray-400" />
                  )}
                </div>
                
                {/* Floor info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${
                    isActive ? 'text-blue-800' : 'text-gray-700'
                  }`}>
                    {floor.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{elementCount} elements</span>
                    {hasConnections && (
                      <span className="text-purple-600">• Connected</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isActive ? (
                    <Eye size={14} className="text-blue-500" />
                  ) : (
                    <EyeOff size={14} className="text-gray-400" />
                  )}
                  
                  {floors.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete ${floor.name}? This will remove all elements on this floor.`)) {
                          deleteFloor(floor.index);
                        }
                      }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Floor"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      
      {/* Cross-floor connections summary */}
      {corridors.some(c => c.isCrossFloor) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Cross-floor Connections:</div>
          <div className="space-y-1">
            {corridors
              .filter(c => c.isCrossFloor)
              .slice(0, 3) // Show max 3
              .map(corridor => (
                <div key={corridor.id} className="text-xs text-purple-600 flex items-center gap-1">
                  <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                  <span>{corridor.id}: F{corridor.fromFloor} → F{corridor.toFloor}</span>
                </div>
              ))}
            {corridors.filter(c => c.isCrossFloor).length > 3 && (
              <div className="text-xs text-gray-500">
                +{corridors.filter(c => c.isCrossFloor).length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div>• Click floor to switch view</div>
        <div>• Dotted lines = cross-floor</div>
        <div>• Purple = connected floors</div>
      </div>
    </div>
  );
};

export default FloorNavigator;