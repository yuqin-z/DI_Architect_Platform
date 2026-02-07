export interface Position {
  x: number;
  y: number;
  z?: number; // Floor index for 3D export
}

export interface AttentionZone {
  id: string;
  points: Position[];
  type?: 'polygon' | 'polyline';
  floorIndex: number; // Floor where this zone is located
  geoJson?: {
    type: "Polygon" | "LineString";
    coordinates: number[][] | number[][][];
  };
}

export interface BehaviorExpectation {
  attention_zones: AttentionZone[];
  behavior: string[];
  affect: string;
}

export interface DecisionProperties {
  importance: 'no' | 'neutral' | 'yes';
  rationale: string[];
  rationale_other?: string;
}

export interface JourneyReflection {
  confidence: number; // 1-5
  adherence_expectation: number; // 1-5
  team_alignment: number; // 1-5
  notes?: string;
}

export interface SpaceAnnotation {
  ceiling_height?: number;
  height?: number; // For corridors
  width?: number;
  area?: number;
  connections?: number;
}

export interface DesignCues {
  cue_medium_how: string[];
  verticality?: boolean;
  importance?: number;
  explanation?: string;
  confidence?: number;
  cue_target_where?: string;
}

export interface DPCue {
  cue_medium?: string[];
  cue_medium_other?: string;
  cue_vertical?: boolean;
  cue_importance?: number; // 1-3
  cue_confidence?: number; // 1-7
  cue_explain?: string;
}

export interface DPAnnotation {
  dp_choice?: string; // ID of the target connecting node
  dp_confidence?: number; // 1-7
  dp_behavior?: string; // WD, HP, SS, SA, AL, EX, Other
  dp_behavior_other?: string;
  dp_rationale?: string[];
  dp_rationale_other?: string;
  dp_affect?: string; // Grid value
  dp_attention_aoi?: AttentionZone[]; // Max 3
  cues?: DPCue[]; // Max 3
}

export type NodeShape = 'circle' | 'star' | 'square' | 'polygon' | 'diamond';

export interface Node {
  id: string;
  type: NodeType;
  shape: NodeShape;
  position: Position;
  floorIndex: number; // Floor where this node is located
  polygon?: Position[]; // For zone nodes
  design_importance: 'no' | 'neutral' | 'yes';
  space_annotation: SpaceAnnotation;
  behavior_expectation: BehaviorExpectation;
  dp_annotation?: DPAnnotation;
}

export interface CorridorSegment {
  start: Position;
  end: Position;
  startFloor: number;
  endFloor: number;
  isCrossFloor: boolean;
}

export interface Corridor {
  id: string;
  path: Position[];
  segments: CorridorSegment[]; // Derived from path for rendering
  floorIndex: number; // Primary floor (for single-floor corridors)
  fromFloor?: number; // For cross-floor corridors
  toFloor?: number; // For cross-floor corridors
  isCrossFloor: boolean; // Whether this corridor spans multiple floors
  width?: number;
  height?: number;
  from?: string; // Node ID
  to?: string; // Node ID
  design_importance: 'no' | 'neutral' | 'yes';
  space_annotation: SpaceAnnotation;
  behavior_expectation: BehaviorExpectation;
  notes?: string;
}

export interface Floor {
  id: string;
  name: string;
  index: number; // Z-coordinate (0, 1, 2, -1, etc.)
  backgroundImage: string;
  scale: number;
  pan: Position;
}

export interface DesignIntent {
  where: string;
  how: string[];
  description?: string;
  design_cues?: DesignCues;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  design_importance: 'no' | 'neutral' | 'yes';
  decision_properties: DecisionProperties;
  design_intent: DesignIntent;
}

export interface PathSequenceItem {
  id: string;
  type: 'node' | 'corridor';
  order: number;
}

export interface ProjectIdentification {
  buildingId: string;
  architectId: string;
  routeId: string;
}

export interface AnnotationData {
  nodes: Node[];
  corridors: Corridor[];
  edges: Edge[];
  pathSequence: PathSequenceItem[];
  floors: Floor[];
  projectId: ProjectIdentification;
  journey_reflection?: JourneyReflection;
  metadata: {
    version: string;
    created: string;
    modified: string;
  };
}

export type NodeType =
  | 'Entrance/Exit (E)'
  | 'Decision Point (DP)'
  | 'Decision Zone (DZ)'
  | 'Vertical Connection (VC)'
  | 'Activity Destination (AD)'
  | 'Connecting Segment (CS)';

export type Tool = 'select' | 'draw' | 'pan';

export interface CanvasState {
  scale: number;
  pan: Position;
  backgroundImage: string | null;
  currentFloorIndex: number;
}

export interface DrawingState {
  isDrawing: boolean;
  currentPath: Position[];
  snapTarget: string | null;
  drawingType: 'corridor' | 'zone' | 'point' | null;
  startFloor?: number; // For cross-floor corridors
  crossFloorVertices: number[]; // Indices of vertices that change floors
}

export interface NodeTypeConfig {
  type: NodeType;
  shape: NodeShape;
  color: string;
  drawingMode: 'point' | 'zone' | 'polyline';
  icon: string;
}

// Field configuration types
export interface FieldConfig {
  label: string;
  type: 'number' | 'text' | 'select' | 'multiple' | 'boolean' | 'scale' | 'choice' | 'sketch' | 'grid';
  options?: string[] | { value: string; label: string }[];
  range?: { min: number; max: number };
  helpText: string;
  optional: boolean;
  appliesTo: string[];
  dependsOn?: string; // Field only shows if this field has a value
}

export interface FormSection {
  title: string;
  fields: FieldConfig[];
}