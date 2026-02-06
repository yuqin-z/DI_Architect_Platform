import React, { useRef } from 'react';
import { MousePointer, Upload, Download, Save, FolderOpen, Undo, Circle, Hexagon, Square, Home, ArrowUpDown, MapPin, Route, GitBranch, Layers, FileText, Pencil, Box, Hand } from 'lucide-react';
import { useAnnotationStore } from '../store/annotationStore';
import { NodeType, AnnotationData, NodeTypeConfig } from '../types';

interface ToolbarProps {
  currentView: '2d' | '3d';
  onViewChange: (view: '2d' | '3d') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentView, onViewChange }) => {
  const {
    selectedTool,
    selectedNodeType,
    drawingState,
    canvasState,
    floors,
    projectId,
    setSelectedTool,
    setSelectedNodeType,
    setCanvasState,
    saveProject,
    loadProject,
    undoLastPoint,
    cancelDrawing,
    openFloorModal,
    openProjectIdModal,
    addFloor
  } = useAnnotationStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  
  const nodeTypeConfigs: NodeTypeConfig[] = [
    {
      type: 'Decision Point (DP)',
      shape: 'circle',
      color: '#dc2626',
      drawingMode: 'point',
      icon: 'Circle'
    },
    {
      type: 'Decision Zone (DZ)',
      shape: 'polygon',
      color: '#ea580c',
      drawingMode: 'zone',
      icon: 'Hexagon'
    },
    {
      type: 'Entrance/Exit (E)',
      shape: 'square',
      color: '#16a34a',
      drawingMode: 'point',
      icon: 'Home'
    },
    {
      type: 'Vertical Connection (VC)',
      shape: 'circle',
      color: '#2563eb',
      drawingMode: 'point',
      icon: 'ArrowUpDown'
    },
    {
      type: 'Activity Destination (AD)',
      shape: 'diamond',
      color: '#ea580c',
      drawingMode: 'point',
      icon: 'MapPin'
    },
    {
      type: 'Connecting Segment (CS)',
      shape: 'polygon',
      color: '#0891b2',
      drawingMode: 'polyline',
      icon: 'GitBranch'
    }
  ];
  
  const getIcon = (iconName: string) => {
    const icons = {
      Circle,
      Hexagon,
      Home,
      ArrowUpDown,
      MapPin,
      Route,
      GitBranch
    };
    return icons[iconName as keyof typeof icons] || Circle;
  };
  
  const handleNodeTypeSelect = (config: NodeTypeConfig) => {
    setSelectedNodeType(config.type);
    setSelectedTool('draw'); // Automatically switch to draw mode when selecting a spatial element
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    if (files.length === 1) {
      // Single file - update current floor or create first floor
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        if (floors.length === 0) {
          // Create first floor
          const newFloor = {
            id: `floor_${Date.now()}`,
            name: 'Floor 0',
            index: 0,
            backgroundImage: imageUrl,
            scale: 1,
            pan: { x: 0, y: 0 }
          };
          addFloor(newFloor);
        } else {
          // Update current floor
          setCanvasState({ backgroundImage: imageUrl });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files - open floor management modal
      openFloorModal();
      // Process files in the modal
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const newFloor = {
            id: `floor_${Date.now()}_${index}`,
            name: `Floor ${floors.length + index}`,
            index: floors.length + index,
            backgroundImage: imageUrl,
            scale: 1,
            pan: { x: 0, y: 0 }
          };
          addFloor(newFloor);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const handleProjectLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as AnnotationData;
          loadProject(data);
          alert('Project loaded successfully!');
        } catch (error) {
          alert('Error loading project file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };
  
  // Check if plan is uploaded (has floors)
  const isPlanUploaded = floors.length > 0;
  
  // Check if project ID is set
  const isProjectIdSet = projectId.buildingId && projectId.architectId && projectId.routeId;
  
  return (
    <div className="p-4">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Project ID Section */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
          <span className="text-sm font-semibold text-gray-600">Project:</span>
          <button
            onClick={openProjectIdModal}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              isProjectIdSet
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
            title="Set Project Identification"
          >
            <FileText size={16} />
            <span className="text-xs font-medium">
              {isProjectIdSet 
                ? `${projectId.buildingId}_${projectId.architectId}_${projectId.routeId}`
                : 'Set Project ID'
              }
            </span>
          </button>
        </div>
        
        {/* Workflow Steps */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-200 mr-4">
          <span className="text-sm font-semibold text-gray-600">Workflow:</span>
          
          {/* Step 1: Upload Plan */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isPlanUploaded 
              ? 'bg-green-100 text-green-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <span className="text-xs font-medium">
              1. Upload Plan{floors.length > 1 ? `s (${floors.length})` : ''}
            </span>
            {isPlanUploaded && <span className="text-xs">✓</span>}
          </div>
          
          {/* Step 2: Map Routes & Cues */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isPlanUploaded
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <span className="text-xs font-medium">2. Map Routes & Cues</span>
            {isPlanUploaded && <span className="text-xs">→</span>}
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 mr-4">
          <span className="text-sm font-semibold text-gray-600 px-2">View:</span>
          
          <button
            onClick={() => onViewChange('2d')}
            className={`p-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              currentView === '2d' 
                ? 'bg-blue-600 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title="2D Map View"
          >
            <Layers size={18} />
            <span className="text-sm font-medium">2D</span>
          </button>
          
          <button
            onClick={() => onViewChange('3d')}
            className={`p-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              currentView === '3d' 
                ? 'bg-purple-600 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title="3D Multi-Floor View"
          >
            <Box size={18} />
            <span className="text-sm font-medium">3D</span>
          </button>
        </div>
        
        {/* Mode Selection */}
        {currentView === '2d' && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200">
          <span className="text-sm font-semibold text-gray-600 px-2">Mode:</span>
          
          {/* Select Mode */}
          <button
            onClick={() => setSelectedTool('select')}
            className={`p-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              selectedTool === 'select' 
                ? 'bg-gray-800 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title="Select Mode - Click to select and edit existing elements"
          >
            <MousePointer size={18} />
            <span className="text-sm font-medium">Select</span>
          </button>
          
          {/* Pan Mode */}
          <button
            onClick={() => setSelectedTool('pan')}
            className={`p-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              selectedTool === 'pan' 
                ? 'bg-green-600 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title="Pan Mode - Drag to pan the view"
          >
            <Hand size={18} />
            <span className="text-sm font-medium">Pan</span>
          </button>
          
          {/* Draw Mode */}
          <button
            onClick={() => setSelectedTool('draw')}
            className={`p-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              selectedTool === 'draw' 
                ? 'bg-blue-600 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title="Draw Mode - Click to draw new spatial elements"
          >
            <Pencil size={18} />
            <span className="text-sm font-medium">Draw</span>
          </button>
        </div>
        )}
        
        {/* Spatial Elements Selection - Only visible in Draw mode */}
        {currentView === '2d' && selectedTool === 'draw' && (
          <div className={`flex items-center gap-1 rounded-xl p-2 border transition-all ${
            isPlanUploaded
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-100 border-gray-300 opacity-50'
          }`}>
            <span className="text-sm font-semibold text-blue-700 px-2">Spatial Elements:</span>
            
            {/* Decision Area Group */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-blue-100">
              <span className="text-xs text-blue-600 px-2">Decision Area</span>
              {nodeTypeConfigs.filter(config => config.type.includes('Decision')).map((config) => {
                const IconComponent = getIcon(config.icon);
                const isSelected = selectedNodeType === config.type;
                const isDisabled = !isPlanUploaded;
                
                return (
                  <button
                    key={config.type}
                    onClick={() => !isDisabled && handleNodeTypeSelect(config)}
                    disabled={isDisabled}
                    className={`p-2 rounded-md flex items-center gap-1 transition-all duration-200 ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'shadow-md scale-105 text-white'
                          : 'hover:bg-blue-50 text-gray-600'
                    }`}
                    style={{
                      backgroundColor: isSelected && !isDisabled ? config.color : 'transparent'
                    }}
                    title={isDisabled ? 'Upload a plan first' : config.type}
                  >
                    <IconComponent size={16} />
                    <span className="text-xs font-medium">
                      {config.type.includes('Decision Point') ? 'Decision Points' : 'Decision Zones'}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Other Node Types */}
            {nodeTypeConfigs.filter(config => !config.type.includes('Decision')).map((config) => {
              const IconComponent = getIcon(config.icon);
              const isSelected = selectedNodeType === config.type;
              const isDisabled = !isPlanUploaded;
              
              // Get full label for spatial element
              const getFullLabel = (type: string) => {
                if (type.includes('Entrance/Exit')) return 'Entrances/Exits';
                if (type.includes('Vertical Connection')) return 'Vertical Connections';
                if (type.includes('Activity Destination')) return 'Activity Destinations';
                if (type.includes('Connecting Segment')) return 'Connecting Segments';
                return type.split(' ')[0];
              };
              
              return (
                <button
                  key={config.type}
                  onClick={() => !isDisabled && handleNodeTypeSelect(config)}
                  disabled={isDisabled}
                  className={`p-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'shadow-md scale-105 text-white'
                        : 'hover:bg-blue-100 text-gray-600'
                  }`}
                  style={{
                    backgroundColor: isSelected && !isDisabled ? config.color : 'transparent'
                  }}
                  title={isDisabled ? 'Upload a plan first' : config.type}
                >
                  <IconComponent size={16} />
                  <span className="text-sm font-medium">
                    {getFullLabel(config.type)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        
        {/* Drawing Controls */}
        {currentView === '2d' && drawingState.isDrawing && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <span className="text-sm font-medium text-orange-800">Drawing...</span>
            <button
              onClick={undoLastPoint}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
              title="Undo Last Point"
              disabled={drawingState.currentPath.length <= 1}
            >
              <Undo size={14} />
            </button>
            <button
              onClick={cancelDrawing}
              className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        
        {/* File Operations */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md"
            title="Upload Floor Plan(s)"
          >
            <Upload size={16} />
            <span className="text-sm font-medium">Upload Plan{floors.length > 1 ? 's' : ''}</span>
          </button>
          
          {floors.length > 0 && (
            <button
              onClick={openFloorModal}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 shadow-md"
              title="Manage Floors"
            >
              <Layers size={16} />
              <span className="text-sm font-medium">Floors ({floors.length})</span>
            </button>
          )}
          
          <button
            onClick={() => projectInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md"
            title="Load Project"
          >
            <FolderOpen size={16} />
            <span className="text-sm font-medium">Load</span>
          </button>
          
          <button
            onClick={saveProject}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md ${
              isProjectIdSet
                ? 'bg-gray-700 text-white hover:bg-gray-800'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            title={isProjectIdSet ? 'Save Project' : 'Set Project ID to Save'}
          >
            <Save size={16} />
            <span className="text-sm font-medium">
              {isProjectIdSet ? 'Save' : 'Set ID & Save'}
            </span>
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <input
          ref={projectInputRef}
          type="file"
          accept=".json"
          onChange={handleProjectLoad}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Toolbar;