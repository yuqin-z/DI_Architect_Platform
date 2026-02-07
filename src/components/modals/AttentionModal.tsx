import React, { useRef, useEffect, useState } from 'react';
import { X, Trash2, ZoomIn, ZoomOut, Move, Pencil, Route } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Position, AttentionZone } from '../../types';

const AttentionModal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [attentionZones, setAttentionZones] = useState<AttentionZone[]>([]);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'polyline'>('polygon');
  const [modalCanvasState, setModalCanvasState] = useState({
    scale: 1,
    pan: { x: 0, y: 0 }
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<Position>({ x: 0, y: 0 });
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);

  const {
    showAttentionModal,
    closeAttentionModal,
    canvasState,
    currentNode,
    currentCorridor,
    updateNode,
    updateCorridor,
    attentionModalTarget
  } = useAnnotationStore();

  // Load background image
  useEffect(() => {
    if (canvasState.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        setBackgroundImg(img);
      };
      img.src = canvasState.backgroundImage;
    } else {
      setBackgroundImg(null);
    }
  }, [canvasState.backgroundImage]);

  // Initialize attention zones from current node or corridor
  useEffect(() => {
    console.log('AttentionModal: Loading zones from currentNode:', currentNode, 'currentCorridor:', currentCorridor, 'target:', attentionModalTarget);

    if (currentNode) {
      if (attentionModalTarget === 'dp_annotation') {
        console.log('AttentionModal: Loading from dp_annotation');
        setAttentionZones([...(currentNode.dp_annotation?.dp_attention_aoi || [])]);
      } else {
        console.log('AttentionModal: Loading from behavior_expectation');
        setAttentionZones([...currentNode.behavior_expectation.attention_zones]);
      }
    } else if (currentCorridor && currentCorridor.behavior_expectation.attention_zones) {
      console.log('AttentionModal: Found existing corridor zones:', currentCorridor.behavior_expectation.attention_zones);
      setAttentionZones([...currentCorridor.behavior_expectation.attention_zones]);
    } else {
      console.log('AttentionModal: No existing zones found, starting with empty array');
      setAttentionZones([]);
    }
  }, [currentNode, currentCorridor, showAttentionModal, attentionModalTarget]);

  useEffect(() => {
    if (showAttentionModal) {
      drawCanvas();
    }
  }, [showAttentionModal, backgroundImg, attentionZones, modalCanvasState, currentPath, isDrawing]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(modalCanvasState.pan.x, modalCanvasState.pan.y);
    ctx.scale(modalCanvasState.scale, modalCanvasState.scale);

    // Draw background image if available
    if (backgroundImg) {
      ctx.drawImage(backgroundImg, 0, 0);
    } else {
      // Draw grid background
      drawGrid(ctx);
    }

    // Draw annotations
    drawAnnotations(ctx);

    // Restore context state
    ctx.restore();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1 / modalCanvasState.scale;

    const gridSize = 20;
    const startX = Math.floor(-modalCanvasState.pan.x / modalCanvasState.scale / gridSize) * gridSize;
    const startY = Math.floor(-modalCanvasState.pan.y / modalCanvasState.scale / gridSize) * gridSize;
    const endX = startX + (canvasRef.current!.width / modalCanvasState.scale) + gridSize;
    const endY = startY + (canvasRef.current!.height / modalCanvasState.scale) + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    // Draw existing attention zones
    attentionZones.forEach((zone, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const color = colors[index % colors.length];
      drawPath(ctx, zone.points, color, false, zone.type || 'polygon');
    });

    // Draw current path being drawn
    if (currentPath.length > 0) {
      drawPath(ctx, currentPath, '#ff0000', true, drawingMode);
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D, points: Position[], color: string, isDashed: boolean, type: 'polygon' | 'polyline' = 'polygon') => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / modalCanvasState.scale;

    if (isDashed) {
      ctx.setLineDash([5 / modalCanvasState.scale, 5 / modalCanvasState.scale]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    points.slice(1).forEach(point => {
      ctx.lineTo(point.x, point.y);
    });

    if (type === 'polygon' && !isDashed && points.length > 2) {
      ctx.closePath();
      ctx.fillStyle = color + '30'; // Add transparency
      ctx.fill();
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw points
    points.forEach((point, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3 / modalCanvasState.scale, 0, 2 * Math.PI);
      ctx.fill();

      // Draw point numbers for clarity
      if (!isDashed) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${10 / modalCanvasState.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), point.x, point.y + 2 / modalCanvasState.scale);
      }
    });
  };

  const screenToCanvas = (screenPos: Position): Position => {
    return {
      x: (screenPos.x - modalCanvasState.pan.x) / modalCanvasState.scale,
      y: (screenPos.y - modalCanvasState.pan.y) / modalCanvasState.scale
    };
  };

  const getMousePos = (event: React.MouseEvent): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const screenPos = getMousePos(event);
    const canvasPos = screenToCanvas(screenPos);

    if (event.shiftKey) {
      // Pan mode
      setIsPanning(true);
      setLastPanPos(screenPos);
    } else {
      // Drawing mode
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPath([canvasPos]);
      } else {
        if (drawingMode === 'polygon') {
          // Check if clicking near start point to close polygon
          const startPoint = currentPath[0];
          const distance = Math.sqrt(
            Math.pow(canvasPos.x - startPoint.x, 2) +
            Math.pow(canvasPos.y - startPoint.y, 2)
          );

          if (distance < 20 / modalCanvasState.scale && currentPath.length >= 3) {
            // Close polygon
            finishDrawing();
          } else {
            // Add point
            setCurrentPath(prev => [...prev, canvasPos]);
          }
        } else {
          // Polyline mode - just add points
          setCurrentPath(prev => [...prev, canvasPos]);
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const screenPos = getMousePos(event);

    if (isPanning) {
      const dx = screenPos.x - lastPanPos.x;
      const dy = screenPos.y - lastPanPos.y;
      setModalCanvasState(prev => ({
        ...prev,
        pan: {
          x: prev.pan.x + dx,
          y: prev.pan.y + dy
        }
      }));
      setLastPanPos(screenPos);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    if (isDrawing && drawingMode === 'polyline' && currentPath.length >= 2) {
      finishDrawing();
    }
  };

  const finishDrawing = () => {
    if (currentPath.length >= 2) {
      // Convert to GeoJSON format
      let geoJsonCoordinates;
      let geoJsonType;

      if (drawingMode === 'polygon' && currentPath.length >= 3) {
        geoJsonCoordinates = [...currentPath, currentPath[0]]; // Close the polygon
        geoJsonType = "Polygon";
      } else {
        geoJsonCoordinates = currentPath;
        geoJsonType = "LineString";
      }

      const newZone: AttentionZone = {
        id: `zone_${Date.now()}`,
        points: [...currentPath], // Create a copy
        type: drawingMode,
        floorIndex: currentNode?.floorIndex ?? currentCorridor?.floorIndex ?? 0,
        geoJson: drawingMode === 'polygon' ? {
          type: "Polygon",
          coordinates: [geoJsonCoordinates.map(p => [p.x, p.y])]
        } : {
          type: "LineString",
          coordinates: geoJsonCoordinates.map(p => [p.x, p.y])
        }
      };

      console.log('AttentionModal: Creating new zone:', newZone);
      setAttentionZones(prev => {
        const updated = [...prev, newZone];
        console.log('AttentionModal: Updated zones array:', updated);
        return updated;
      });
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const mousePos = getMousePos(event);
    const canvasPos = screenToCanvas(mousePos);

    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, modalCanvasState.scale * scaleFactor));

    // Zoom towards mouse position
    const newPan = {
      x: mousePos.x - canvasPos.x * newScale,
      y: mousePos.y - canvasPos.y * newScale
    };

    setModalCanvasState({
      scale: newScale,
      pan: newPan
    });
  };

  const handleZoomIn = () => {
    const centerX = canvasRef.current!.width / 2;
    const centerY = canvasRef.current!.height / 2;
    const canvasPos = screenToCanvas({ x: centerX, y: centerY });

    const newScale = Math.min(5, modalCanvasState.scale * 1.2);
    const newPan = {
      x: centerX - canvasPos.x * newScale,
      y: centerY - canvasPos.y * newScale
    };

    setModalCanvasState({
      scale: newScale,
      pan: newPan
    });
  };

  const handleZoomOut = () => {
    const centerX = canvasRef.current!.width / 2;
    const centerY = canvasRef.current!.height / 2;
    const canvasPos = screenToCanvas({ x: centerX, y: centerY });

    const newScale = Math.max(0.1, modalCanvasState.scale / 1.2);
    const newPan = {
      x: centerX - canvasPos.x * newScale,
      y: centerY - canvasPos.y * newScale
    };

    setModalCanvasState({
      scale: newScale,
      pan: newPan
    });
  };

  const handleResetView = () => {
    setModalCanvasState({
      scale: 1,
      pan: { x: 0, y: 0 }
    });
  };

  const handleDeleteZone = (zoneId: string) => {
    console.log('AttentionModal: Deleting zone:', zoneId);
    setAttentionZones(prev => {
      const updated = prev.filter(zone => zone.id !== zoneId);
      console.log('AttentionModal: Zones after deletion:', updated);
      return updated;
    });
  };

  const handleSave = () => {
    console.log('AttentionModal: handleSave called');
    console.log('AttentionModal: Current node:', currentNode);
    console.log('AttentionModal: Current corridor:', currentCorridor);
    console.log('AttentionModal: Zones to save:', attentionZones);

    if (currentNode) {
      if (attentionModalTarget === 'dp_annotation') {
        const updatedDPAnnotation = {
          ...(currentNode.dp_annotation || {}),
          dp_attention_aoi: [...attentionZones]
        };
        updateNode(currentNode.id, {
          dp_annotation: updatedDPAnnotation
        });
      } else {
        const updatedBehaviorExpectation = {
          ...currentNode.behavior_expectation,
          attention_zones: [...attentionZones] // Create a deep copy
        };

        console.log('AttentionModal: Updated node behavior expectation:', updatedBehaviorExpectation);

        updateNode(currentNode.id, {
          behavior_expectation: updatedBehaviorExpectation
        });

        console.log('AttentionModal: updateNode called with:', {
          id: currentNode.id,
          behavior_expectation: updatedBehaviorExpectation
        });
      }

    } else if (currentCorridor) {
      const updatedBehaviorExpectation = {
        ...currentCorridor.behavior_expectation,
        attention_zones: [...attentionZones] // Create a deep copy
      };

      console.log('AttentionModal: Updated corridor behavior expectation:', updatedBehaviorExpectation);

      updateCorridor(currentCorridor.id, {
        behavior_expectation: updatedBehaviorExpectation
      });

      console.log('AttentionModal: updateCorridor called with:', {
        id: currentCorridor.id,
        behavior_expectation: updatedBehaviorExpectation
      });
    } else {
      console.error('AttentionModal: No current node or corridor to save to!');
    }

    closeAttentionModal();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isDrawing) {
      cancelDrawing();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  if (!showAttentionModal) return null;

  const currentElement = currentNode || currentCorridor;
  const elementType = currentNode ? 'Node' : 'Connecting Segment';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Sketch Attention Zones - {elementType} {currentElement?.id || 'Unknown'}
          </h2>
          <button
            onClick={closeAttentionModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 p-4 relative">
            <div className="relative h-full bg-gray-100 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onWheel={handleWheel}
              />

              {/* Drawing Mode Toggle */}
              <div className="absolute top-4 left-4 flex gap-2">
                <button
                  onClick={() => setDrawingMode('polygon')}
                  className={`p-2 rounded-lg shadow transition-colors flex items-center gap-1 ${drawingMode === 'polygon'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/90 backdrop-blur-sm hover:bg-white'
                    }`}
                  title="Polygon Mode"
                >
                  <Pencil size={16} />
                  <span className="text-sm font-medium">Zone</span>
                </button>
                <button
                  onClick={() => setDrawingMode('polyline')}
                  className={`p-2 rounded-lg shadow transition-colors flex items-center gap-1 ${drawingMode === 'polyline'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/90 backdrop-blur-sm hover:bg-white'
                    }`}
                  title="Polyline Mode"
                >
                  <Route size={16} />
                  <span className="text-sm font-medium">Line</span>
                </button>
              </div>

              {/* Canvas Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:bg-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:bg-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:bg-white transition-colors"
                  title="Reset View"
                >
                  <Move size={16} />
                </button>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-sm text-gray-700">
                  <div className="font-semibold mb-1">
                    {drawingMode === 'polygon' ? 'Draw Polygon Zones' : 'Draw Polyline Paths'}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {drawingMode === 'polygon' ? (
                      <>
                        <div>• Click to add points</div>
                        <div>• Click start point to close</div>
                      </>
                    ) : (
                      <>
                        <div>• Click to add points</div>
                        <div>• Double-click to finish</div>
                      </>
                    )}
                    <div>• Hold Shift + drag to pan</div>
                    <div>• Scroll to zoom</div>
                    <div>• ESC to cancel drawing</div>
                    <div>• Zoom: {Math.round(modalCanvasState.scale * 100)}%</div>
                  </div>
                </div>
              </div>

              {/* Drawing Status */}
              {isDrawing && (
                <div className="absolute bottom-4 right-4 bg-orange-100 border border-orange-200 rounded-lg p-3 shadow-lg">
                  <div className="text-sm text-orange-800">
                    <div className="font-semibold">Drawing {drawingMode}...</div>
                    <div className="text-xs">Points: {currentPath.length}</div>
                    <button
                      onClick={cancelDrawing}
                      className="mt-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone List */}
          <div className="w-64 p-4 border-l border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700 mb-3">
              Attention Zones ({attentionZones.length})
            </h3>

            <div className="space-y-2">
              {attentionZones.map((zone, index) => (
                <div
                  key={zone.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">
                      {zone.type === 'polyline' ? 'Line' : 'Zone'} {index + 1}
                    </div>
                    <div className="text-xs text-gray-500">
                      {zone.points.length} points
                    </div>
                    <div className="text-xs text-blue-600">
                      {zone.type || 'polygon'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                    title="Delete zone"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {attentionZones.length === 0 && (
                <div className="text-sm text-gray-500 italic text-center py-4">
                  No zones drawn yet
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-800">
                <div className="font-semibold mb-1">Tips:</div>
                <ul className="space-y-1">
                  <li>• Use zones for areas of focus</li>
                  <li>• Use lines for sight paths</li>
                  <li>• Switch modes with buttons</li>
                  <li>• Pan and zoom for precision</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={closeAttentionModal}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Zones ({attentionZones.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttentionModal;