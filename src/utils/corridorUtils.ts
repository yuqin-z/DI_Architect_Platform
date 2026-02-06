import { Position, CorridorSegment } from '../types';

export const generateCorridorSegments = (path: Position[]): CorridorSegment[] => {
  if (path.length < 2) return [];
  
  const segments: CorridorSegment[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    
    const startFloor = start.z ?? 0;
    const endFloor = end.z ?? 0;
    const isCrossFloor = startFloor !== endFloor;
    
    segments.push({
      start,
      end,
      startFloor,
      endFloor,
      isCrossFloor
    });
  }
  
  return segments;
};

export const getSegmentsForFloor = (segments: CorridorSegment[], floorIndex: number): CorridorSegment[] => {
  return segments.filter(segment => 
    segment.startFloor === floorIndex || segment.endFloor === floorIndex
  );
};

export const shouldRenderSegmentOnFloor = (segment: CorridorSegment, floorIndex: number): boolean => {
  // Render if either vertex is on this floor
  return segment.startFloor === floorIndex || segment.endFloor === floorIndex;
};

export const getSegmentRenderStyle = (segment: CorridorSegment, currentFloor: number): {
  isDotted: boolean;
  color: string;
  opacity: number;
} => {
  const isCrossFloor = segment.isCrossFloor;
  const isOnCurrentFloor = segment.startFloor === currentFloor || segment.endFloor === currentFloor;
  
  if (isCrossFloor) {
    return {
      isDotted: true,
      color: '#8b5cf6', // Purple for cross-floor
      opacity: isOnCurrentFloor ? 1.0 : 0.6
    };
  }
  
  return {
    isDotted: false,
    color: '#3b82f6', // Blue for same-floor
    opacity: 1.0
  };
};

export const updatePathWithFloorTransition = (
  path: Position[], 
  vertexIndex: number, 
  newFloor: number
): Position[] => {
  const newPath = [...path];
  
  // Update the vertex floor
  if (newPath[vertexIndex]) {
    newPath[vertexIndex] = {
      ...newPath[vertexIndex],
      z: newFloor
    };
  }
  
  return newPath;
};

export const detectFloorTransitions = (path: Position[]): number[] => {
  const transitions: number[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const currentFloor = path[i].z ?? 0;
    const nextFloor = path[i + 1].z ?? 0;
    
    if (currentFloor !== nextFloor) {
      transitions.push(i);
    }
  }
  
  return transitions;
};

export const getCorridorFloorRange = (path: Position[]): { min: number; max: number } => {
  const floors = path.map(p => p.z ?? 0);
  return {
    min: Math.min(...floors),
    max: Math.max(...floors)
  };
};

export const validateCorridorPath = (path: Position[]): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (path.length < 2) {
    errors.push('Corridor must have at least 2 vertices');
  }
  
  // Check for missing Z coordinates
  const missingZ = path.some(p => p.z === undefined);
  if (missingZ) {
    errors.push('All vertices must have floor information (Z coordinate)');
  }
  
  // Check for reasonable floor transitions
  const floorRange = getCorridorFloorRange(path);
  if (floorRange.max - floorRange.min > 5) {
    errors.push('Corridor spans too many floors (max 5 floors)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};