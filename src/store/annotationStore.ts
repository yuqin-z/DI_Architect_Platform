import { create } from 'zustand';
import { Node, Corridor, Edge, AnnotationData, Tool, NodeType, CanvasState, Position, DrawingState, PathSequenceItem, NodeTypeConfig, Floor, CorridorSegment, ProjectIdentification, JourneyReflection } from '../types';
import { generateCorridorSegments, getSegmentsForFloor, updatePathWithFloorTransition } from '../utils/corridorUtils';
import { FloorDimensions, loadImageDimensions } from '../utils/coordinateMapping';

interface AnnotationStore {
  // Data
  nodes: Node[];
  corridors: Corridor[];
  edges: Edge[];
  pathSequence: PathSequenceItem[];
  floors: Floor[];
  projectId: ProjectIdentification;
  journeyReflection: JourneyReflection | null;
  floorDimensions: Map<number, FloorDimensions>;

  // UI State
  selectedTool: Tool;
  selectedNodeType: NodeType;
  selectedElement: string | null;
  canvasState: CanvasState;
  drawingState: DrawingState;

  // Modals
  showNodeModal: boolean;
  showCorridorModal: boolean;
  showEdgeModal: boolean;
  showAttentionModal: boolean;
  showFloorModal: boolean;
  showProjectIdModal: boolean;
  showJourneyReflectionModal: boolean;
  attentionModalTarget: string | null;

  // Current editing
  currentNode: Node | null;
  currentCorridor: Corridor | null;
  currentEdge: Edge | null;

  // Actions
  setSelectedTool: (tool: Tool) => void;
  setSelectedNodeType: (type: NodeType) => void;
  setCanvasState: (state: Partial<CanvasState>) => void;
  setDrawingState: (state: Partial<DrawingState>) => void;
  setProjectId: (projectId: ProjectIdentification) => void;
  setJourneyReflection: (reflection: JourneyReflection) => void;

  // Floor actions
  addFloor: (floor: Floor) => void;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  deleteFloor: (floorIndex: number) => void;
  reorderFloors: (floors: Floor[]) => void;
  setCurrentFloor: (floorIndex: number) => void;
  getCurrentFloor: () => Floor | null;

  // Node actions
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: Position) => void;

  // Corridor actions
  addCorridor: (corridor: Corridor) => void;
  updateCorridor: (id: string, updates: Partial<Corridor>) => void;
  deleteCorridor: (id: string) => void;
  updateCorridorVertex: (corridorId: string, vertexIndex: number, newPosition: Position, newFloor?: number) => void;

  // Edge actions (auto-generated)
  regenerateEdges: () => void;
  updateEdge: (id: string, updates: Partial<Edge>) => void;
  deleteEdge: (id: string) => void;
  addEdge: (edge: Edge) => void;

  // Path sequence
  updatePathSequence: (sequence: PathSequenceItem[]) => void;
  reorderPathSequence: () => void;

  // Modal actions
  openNodeModal: (node?: Node) => void;
  closeNodeModal: () => void;
  openCorridorModal: (corridor?: Corridor) => void;
  closeCorridorModal: () => void;
  openEdgeModal: (edge?: Edge) => void;
  closeEdgeModal: () => void;
  openAttentionModal: (target?: string) => void;
  closeAttentionModal: () => void;
  openFloorModal: () => void;
  closeFloorModal: () => void;
  openProjectIdModal: () => void;
  closeProjectIdModal: () => void;
  openJourneyReflectionModal: () => void;
  closeJourneyReflectionModal: () => void;

  // Drawing actions
  startDrawing: (type: 'corridor' | 'zone' | 'point', startPoint?: Position) => void;
  addDrawingPoint: (point: Position) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  undoLastPoint: () => void;

  // Project management
  saveProject: () => void;
  loadProject: (data: AnnotationData) => void;
  exportData: () => AnnotationData;
  generateFileName: () => string;

  // Utility
  generateId: (type: string) => string;
  getElementByPosition: (position: Position, tolerance?: number) => { id: string; type: 'node' | 'corridor' } | null;
  getNodeCentroid: (node: Node) => Position;
  isNearNode: (position: Position, tolerance?: number) => string | null;
  getNodeTypeConfig: (type: NodeType) => NodeTypeConfig;
  getVisibleNodes: () => Node[];
  getVisibleCorridors: () => Corridor[];
  getCorridorSegmentsForFloor: (corridorId: string, floorIndex: number) => CorridorSegment[];
  getFloorDimensions: (floorIndex: number) => FloorDimensions | null;
  setFloorDimensions: (floorIndex: number, dimensions: FloorDimensions) => void;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  // Initial state
  nodes: [],
  corridors: [],
  edges: [],
  pathSequence: [],
  floors: [],
  projectId: {
    buildingId: '',
    architectId: '',
    routeId: ''
  },
  journeyReflection: null,
  floorDimensions: new Map(),
  selectedTool: 'select',
  selectedNodeType: 'Decision Point (DP)',
  selectedElement: null,
  canvasState: {
    scale: 1,
    pan: { x: 0, y: 0 },
    backgroundImage: null,
    currentFloorIndex: 0
  },
  drawingState: {
    isDrawing: false,
    currentPath: [],
    snapTarget: null,
    drawingType: null,
    crossFloorVertices: []
  },
  showNodeModal: false,
  showCorridorModal: false,
  showEdgeModal: false,
  showAttentionModal: false,
  showFloorModal: false,
  showProjectIdModal: false,
  showJourneyReflectionModal: false,
  attentionModalTarget: null,
  currentNode: null,
  currentCorridor: null,
  currentEdge: null,

  // Actions
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedNodeType: (type) => set({ selectedNodeType: type }),
  setCanvasState: (state) => set((prev) => ({
    canvasState: { ...prev.canvasState, ...state }
  })),
  setDrawingState: (state) => set((prev) => ({
    drawingState: { ...prev.drawingState, ...state }
  })),
  setProjectId: (projectId) => set({ projectId }),
  setJourneyReflection: (journeyReflection) => set({ journeyReflection }),

  // Floor actions
  addFloor: (floor) => {
    set((state) => {
      const newFloors = [...state.floors, floor];

      // Load image dimensions for coordinate mapping
      if (floor.backgroundImage) {
        loadImageDimensions(floor.backgroundImage).then(dimensions => {
          get().setFloorDimensions(floor.index, dimensions);
        }).catch(console.error);
      }

      // If this is the first floor, set it as current and update canvas
      if (state.floors.length === 0) {
        return {
          floors: newFloors,
          canvasState: {
            ...state.canvasState,
            backgroundImage: floor.backgroundImage,
            currentFloorIndex: floor.index,
            scale: floor.scale,
            pan: floor.pan
          }
        };
      }

      return { floors: newFloors };
    });
  },

  updateFloor: (id, updates) => {
    set((state) => ({
      floors: state.floors.map(floor =>
        floor.id === id ? { ...floor, ...updates } : floor
      )
    }));
  },

  deleteFloor: (floorIndex) => {
    set((state) => {
      const newFloors = state.floors.filter(f => f.index !== floorIndex);
      const newNodes = state.nodes.filter(n => n.floorIndex !== floorIndex);
      const newCorridors = state.corridors.filter(c =>
        c.floorIndex !== floorIndex &&
        !(c.isCrossFloor && (c.fromFloor === floorIndex || c.toFloor === floorIndex))
      );

      // Update current floor if deleted
      let newCurrentFloor = state.canvasState.currentFloorIndex;
      if (newCurrentFloor === floorIndex && newFloors.length > 0) {
        newCurrentFloor = newFloors[0].index;
      }

      return {
        floors: newFloors,
        nodes: newNodes,
        corridors: newCorridors,
        canvasState: {
          ...state.canvasState,
          currentFloorIndex: newCurrentFloor,
          backgroundImage: newFloors.find(f => f.index === newCurrentFloor)?.backgroundImage || null
        }
      };
    });
  },

  reorderFloors: (floors) => {
    set({ floors });
  },

  setCurrentFloor: (floorIndex) => {
    const state = get();
    const floor = state.floors.find(f => f.index === floorIndex);
    if (floor) {
      set({
        canvasState: {
          ...state.canvasState,
          currentFloorIndex: floorIndex,
          backgroundImage: floor.backgroundImage,
          scale: floor.scale,
          pan: floor.pan
        }
      });
    }
  },

  getCurrentFloor: () => {
    const state = get();
    return state.floors.find(f => f.index === state.canvasState.currentFloorIndex) || null;
  },

  getFloorDimensions: (floorIndex) => {
    const state = get();
    return state.floorDimensions.get(floorIndex) || null;
  },

  setFloorDimensions: (floorIndex, dimensions) => {
    set((state) => {
      const newDimensions = new Map(state.floorDimensions);
      newDimensions.set(floorIndex, dimensions);
      return { floorDimensions: newDimensions };
    });
  },

  getVisibleNodes: () => {
    const state = get();
    return state.nodes.filter(node => node.floorIndex === state.canvasState.currentFloorIndex);
  },

  getVisibleCorridors: () => {
    const state = get();
    return state.corridors.filter(corridor => {
      // Show corridors that have segments on the current floor
      const segments = getSegmentsForFloor(corridor.segments, state.canvasState.currentFloorIndex);
      return segments.length > 0;
    });
  },

  getCorridorSegmentsForFloor: (corridorId, floorIndex) => {
    const state = get();
    const corridor = state.corridors.find(c => c.id === corridorId);
    if (!corridor) return [];

    return getSegmentsForFloor(corridor.segments, floorIndex);
  },

  getNodeTypeConfig: (type: NodeType): NodeTypeConfig => {
    const configs: Record<NodeType, NodeTypeConfig> = {
      'Decision Point (DP)': {
        type: 'Decision Point (DP)',
        shape: 'circle',
        color: '#dc2626',
        drawingMode: 'point',
        icon: 'Circle'
      },
      'Decision Zone (DZ)': {
        type: 'Decision Zone (DZ)',
        shape: 'polygon',
        color: '#ea580c',
        drawingMode: 'zone',
        icon: 'Hexagon'
      },
      'Entrance/Exit (E)': {
        type: 'Entrance/Exit (E)',
        shape: 'square',
        color: '#16a34a',
        drawingMode: 'point',
        icon: 'Home'
      },
      'Vertical Connection (VC)': {
        type: 'Vertical Connection (VC)',
        shape: 'circle',
        color: '#2563eb',
        drawingMode: 'point',
        icon: 'ArrowUpDown'
      },
      'Activity Destination (AD)': {
        type: 'Activity Destination (AD)',
        shape: 'diamond',
        color: '#ea580c',
        drawingMode: 'point',
        icon: 'MapPin'
      },
      'Connecting Segment (CS)': {
        type: 'Connecting Segment (CS)',
        shape: 'polygon',
        color: '#0891b2',
        drawingMode: 'polyline',
        icon: 'Route'
      }
    };
    return configs[type];
  },

  addNode: (node) => {
    console.log('Store: addNode called with:', node);
    set((state) => {
      const nodeWithFloor = {
        ...node,
        floorIndex: state.canvasState.currentFloorIndex,
        position: { ...node.position, z: state.canvasState.currentFloorIndex },
        design_importance: node.design_importance || 'neutral'
      };

      const newPathItem: PathSequenceItem = {
        id: node.id,
        type: 'node',
        order: state.pathSequence.length
      };
      const newState = {
        nodes: [...state.nodes, nodeWithFloor],
        pathSequence: [...state.pathSequence, newPathItem]
      };
      console.log('Store: addNode new state:', newState);
      return newState;
    });
    get().reorderPathSequence();
  },

  updateNode: (id, updates) => {
    console.log('Store: updateNode called with id:', id, 'updates:', updates);
    set((state) => {
      const updatedNodes = state.nodes.map(node => {
        if (node.id === id) {
          const updatedNode = { ...node, ...updates };
          // Update Z coordinate if position changed
          if (updates.position) {
            updatedNode.position = {
              ...updatedNode.position,
              z: updatedNode.floorIndex
            };
          }
          console.log('Store: updating node from:', node, 'to:', updatedNode);
          return updatedNode;
        }
        return node;
      });

      // Also update currentNode if it's the one being updated
      const newCurrentNode = state.currentNode?.id === id
        ? { ...state.currentNode, ...updates }
        : state.currentNode;

      console.log('Store: updateNode result - nodes:', updatedNodes);
      console.log('Store: updateNode result - currentNode:', newCurrentNode);

      return {
        nodes: updatedNodes,
        currentNode: newCurrentNode
      };
    });
    get().reorderPathSequence();
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter(node => node.id !== id),
      corridors: state.corridors.filter(corridor =>
        corridor.from !== id && corridor.to !== id
      ),
      pathSequence: state.pathSequence.filter(item => item.id !== id)
        .map((item, index) => ({ ...item, order: index }))
    }));
    get().reorderPathSequence();
  },

  moveNode: (id, position) => {
    const state = get();
    const positionWithZ = { ...position, z: state.canvasState.currentFloorIndex };
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === id ? { ...node, position: positionWithZ } : node
      )
    }));
  },

  addCorridor: (corridor) => {
    set((state) => {
      const corridorWithFloor = {
        ...corridor,
        floorIndex: state.canvasState.currentFloorIndex,
        isCrossFloor: false,
        design_importance: corridor.design_importance || 'neutral',
        path: corridor.path.map(p => ({ ...p, z: p.z ?? state.canvasState.currentFloorIndex })),
        segments: [] as CorridorSegment[]
      };

      // Generate segments
      corridorWithFloor.segments = generateCorridorSegments(corridorWithFloor.path);

      // Check if this is a cross-floor corridor
      const hasFloorTransition = corridorWithFloor.segments.some(seg => seg.isCrossFloor);
      if (hasFloorTransition) {
        corridorWithFloor.isCrossFloor = true;
        const floors = corridorWithFloor.path.map(p => p.z ?? 0);
        corridorWithFloor.fromFloor = Math.min(...floors);
        corridorWithFloor.toFloor = Math.max(...floors);
      }

      const newPathItem: PathSequenceItem = {
        id: corridor.id,
        type: 'corridor',
        order: state.pathSequence.length
      };
      return {
        corridors: [...state.corridors, corridorWithFloor],
        pathSequence: [...state.pathSequence, newPathItem]
      };
    });
    get().reorderPathSequence();
  },

  updateCorridor: (id, updates) => {
    console.log('Store: updateCorridor called with id:', id, 'updates:', updates);
    set((state) => {
      const updatedCorridors = state.corridors.map(corridor => {
        if (corridor.id === id) {
          const updatedCorridor = { ...corridor, ...updates };

          // Regenerate segments if path was updated
          if (updates.path) {
            updatedCorridor.segments = generateCorridorSegments(updates.path);

            // Update cross-floor status
            const hasFloorTransition = updatedCorridor.segments.some(seg => seg.isCrossFloor);
            updatedCorridor.isCrossFloor = hasFloorTransition;

            if (hasFloorTransition) {
              const floors = updates.path.map(p => p.z ?? 0);
              updatedCorridor.fromFloor = Math.min(...floors);
              updatedCorridor.toFloor = Math.max(...floors);
            } else {
              delete updatedCorridor.fromFloor;
              delete updatedCorridor.toFloor;
            }
          }

          console.log('Store: updating corridor from:', corridor, 'to:', updatedCorridor);
          return updatedCorridor;
        }
        return corridor;
      });

      // Also update currentCorridor if it's the one being updated
      const newCurrentCorridor = state.currentCorridor?.id === id
        ? { ...state.currentCorridor, ...updates }
        : state.currentCorridor;

      console.log('Store: updateCorridor result - corridors:', updatedCorridors);
      console.log('Store: updateCorridor result - currentCorridor:', newCurrentCorridor);

      return {
        corridors: updatedCorridors,
        currentCorridor: newCurrentCorridor
      };
    });
    get().reorderPathSequence();
  },

  updateCorridorVertex: (corridorId, vertexIndex, newPosition, newFloor) => {
    const state = get();
    const corridor = state.corridors.find(c => c.id === corridorId);
    if (!corridor) return;

    const updatedPath = [...corridor.path];
    updatedPath[vertexIndex] = {
      ...newPosition,
      z: newFloor ?? newPosition.z ?? state.canvasState.currentFloorIndex
    };

    get().updateCorridor(corridorId, { path: updatedPath });
  },

  deleteCorridor: (id) => {
    set((state) => ({
      corridors: state.corridors.filter(corridor => corridor.id !== id),
      pathSequence: state.pathSequence.filter(item => item.id !== id)
        .map((item, index) => ({ ...item, order: index }))
    }));
    get().reorderPathSequence();
  },

  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge]
    }));
  },

  reorderPathSequence: () => {
    const state = get();
    const reorderedSequence: PathSequenceItem[] = [];

    // Create a graph of connections
    const nodeConnections = new Map<string, string[]>();
    const corridorConnections = new Map<string, { from?: string; to?: string }>();

    // Build connection maps
    state.corridors.forEach(corridor => {
      corridorConnections.set(corridor.id, { from: corridor.from, to: corridor.to });

      if (corridor.from) {
        if (!nodeConnections.has(corridor.from)) {
          nodeConnections.set(corridor.from, []);
        }
        nodeConnections.get(corridor.from)!.push(corridor.id);
      }

      if (corridor.to) {
        if (!nodeConnections.has(corridor.to)) {
          nodeConnections.set(corridor.to, []);
        }
        nodeConnections.get(corridor.to)!.push(corridor.id);
      }
    });

    const processedItems = new Set<string>();
    let currentOrder = 0;

    // Find starting nodes (nodes with no incoming corridors or entrance nodes)
    const startNodes = state.nodes.filter(node => {
      const isEntrance = node.type.includes('Entrance');
      const hasIncoming = state.corridors.some(corridor => corridor.to === node.id);
      return isEntrance || !hasIncoming;
    });

    const addItemToSequence = (itemId: string, order: number) => {
      if (processedItems.has(itemId)) return order;

      const item = state.pathSequence.find(p => p.id === itemId);
      if (!item) return order;

      processedItems.add(itemId);
      reorderedSequence.push({ ...item, order });
      return order + 1;
    };

    const processPath = (nodeId: string, order: number): number => {
      order = addItemToSequence(nodeId, order);

      // Find corridors starting from this node
      const outgoingCorridors = state.corridors.filter(c => c.from === nodeId);

      for (const corridor of outgoingCorridors) {
        // Add corridor
        order = addItemToSequence(corridor.id, order);

        // Add destination node
        if (corridor.to && !processedItems.has(corridor.to)) {
          order = processPath(corridor.to, order);
        }
      }

      return order;
    };

    // Process paths starting from each start node
    for (const startNode of startNodes) {
      if (!processedItems.has(startNode.id)) {
        currentOrder = processPath(startNode.id, currentOrder);
      }
    }

    // Add any remaining unprocessed items
    for (const item of state.pathSequence) {
      if (!processedItems.has(item.id)) {
        reorderedSequence.push({ ...item, order: currentOrder });
        currentOrder++;
      }
    }

    set({ pathSequence: reorderedSequence });
    get().regenerateEdges();
  },

  regenerateEdges: () => {
    const state = get();
    const newEdges: Edge[] = [];

    // Sort path sequence by order
    const sortedSequence = [...state.pathSequence].sort((a, b) => a.order - b.order);

    // Generate edges between consecutive items
    for (let i = 0; i < sortedSequence.length - 1; i++) {
      const current = sortedSequence[i];
      const next = sortedSequence[i + 1];

      const edgeId = `${current.id}-${next.id}`;
      const existingEdge = state.edges.find(e => e.id === edgeId);

      const newEdge: Edge = {
        id: edgeId,
        from: current.id,
        to: next.id,
        design_importance: existingEdge?.design_importance || 'neutral',
        decision_properties: existingEdge?.decision_properties || {
          importance: 'neutral',
          rationale: [],
          rationale_other: ''
        },
        design_intent: existingEdge?.design_intent || {
          where: current.type === 'node' ? current.id : '',
          how: [],
          design_cues: {
            cue_medium_how: []
          }
        }
      };

      newEdges.push(newEdge);
    }

    set({ edges: newEdges });
  },

  updateEdge: (id, updates) => {
    set((state) => ({
      edges: state.edges.map(edge =>
        edge.id === id ? { ...edge, ...updates } : edge
      )
    }));
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter(edge => edge.id !== id)
    }));
  },

  updatePathSequence: (sequence) => {
    set({ pathSequence: sequence });
    get().regenerateEdges();
  },

  openNodeModal: (node) => {
    console.log('Store: openNodeModal called with:', node);
    set({
      showNodeModal: true,
      currentNode: node || null,
      currentCorridor: null // Clear corridor when opening node modal
    });
  },

  closeNodeModal: () => set({
    showNodeModal: false,
    currentNode: null
  }),

  openCorridorModal: (corridor) => {
    console.log('Store: openCorridorModal called with:', corridor);
    set({
      showCorridorModal: true,
      currentCorridor: corridor || null,
      currentNode: null // Clear node when opening corridor modal
    });
  },

  closeCorridorModal: () => set({
    showCorridorModal: false,
    currentCorridor: null
  }),

  openEdgeModal: (edge) => set({
    showEdgeModal: true,
    currentEdge: edge || null
  }),

  closeEdgeModal: () => set({
    showEdgeModal: false,
    currentEdge: null
  }),

  openAttentionModal: (target) => {
    console.log('Store: openAttentionModal called with target:', target);
    set({
      showAttentionModal: true,
      attentionModalTarget: target || null
    });
  },

  closeAttentionModal: () => {
    console.log('Store: closeAttentionModal called');
    set({ showAttentionModal: false });
  },

  openFloorModal: () => {
    set({ showFloorModal: true });
  },

  closeFloorModal: () => {
    set({ showFloorModal: false });
  },

  openProjectIdModal: () => {
    set({ showProjectIdModal: true });
  },

  closeProjectIdModal: () => {
    set({ showProjectIdModal: false });
  },

  openJourneyReflectionModal: () => {
    set({ showJourneyReflectionModal: true });
  },

  closeJourneyReflectionModal: () => {
    set({ showJourneyReflectionModal: false });
  },

  startDrawing: (type, startPoint) => {
    const state = get();
    set({
      drawingState: {
        isDrawing: true,
        currentPath: startPoint ? [startPoint] : [],
        snapTarget: null,
        drawingType: type,
        startFloor: state.canvasState.currentFloorIndex,
        crossFloorVertices: []
      }
    });
  },

  addDrawingPoint: (point) => {
    set((state) => {
      const newPath = [...state.drawingState.currentPath, point];
      const crossFloorVertices = [...state.drawingState.crossFloorVertices];

      // Check if this point is on a different floor than the previous point
      if (newPath.length > 1) {
        const prevPoint = newPath[newPath.length - 2];
        const currentFloor = point.z ?? state.canvasState.currentFloorIndex;
        const prevFloor = prevPoint.z ?? state.canvasState.currentFloorIndex;

        if (currentFloor !== prevFloor) {
          crossFloorVertices.push(newPath.length - 2); // Mark the transition
        }
      }

      return {
        drawingState: {
          ...state.drawingState,
          currentPath: newPath,
          crossFloorVertices
        }
      };
    });
  },

  finishDrawing: () => {
    const state = get();
    const { drawingState } = state;

    if (drawingState.drawingType === 'corridor' && drawingState.currentPath.length >= 2) {
      // Find start and end nodes
      const startPos = drawingState.currentPath[0];
      const endPos = drawingState.currentPath[drawingState.currentPath.length - 1];

      const startNodeId = state.isNearNode(startPos, 30);
      const endNodeId = state.isNearNode(endPos, 30);

      // Snap path endpoints to node centroids if connected
      const finalPath = [...drawingState.currentPath];
      if (startNodeId) {
        const startNode = state.nodes.find(n => n.id === startNodeId);
        if (startNode) {
          finalPath[0] = state.getNodeCentroid(startNode);
        }
      }
      if (endNodeId) {
        const endNode = state.nodes.find(n => n.id === endNodeId);
        if (endNode) {
          finalPath[finalPath.length - 1] = state.getNodeCentroid(endNode);
        }
      }

      const id = state.generateId('CS');
      const corridor: Corridor = {
        id,
        path: finalPath,
        segments: [],
        floorIndex: state.canvasState.currentFloorIndex,
        isCrossFloor: false,
        from: startNodeId || undefined,
        to: endNodeId || undefined,
        space_annotation: {},
        behavior_expectation: {
          attention_zones: [],
          behavior: [],
          affect: 'Low arousal / positive valence'
        },
        design_importance: 'neutral',
        notes: ''
      };

      state.addCorridor(corridor);
    } else if (drawingState.drawingType === 'zone' && drawingState.currentPath.length >= 3) {
      // Create zone node
      const config = state.getNodeTypeConfig(state.selectedNodeType);
      const id = state.generateId(state.selectedNodeType.match(/\((\w+)\)/)?.[1] || 'N');

      // Calculate centroid
      const centroid = {
        x: drawingState.currentPath.reduce((sum, p) => sum + p.x, 0) / drawingState.currentPath.length,
        y: drawingState.currentPath.reduce((sum, p) => sum + p.y, 0) / drawingState.currentPath.length,
        z: state.canvasState.currentFloorIndex
      };

      const newNode: Node = {
        id,
        type: state.selectedNodeType,
        shape: config.shape,
        position: centroid,
        floorIndex: state.canvasState.currentFloorIndex,
        polygon: drawingState.currentPath,
        space_annotation: {},
        behavior_expectation: {
          attention_zones: [],
          behavior: [],
          affect: 'Low arousal / positive valence'
        },
        design_importance: 'neutral'
      };

      state.addNode(newNode);
      state.openNodeModal(newNode);
    } else if (drawingState.drawingType === 'point') {
      // Create point node
      const config = state.getNodeTypeConfig(state.selectedNodeType);
      const id = state.generateId(state.selectedNodeType.match(/\((\w+)\)/)?.[1] || 'N');
      const position = {
        ...drawingState.currentPath[0],
        z: state.canvasState.currentFloorIndex
      };

      const newNode: Node = {
        id,
        type: state.selectedNodeType,
        shape: config.shape,
        position,
        floorIndex: state.canvasState.currentFloorIndex,
        space_annotation: {},
        behavior_expectation: {
          attention_zones: [],
          behavior: [],
          affect: 'Low arousal / positive valence'
        },
        design_importance: 'neutral'
      };

      state.addNode(newNode);
      state.openNodeModal(newNode);
    }

    set({
      drawingState: {
        isDrawing: false,
        currentPath: [],
        snapTarget: null,
        drawingType: null,
        crossFloorVertices: []
      }
    });
  },

  cancelDrawing: () => {
    set({
      drawingState: {
        isDrawing: false,
        currentPath: [],
        snapTarget: null,
        drawingType: null,
        crossFloorVertices: []
      }
    });
  },

  undoLastPoint: () => {
    set((state) => ({
      drawingState: {
        ...state.drawingState,
        currentPath: state.drawingState.currentPath.slice(0, -1)
      }
    }));
  },

  generateFileName: () => {
    const state = get();
    const { buildingId, architectId, routeId } = state.projectId;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create filename with format: BuildingID_ArchitectID_RouteID_YYYY-MM-DD.json
    const parts = [buildingId, architectId, routeId, date].filter(part => part.trim() !== '');

    if (parts.length === 0) {
      return `spatial-annotation-${date}.json`;
    }

    return `${parts.join('_')}.json`;
  },

  saveProject: () => {
    const state = get();

    // Check if journey reflection is needed first (if we have a path sequence)
    if (state.pathSequence.length > 0 && !state.journeyReflection) {
      state.openJourneyReflectionModal();
      return;
    }

    // Check if project ID is set, if not open the modal
    if (!state.projectId.buildingId || !state.projectId.architectId || !state.projectId.routeId) {
      state.openProjectIdModal();
      return;
    }

    const data = state.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.generateFileName();
    a.click();
    URL.revokeObjectURL(url);
  },

  loadProject: (data) => {
    set({
      nodes: data.nodes || [],
      corridors: (data.corridors || []).map(corridor => ({
        ...corridor,
        segments: corridor.segments || generateCorridorSegments(corridor.path)
      })),
      edges: data.edges || [],
      pathSequence: data.pathSequence || [],
      floors: data.floors || [],
      projectId: data.projectId || { buildingId: '', architectId: '', routeId: '' },
      journeyReflection: data.journey_reflection || null
    });

    // Set current floor to first available floor
    if (data.floors && data.floors.length > 0) {
      const firstFloor = data.floors[0];
      set({
        canvasState: {
          scale: firstFloor.scale,
          pan: firstFloor.pan,
          backgroundImage: firstFloor.backgroundImage,
          currentFloorIndex: firstFloor.index
        }
      });
    }
  },

  exportData: () => {
    const state = get();
    return {
      nodes: state.nodes,
      corridors: state.corridors,
      edges: state.edges,
      pathSequence: state.pathSequence,
      floors: state.floors,
      projectId: state.projectId,
      journey_reflection: state.journeyReflection || undefined,
      metadata: {
        version: '3.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
  },

  generateId: (type) => {
    const state = get();
    let counter = 1;
    let id = `${type}${counter}`;

    const allIds = [
      ...state.nodes.map(n => n.id),
      ...state.corridors.map(c => c.id),
      ...state.edges.map(e => e.id)
    ];

    while (allIds.includes(id)) {
      counter++;
      id = `${type}${counter}`;
    }

    return id;
  },

  getElementByPosition: (position, tolerance = 20) => {
    const state = get();
    const visibleNodes = state.getVisibleNodes();
    const visibleCorridors = state.getVisibleCorridors();

    // Check nodes first
    for (const node of visibleNodes) {
      const centroid = state.getNodeCentroid(node);
      const distance = Math.sqrt(
        Math.pow(centroid.x - position.x, 2) +
        Math.pow(centroid.y - position.y, 2)
      );
      if (distance < tolerance) return { id: node.id, type: 'node' };
    }

    // Check corridor segments
    for (const corridor of visibleCorridors) {
      const segments = getSegmentsForFloor(corridor.segments, state.canvasState.currentFloorIndex);

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
          return { id: corridor.id, type: 'corridor' };
        }
      }
    }

    return null;
  },

  getNodeCentroid: (node) => {
    if (node.shape === 'polygon' && node.polygon) {
      return {
        x: node.polygon.reduce((sum, p) => sum + p.x, 0) / node.polygon.length,
        y: node.polygon.reduce((sum, p) => sum + p.y, 0) / node.polygon.length,
        z: node.floorIndex
      };
    }
    return node.position;
  },

  isNearNode: (position, tolerance = 30) => {
    const state = get();
    const visibleNodes = state.getVisibleNodes();

    for (const node of visibleNodes) {
      const centroid = state.getNodeCentroid(node);
      const distance = Math.sqrt(
        Math.pow(centroid.x - position.x, 2) +
        Math.pow(centroid.y - position.y, 2)
      );
      if (distance < tolerance) return node.id;
    }

    return null;
  }
}));