import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAnnotationStore } from '../store/annotationStore';
import { Position, Node } from '../types';
import { getSegmentsForFloor, getSegmentRenderStyle } from '../utils/corridorUtils';
import { screenToPCS, pcsToScreen } from '../utils/coordinateMapping';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'node' | 'corridor' | 'vertex' | null>(null);
  const [dragVertexIndex, setDragVertexIndex] = useState<number>(-1);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState<{ id: string; type: 'node' | 'corridor' | 'vertex'; index?: number } | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);
  
  const {
    selectedTool,
    selectedNodeType,
    canvasState,
    drawingState,
    setCanvasState,
    setDrawingState,
    addNode,
    moveNode,
    openNodeModal,
    openCorridorModal,
    openEdgeModal,
    generateId,
    getElementByPosition,
    getNodeCentroid,
    isNearNode,
    startDrawing,
    addDrawingPoint,
    finishDrawing,
    cancelDrawing,
    getNodeTypeConfig,
    updateCorridorVertex,
    getVisibleNodes,
    getVisibleCorridors,
    getCurrentFloor,
    getCorridorSegmentsForFloor
  } = useAnnotationStore();
  
  // Get visible elements for current floor
  const nodes = getVisibleNodes();
  const corridors = getVisibleCorridors();
  
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
  
  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenPos: Position): Position => {
    const pcsPos = screenToPCS(screenPos, canvasState.pan, canvasState.scale);
    return {
      ...pcsPos,
      z: canvasState.currentFloorIndex
    };
  }, [canvasState]);
  
  // Transform canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasPos: Position): Position => {
    return pcsToScreen(canvasPos, canvasState.pan, canvasState.scale);
  }, [canvasState]);
  
  // Get mouse position relative to canvas
  const getMousePos = useCallback((event: React.MouseEvent): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);
  
  // Check if position is near a corridor vertex
  const isNearCorridorVertex = useCallback((position: Position, tolerance = 12): { corridorId: string; vertexIndex: number } | null => {
    for (const corridor of corridors) {
      for (let i = 0; i < corridor.path.length; i++) {
        const vertex = corridor.path[i];
        const distance = Math.sqrt(
          Math.pow(vertex.x - position.x, 2) + 
          Math.pow(vertex.y - position.y, 2)
        );
        
        if (distance < tolerance) {
          return { corridorId: corridor.id, vertexIndex: i };
        }
      }
    }
    return null;
  }, [corridors]);
  
  // Check if position is near a corridor segment
  const isNearCorridorSegment = useCallback((position: Position, tolerance = 15): string | null => {
    for (const corridor of corridors) {
      const segments = getCorridorSegmentsForFloor(corridor.id, canvasState.currentFloorIndex);
      
      for (const segment of segments) {
        // Calculate distance from point to line segment
        const A = position.x - segment.start.x;
        const B = position.y - segment.start.y;
        const C = segment.end.x - segment.start.x;
        const D = segment.end.y - segment.start.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) continue;
        
        const param = dot / lenSq;
        let xx, yy;
        
        if (param < 0) {
          xx = segment.start.x;
          yy = segment.start.y;
        } else if (param > 1) {
          xx = segment.end.x;
          yy = segment.end.y;
        } else {
          xx = segment.start.x + param * C;
          yy = segment.start.y + param * D;
        }
        
        const dx = position.x - xx;
        const dy = position.y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < tolerance) {
          return corridor.id;
        }
      }
    }
    return null;
  }, [corridors, canvasState.currentFloorIndex, getCorridorSegmentsForFloor]);
  
  // Update connected corridors when a node is moved
  const updateConnectedCorridors = useCallback((nodeId: string, newPosition: Position) => {
    corridors.forEach(corridor => {
      if (corridor.from === nodeId || corridor.to === nodeId) {
        const updatedPath = [...corridor.path];
        
        if (corridor.from === nodeId) {
          // Update first point
          updatedPath[0] = { ...newPosition, z: newPosition.z ?? canvasState.currentFloorIndex };
        }
        
        if (corridor.to === nodeId) {
          // Update last point
          updatedPath[updatedPath.length - 1] = { ...newPosition, z: newPosition.z ?? canvasState.currentFloorIndex };
        }
        
        updateCorridorVertex(corridor.id, 0, updatedPath[0]);
      }
    });
  }, [corridors, updateCorridorVertex, canvasState.currentFloorIndex]);
  
  // Draw functions
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Apply transformations
    ctx.translate(canvasState.pan.x, canvasState.pan.y);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    // Draw background image if loaded
    if (backgroundImg) {
      ctx.drawImage(backgroundImg, 0, 0);
    } else {
      // Draw grid background
      drawGrid(ctx);
    }
    
    // Draw elements
    drawElements(ctx);
    
    // Restore context state
    ctx.restore();
  }, [canvasState, backgroundImg, nodes, corridors, drawingState, hoveredElement, selectedCorridor]);
  
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1 / canvasState.scale;
    
    const gridSize = 20;
    const startX = Math.floor(-canvasState.pan.x / canvasState.scale / gridSize) * gridSize;
    const startY = Math.floor(-canvasState.pan.y / canvasState.scale / gridSize) * gridSize;
    const endX = startX + (canvasRef.current!.width / canvasState.scale) + gridSize;
    const endY = startY + (canvasRef.current!.height / canvasState.scale) + gridSize;
    
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
  }, [canvasState]);
  
  const drawElements = useCallback((ctx: CanvasRenderingContext2D) => {
    // Draw corridors first (behind nodes)
    corridors.forEach(corridor => {
      const isHovered = hoveredElement?.id === corridor.id && hoveredElement?.type === 'corridor';
      const isSelected = selectedCorridor === corridor.id;
      
      // Get segments for current floor
      const segments = getCorridorSegmentsForFloor(corridor.id, canvasState.currentFloorIndex);
      
      segments.forEach(segment => {
        const renderStyle = getSegmentRenderStyle(segment, canvasState.currentFloorIndex);
        
        ctx.strokeStyle = isHovered ? '#1d4ed8' : renderStyle.color;
        ctx.lineWidth = isHovered ? 5 / canvasState.scale : 3 / canvasState.scale;
        ctx.globalAlpha = renderStyle.opacity;
        
        // Set line style
        if (renderStyle.isDotted) {
          ctx.setLineDash([10 / canvasState.scale, 5 / canvasState.scale]);
        } else {
          ctx.setLineDash([]);
        }
        
        // Add glow effect for hovered corridors
        if (isHovered) {
          ctx.shadowColor = renderStyle.color;
          ctx.shadowBlur = 10 / canvasState.scale;
        }
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(segment.start.x, segment.start.y);
        ctx.lineTo(segment.end.x, segment.end.y);
        ctx.stroke();
        
        // Reset effects
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      });
      
      // Draw corridor ID with floor info for cross-floor corridors
      if (segments.length > 0) {
        const firstSegment = segments[0];
        const midPoint = {
          x: (firstSegment.start.x + firstSegment.end.x) / 2,
          y: (firstSegment.start.y + firstSegment.end.y) / 2
        };
        
        ctx.fillStyle = isHovered ? '#1d4ed8' : corridor.isCrossFloor ? '#8b5cf6' : '#1d4ed8';
        ctx.font = `${12 / canvasState.scale}px Arial`;
        
        let label = corridor.id;
        if (corridor.isCrossFloor) {
          label += ` (F${corridor.fromFloor}→F${corridor.toFloor})`;
        }
        
        ctx.fillText(label, midPoint.x + 5 / canvasState.scale, midPoint.y - 5 / canvasState.scale);
      }
      
      // Draw vertex control points if selected
      if (isSelected) {
        corridor.path.forEach((point, index) => {
          const isVertexHovered = hoveredElement?.id === corridor.id && 
                                  hoveredElement?.type === 'vertex' && 
                                  hoveredElement?.index === index;
          
          // Only show vertices that are on current floor or adjacent floors
          const pointFloor = point.z ?? corridor.floorIndex;
          const isRelevantVertex = Math.abs(pointFloor - canvasState.currentFloorIndex) <= 1;
          
          if (isRelevantVertex) {
            ctx.fillStyle = isVertexHovered ? '#ef4444' : pointFloor === canvasState.currentFloorIndex ? '#10b981' : '#94a3b8';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / canvasState.scale;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, isVertexHovered ? 8 / canvasState.scale : 6 / canvasState.scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Draw vertex index and floor info
            ctx.fillStyle = '#ffffff';
            ctx.font = `${8 / canvasState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), point.x, point.y + 2 / canvasState.scale);
            
            if (pointFloor !== canvasState.currentFloorIndex) {
              ctx.fillStyle = '#64748b';
              ctx.font = `${6 / canvasState.scale}px Arial`;
              ctx.fillText(`F${pointFloor}`, point.x, point.y - 10 / canvasState.scale);
            }
          }
        });
      }
    });
    
    // Draw current drawing path
    if (drawingState.isDrawing && drawingState.currentPath.length > 0) {
      ctx.strokeStyle = drawingState.drawingType === 'corridor' ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3 / canvasState.scale;
      ctx.setLineDash([5 / canvasState.scale, 5 / canvasState.scale]);
      ctx.beginPath();
      
      drawingState.currentPath.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      if (drawingState.drawingType === 'zone' && drawingState.currentPath.length > 2) {
        ctx.closePath();
        ctx.fillStyle = '#f59e0b30';
        ctx.fill();
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw points with floor indicators
      drawingState.currentPath.forEach((point, index) => {
        const pointFloor = point.z ?? canvasState.currentFloorIndex;
        const isFloorTransition = index > 0 && 
          (drawingState.currentPath[index - 1].z ?? canvasState.currentFloorIndex) !== pointFloor;
        
        ctx.fillStyle = isFloorTransition ? '#8b5cf6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / canvasState.scale, 0, 2 * Math.PI);
        ctx.fill();
        
        // Show floor number for cross-floor points
        if (pointFloor !== canvasState.currentFloorIndex) {
          ctx.fillStyle = '#8b5cf6';
          ctx.font = `${8 / canvasState.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(`F${pointFloor}`, point.x, point.y - 8 / canvasState.scale);
        }
      });
    }
    
    // Draw nodes
    nodes.forEach(node => {
      const centroid = getNodeCentroid(node);
      const config = getNodeTypeConfig(node.type);
      const isHovered = hoveredElement?.id === node.id && hoveredElement?.type === 'node';
      
      ctx.fillStyle = config.color;
      ctx.strokeStyle = isHovered ? '#ffffff' : '#ffffff';
      ctx.lineWidth = isHovered ? 4 / canvasState.scale : 2 / canvasState.scale;
      
      // Add glow effect for hovered nodes
      if (isHovered) {
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 15 / canvasState.scale;
      }
      
      // Draw shape
      if (node.shape === 'polygon' && node.polygon) {
        // Draw polygon
        ctx.beginPath();
        node.polygon.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = config.color + '40'; // Semi-transparent
        ctx.fill();
        ctx.stroke();
        
        // Draw centroid
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, isHovered ? 10 / canvasState.scale : 8 / canvasState.scale, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (node.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, isHovered ? 18 / canvasState.scale : 15 / canvasState.scale, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (node.shape === 'square') {
        const size = isHovered ? 36 / canvasState.scale : 30 / canvasState.scale;
        ctx.fillRect(centroid.x - size/2, centroid.y - size/2, size, size);
        ctx.strokeRect(centroid.x - size/2, centroid.y - size/2, size, size);
      } else if (node.shape === 'diamond') {
        const size = isHovered ? 18 / canvasState.scale : 15 / canvasState.scale;
        ctx.beginPath();
        ctx.moveTo(centroid.x, centroid.y - size);
        ctx.lineTo(centroid.x + size, centroid.y);
        ctx.lineTo(centroid.x, centroid.y + size);
        ctx.lineTo(centroid.x - size, centroid.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (node.shape === 'star') {
        drawStar(ctx, centroid.x, centroid.y, isHovered ? 18 / canvasState.scale : 15 / canvasState.scale, 5);
        ctx.fill();
        ctx.stroke();
      }
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Draw ID with floor info
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${10 / canvasState.scale}px Arial`;
      ctx.textAlign = 'center';
      
      let nodeLabel = node.id;
      if (node.floorIndex !== canvasState.currentFloorIndex) {
        nodeLabel += ` (F${node.floorIndex})`;
      }
      
      ctx.fillText(nodeLabel, centroid.x, centroid.y + 3 / canvasState.scale);
      
      // Highlight if near for snapping
      if (drawingState.isDrawing && drawingState.drawingType === 'corridor') {
        const lastPoint = drawingState.currentPath[drawingState.currentPath.length - 1];
        if (lastPoint && isNearNode(lastPoint, 30) === node.id) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3 / canvasState.scale;
          ctx.beginPath();
          ctx.arc(centroid.x, centroid.y, 25 / canvasState.scale, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });
  }, [canvasState, nodes, corridors, drawingState, getNodeCentroid, isNearNode, getNodeTypeConfig, hoveredElement, selectedCorridor, getCorridorSegmentsForFloor]);
  
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, points: number) => {
    const angle = Math.PI / points;
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.5;
      const a = i * angle;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };
  
  // Event handlers
  const handleMouseDown = (event: React.MouseEvent) => {
    const mousePos = getMousePos(event);
    const canvasPos = screenToCanvas(mousePos);
    
    if (selectedTool === 'pan') {
      // Pan mode - always pan
      setIsDragging(true);
      setDragType(null);
      setLastMousePos(mousePos);
    } else if (selectedTool === 'select') {
      // Check for vertex selection first (highest priority)
      const vertexHit = isNearCorridorVertex(canvasPos, 12);
      if (vertexHit) {
        setDragTarget(vertexHit.corridorId);
        setDragType('vertex');
        setDragVertexIndex(vertexHit.vertexIndex);
        setIsDragging(true);
        setSelectedCorridor(vertexHit.corridorId);
      } else {
        const element = getElementByPosition(canvasPos);
        const corridorId = isNearCorridorSegment(canvasPos, 15);
        
        if (element && element.type === 'node') {
          setDragTarget(element.id);
          setDragType('node');
          setIsDragging(true);
          setSelectedCorridor(null);
        } else if (corridorId) {
          setDragTarget(corridorId);
          setDragType('corridor');
          setIsDragging(true);
          setSelectedCorridor(corridorId);
        } else {
          setIsDragging(true);
          setDragType(null);
          setSelectedCorridor(null);
        }
      }
      setLastMousePos(mousePos);
    } else if (selectedTool === 'draw') {
      const config = getNodeTypeConfig(selectedNodeType);
      
      if (selectedNodeType === 'Connecting Segment (CS)') {
        // Corridor drawing mode
        if (!drawingState.isDrawing) {
          // Must start on a node
          const nearNodeId = isNearNode(canvasPos, 30);
          if (nearNodeId) {
            const node = nodes.find(n => n.id === nearNodeId);
            if (node) {
              const centroid = getNodeCentroid(node);
              startDrawing('corridor', centroid);
              setDrawingState({ snapTarget: nearNodeId });
            }
          }
        } else {
          // Check if ending on a node
          const nearNodeId = isNearNode(canvasPos, 30);
          if (nearNodeId && nearNodeId !== drawingState.snapTarget) {
            const node = nodes.find(n => n.id === nearNodeId);
            if (node) {
              const centroid = getNodeCentroid(node);
              addDrawingPoint(centroid);
              finishDrawing();
            }
          } else {
            addDrawingPoint(canvasPos);
          }
        }
      } else {
        // Node drawing mode
        if (config.drawingMode === 'point') {
          // Create point node immediately
          startDrawing('point', canvasPos);
          finishDrawing();
        } else if (config.drawingMode === 'zone') {
          if (!drawingState.isDrawing) {
            startDrawing('zone', canvasPos);
          } else {
            // Check if clicking near start point to close
            const startPoint = drawingState.currentPath[0];
            const distance = Math.sqrt(
              Math.pow(canvasPos.x - startPoint.x, 2) + 
              Math.pow(canvasPos.y - startPoint.y, 2)
            );
            
            if (distance < 20 && drawingState.currentPath.length >= 3) {
              finishDrawing();
            } else {
              addDrawingPoint(canvasPos);
            }
          }
        }
      }
    }
  };
  
  const handleMouseMove = (event: React.MouseEvent) => {
    const mousePos = getMousePos(event);
    const canvasPos = screenToCanvas(mousePos);
    
    // Update hover state for select mode
    if (selectedTool === 'select' && !isDragging) {
      // Check for vertex hover first (highest priority)
      const vertexHit = isNearCorridorVertex(canvasPos, 12);
      if (vertexHit) {
        setHoveredElement({ 
          id: vertexHit.corridorId, 
          type: 'vertex', 
          index: vertexHit.vertexIndex 
        });
      } else {
        const nodeElement = getElementByPosition(canvasPos, 20);
        const corridorId = isNearCorridorSegment(canvasPos, 15);
        
        if (nodeElement) {
          setHoveredElement(nodeElement);
        } else if (corridorId) {
          setHoveredElement({ id: corridorId, type: 'corridor' });
        } else {
          setHoveredElement(null);
        }
      }
    }
    
    if (isDragging && selectedTool === 'select') {
      if (dragTarget && dragType === 'node') {
        // Move node and update connected corridors
        moveNode(dragTarget, canvasPos);
        updateConnectedCorridors(dragTarget, canvasPos);
      } else if (dragTarget && dragType === 'vertex') {
        // Move corridor vertex
        updateCorridorVertex(dragTarget, dragVertexIndex, canvasPos);
      } else if (dragType === null) {
        // Pan canvas
        const dx = mousePos.x - lastMousePos.x;
        const dy = mousePos.y - lastMousePos.y;
        setCanvasState({
          pan: {
            x: canvasState.pan.x + dx,
            y: canvasState.pan.y + dy
          }
        });
      }
      setLastMousePos(mousePos);
    } else if (isDragging && (selectedTool === 'pan' || dragType === null)) {
      // Pan canvas
      const dx = mousePos.x - lastMousePos.x;
      const dy = mousePos.y - lastMousePos.y;
      setCanvasState({
        pan: {
          x: canvasState.pan.x + dx,
          y: canvasState.pan.y + dy
        }
      });
      setLastMousePos(mousePos);
    }
    
    // Update snap target for corridor drawing
    if (drawingState.isDrawing && drawingState.drawingType === 'corridor') {
      const nearNodeId = isNearNode(canvasPos, 30);
      setDrawingState({ snapTarget: nearNodeId });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    setDragType(null);
    setDragVertexIndex(-1);
  };
  
  const handleDoubleClick = (event: React.MouseEvent) => {
    const mousePos = getMousePos(event);
    const canvasPos = screenToCanvas(mousePos);
    
    if (selectedTool === 'select') {
      const element = getElementByPosition(canvasPos);
      const corridorId = isNearCorridorSegment(canvasPos, 15);
      
      if (element && element.type === 'node') {
        const node = nodes.find(n => n.id === element.id);
        if (node) openNodeModal(node);
      } else if (corridorId) {
        const corridor = corridors.find(c => c.id === corridorId);
        if (corridor) openCorridorModal(corridor);
      }
    } else if (drawingState.isDrawing && drawingState.drawingType === 'corridor') {
      finishDrawing();
    }
  };
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (drawingState.isDrawing) {
        cancelDrawing();
      } else if (selectedCorridor) {
        setSelectedCorridor(null);
      }
    }
  }, [drawingState.isDrawing, selectedCorridor, cancelDrawing]);
  
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const mousePos = getMousePos(event);
    const canvasPos = screenToCanvas(mousePos);
    
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasState.scale * scaleFactor));
    
    // Zoom towards mouse position
    const newPan = {
      x: mousePos.x - canvasPos.x * newScale,
      y: mousePos.y - canvasPos.y * newScale
    };
    
    setCanvasState({
      scale: newScale,
      pan: newPan
    });
  };
  
  // Effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    drawBackground(ctx);
  }, [drawBackground]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Dynamic cursor based on mode and hover state
  const getCursorStyle = () => {
    if (selectedTool === 'pan') {
      return isDragging ? 'grabbing' : 'grab';
    }
    if (selectedTool === 'select') {
      if (hoveredElement?.type === 'vertex') {
        return 'grab';
      } else if (hoveredElement) {
        return 'pointer';
      }
      return isDragging ? 'grabbing' : 'default';
    }
    return 'crosshair';
  };
  
  const getInstructions = () => {
    if (drawingState.isDrawing) {
      if (drawingState.drawingType === 'corridor') {
        return 'Click intermediate points • End on a node • Double-click to finish • ESC to cancel • Switch floors for cross-floor connections';
      } else if (drawingState.drawingType === 'zone') {
        return 'Click to add points • Click start point to close • ESC to cancel';
      }
    }
    
    switch (selectedTool) {
      case 'pan':
        return 'Drag to pan the view • Scroll to zoom • Switch to Select or Draw mode to edit elements';
      case 'select':
        if (selectedCorridor) {
          return 'Corridor selected • Drag vertices to edit path • Double-click to edit properties • ESC to deselect';
        }
        return 'Click to select • Drag nodes/vertices to move • Double-click to edit • Drag empty space to pan';
      case 'draw':
        if (selectedNodeType === 'Connecting Segment (CS)') {
          return 'Click on a node to start corridor • Must start and end on nodes • Switch floors for cross-floor connections';
        } else {
          const config = getNodeTypeConfig(selectedNodeType);
          if (config.drawingMode === 'point') {
            return 'Click to place point nodes';
          } else if (config.drawingMode === 'zone') {
            return 'Click to start drawing zone polygon';
          }
          return 'Click to place nodes';
        }
      default:
        return 'Select a tool to begin';
    }
  };
  
  const currentFloor = getCurrentFloor();
  
  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-md">
        <div className="text-sm text-gray-700">
          <div className="font-semibold mb-2 flex items-center gap-2">
            {selectedTool === 'select' ? 'Select Mode' : 
             selectedTool === 'draw' ? `Draw Mode: ${selectedNodeType}` : 'Tool Mode'}
            {currentFloor && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {currentFloor.name}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600">
            {getInstructions()}
          </div>
          {drawingState.isDrawing && (
            <div className="text-xs text-blue-600 mt-1">
              Points: {drawingState.currentPath.length}
              {drawingState.startFloor !== undefined && drawingState.startFloor !== canvasState.currentFloorIndex && (
                <span className="ml-2 text-purple-600">
                  Cross-floor: F{drawingState.startFloor}→F{canvasState.currentFloorIndex}
                </span>
              )}
            </div>
          )}
          {hoveredElement && selectedTool === 'select' && (
            <div className="text-xs text-green-600 mt-1">
              {hoveredElement.type === 'vertex' ? 
                `Vertex ${(hoveredElement.index || 0) + 1} of ${hoveredElement.id} - Drag to move` :
                `Hover: ${hoveredElement.id} (${hoveredElement.type}) - Click to edit`
              }
            </div>
          )}
          {selectedCorridor && (
            <div className="text-xs text-purple-600 mt-1">
              Selected: {selectedCorridor} - Edit vertices or double-click for properties
            </div>
          )}
        </div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="text-xs text-gray-600">
          Zoom: {Math.round(canvasState.scale * 100)}%
        </div>
      </div>
    </div>
  );
};

export default Canvas;