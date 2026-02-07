import React from 'react';
import { useAnnotationStore } from '../store/annotationStore';
import { Trash2, Edit, GripVertical } from 'lucide-react';

const AttributePanel: React.FC = () => {
  const {
    nodes,
    corridors,
    pathSequence,
    deleteNode,
    deleteCorridor,
    openNodeModal,
    openCorridorModal,
    updatePathSequence
  } = useAnnotationStore();

  const generateSequenceDisplay = () => {
    if (pathSequence.length === 0) return 'No path defined';

    const sortedSequence = [...pathSequence].sort((a, b) => a.order - b.order);
    return sortedSequence.map(item => item.id).join(' → ');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

    if (dragIndex === dropIndex) return;

    const newSequence = [...pathSequence];
    const [draggedItem] = newSequence.splice(dragIndex, 1);
    newSequence.splice(dropIndex, 0, draggedItem);

    // Update order values
    const updatedSequence = newSequence.map((item, index) => ({
      ...item,
      order: index
    }));

    updatePathSequence(updatedSequence);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Path Annotations</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Path Sequence */}
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Path Sequence</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="text-sm text-blue-800 font-mono">
              {generateSequenceDisplay()}
            </div>
          </div>

          {/* Draggable sequence items */}
          <div className="space-y-1">
            {pathSequence
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded cursor-move hover:bg-gray-100 transition-colors"
                >
                  <GripVertical size={14} className="text-gray-400" />
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <span className="text-sm">{item.id}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {item.type}
                  </span>
                </div>
              ))}

            {pathSequence.length === 0 && (
              <div className="text-sm text-gray-500 italic text-center py-4">
                No path sequence defined yet
              </div>
            )}
          </div>
        </div>

        {/* Nodes */}
        <div>
          <h3 className="font-medium text-gray-700 mb-2">
            Nodes ({nodes.length})
          </h3>
          <div className="space-y-2">
            {nodes.map(node => (
              <div
                key={node.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">
                      {node.id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {node.type} • {node.shape}
                    </div>
                    {node.shape === 'polygon' ? (
                      <div className="text-xs text-gray-400 mt-1">
                        Zone ({node.polygon?.length || 0} points)
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1">
                        ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openNodeModal(node)}
                      className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => deleteNode(node.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Show some attributes */}
                {node.behavior_expectation?.behavior && node.behavior_expectation.behavior.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">Behaviors: </span>
                    <span className="text-purple-600">
                      {node.behavior_expectation.behavior.join(', ')}
                    </span>
                  </div>
                )}

                {node.behavior_expectation?.attention_zones && node.behavior_expectation.attention_zones.length > 0 && (
                  <div className="mt-1 text-xs">
                    <span className="text-gray-500">Attention zones: </span>
                    <span className="text-blue-600">
                      {node.behavior_expectation.attention_zones.length}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {nodes.length === 0 && (
              <div className="text-sm text-gray-500 italic text-center py-4">
                No nodes created yet
              </div>
            )}
          </div>
        </div>

        {/* Connecting Segments */}
        <div>
          <h3 className="font-medium text-gray-700 mb-2">
            Connecting Segments ({corridors.length})
          </h3>
          <div className="space-y-2">
            {corridors.map(corridor => (
              <div
                key={corridor.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">
                      {corridor.id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {corridor.path.length} points
                    </div>
                    {corridor.from && corridor.to && (
                      <div className="text-xs text-blue-600 mt-1">
                        {corridor.from} → {corridor.to}
                      </div>
                    )}
                    {corridor.notes && (
                      <div className="text-xs text-purple-600 mt-1 italic">
                        Notes: {corridor.notes.substring(0, 50)}
                        {corridor.notes.length > 50 ? '...' : ''}
                      </div>
                    )}
                    {corridor.width && corridor.height && (
                      <div className="text-xs text-gray-400 mt-1">
                        {corridor.width}m × {corridor.height}m
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCorridorModal(corridor)}
                      className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => deleteCorridor(corridor.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {corridors.length === 0 && (
              <div className="text-sm text-gray-500 italic text-center py-4">
                No connecting segments created yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributePanel;