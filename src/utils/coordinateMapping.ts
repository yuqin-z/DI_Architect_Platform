import { Position, Floor } from '../types';

export interface FloorDimensions {
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
}

/**
 * Convert Plan Coordinate System (PCS) to 3D world coordinates
 * PCS: pixel coordinates in original image size (top-left origin)
 * 3D: Three.js world coordinates (center origin, Y up, XZ plane)
 */
export function pcsTo3D(
  pcsPoint: Position, 
  floorDimensions: FloorDimensions, 
  worldUnitsPerPixel: number, 
  floorIndex: number, 
  floorSpacing: number
): [number, number, number] {
  const { naturalWidth: W, naturalHeight: H } = floorDimensions;
  
  // Convert from top-left origin to center origin and scale to world units
  const X = (pcsPoint.x - W / 2) * worldUnitsPerPixel;
  const Z = -(pcsPoint.y - H / 2) * worldUnitsPerPixel; // Invert Y for XZ plane (Y up)
  const Y = floorIndex * floorSpacing;
  
  return [X, Y, Z];
}

/**
 * Calculate normalized world units per pixel for consistent scaling
 * Normalizes to a target world size (e.g., 50m for the longer dimension)
 */
export function calculateWorldUnitsPerPixel(
  floorDimensions: FloorDimensions,
  targetWorldSize: number = 50
): number {
  const longerSide = Math.max(floorDimensions.naturalWidth, floorDimensions.naturalHeight);
  return targetWorldSize / longerSide;
}

/**
 * Convert screen coordinates to PCS coordinates
 * Removes canvas pan/zoom transformations to get pure plan coordinates
 */
export function screenToPCS(
  screenPoint: Position,
  canvasPan: Position,
  canvasScale: number
): Position {
  return {
    x: (screenPoint.x - canvasPan.x) / canvasScale,
    y: (screenPoint.y - canvasPan.y) / canvasScale
  };
}

/**
 * Convert PCS coordinates to screen coordinates
 * Applies canvas pan/zoom transformations for display
 */
export function pcsToScreen(
  pcsPoint: Position,
  canvasPan: Position,
  canvasScale: number
): Position {
  return {
    x: pcsPoint.x * canvasScale + canvasPan.x,
    y: pcsPoint.y * canvasScale + canvasPan.y
  };
}

/**
 * Load image and get natural dimensions
 */
export function loadImageDimensions(imageUrl: string): Promise<FloorDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Create plane geometry that matches floor dimensions exactly
 */
export function createFloorPlaneGeometry(
  floorDimensions: FloorDimensions,
  worldUnitsPerPixel: number
): { width: number; height: number } {
  return {
    width: floorDimensions.naturalWidth * worldUnitsPerPixel,
    height: floorDimensions.naturalHeight * worldUnitsPerPixel
  };
}

/**
 * Debug utility to validate coordinate mapping
 */
export function validateCoordinateMapping(
  pcsPoint: Position,
  floorDimensions: FloorDimensions,
  scale: number,
  floorIndex: number,
  floorSpacing: number
): {
  pcs: Position;
  world3D: [number, number, number];
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if PCS coordinates are within image bounds
  if (pcsPoint.x < 0 || pcsPoint.x > floorDimensions.naturalWidth) {
    errors.push(`X coordinate ${pcsPoint.x} outside image width ${floorDimensions.naturalWidth}`);
  }
  
  if (pcsPoint.y < 0 || pcsPoint.y > floorDimensions.naturalHeight) {
    errors.push(`Y coordinate ${pcsPoint.y} outside image height ${floorDimensions.naturalHeight}`);
  }
  
  const world3D = pcsTo3D(pcsPoint, floorDimensions, scale, floorIndex, floorSpacing);
  
  return {
    pcs: pcsPoint,
    world3D,
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create test points for coordinate validation
 */
export function createTestPoints(floorDimensions: FloorDimensions): Position[] {
  const { naturalWidth: W, naturalHeight: H } = floorDimensions;
  
  return [
    { x: 0, y: 0 },           // Top-left corner
    { x: W, y: 0 },           // Top-right corner  
    { x: 0, y: H },           // Bottom-left corner
    { x: W, y: H },           // Bottom-right corner
    { x: W/2, y: H/2 }        // Center
  ];
}