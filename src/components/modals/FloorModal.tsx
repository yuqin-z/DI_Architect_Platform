import React, { useState, useEffect } from 'react';
import { X, Upload, ArrowUp, ArrowDown, Plus, Trash2, Edit3 } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Floor } from '../../types';

const FloorModal: React.FC = () => {
  const {
    showFloorModal,
    floors,
    closeFloorModal,
    addFloor,
    updateFloor,
    deleteFloor,
    reorderFloors
  } = useAnnotationStore();
  
  const [floorList, setFloorList] = useState<Floor[]>([]);
  const [editingFloor, setEditingFloor] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  useEffect(() => {
    if (showFloorModal) {
      setFloorList([...floors].sort((a, b) => b.index - a.index));
    }
  }, [showFloorModal, floors]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const newFloor: Floor = {
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
  };
  
  const handleReorder = (floorId: string, direction: 'up' | 'down') => {
    const currentIndex = floorList.findIndex(f => f.id === floorId);
    if (currentIndex === -1) return;
    
    const newList = [...floorList];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    
    // Swap positions
    [newList[currentIndex], newList[targetIndex]] = [newList[targetIndex], newList[currentIndex]];
    
    // Update indices
    newList.forEach((floor, index) => {
      floor.index = newList.length - 1 - index; // Reverse order for proper floor numbering
    });
    
    setFloorList(newList);
    reorderFloors(newList);
  };
  
  const handleNameEdit = (floorId: string, newName: string) => {
    updateFloor(floorId, { name: newName });
    setEditingFloor(null);
    setEditName('');
  };
  
  const handleDelete = (floorId: string) => {
    if (floors.length <= 1) {
      alert('Cannot delete the last floor');
      return;
    }
    
    if (window.confirm('Delete this floor? All elements on this floor will be removed.')) {
      deleteFloor(floorId);
    }
  };
  
  if (!showFloorModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Manage Floors</h2>
          <button
            onClick={closeFloorModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload Floor Plans</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select multiple images to add new floors. They will be added in the order selected.
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
              <Upload size={16} className="mr-2" />
              Choose Files
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Floor List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Current Floors</h3>
            
            {floorList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No floors uploaded yet. Upload floor plans to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {floorList.map((floor, index) => (
                  <div
                    key={floor.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Floor Preview */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={floor.backgroundImage}
                        alt={floor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Floor Info */}
                    <div className="flex-1 min-w-0">
                      {editingFloor === floor.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleNameEdit(floor.id, editName)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleNameEdit(floor.id, editName);
                            }
                          }}
                          className="text-lg font-medium bg-transparent border-b border-blue-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="text-lg font-medium text-gray-800">{floor.name}</div>
                      )}
                      <div className="text-sm text-gray-500">
                        Floor Index: {floor.index} • Z-coordinate: {floor.index}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Reorder buttons */}
                      <button
                        onClick={() => handleReorder(floor.id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleReorder(floor.id, 'down')}
                        disabled={index === floorList.length - 1}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      
                      {/* Edit name */}
                      <button
                        onClick={() => {
                          setEditingFloor(floor.id);
                          setEditName(floor.name);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Name"
                      >
                        <Edit3 size={16} />
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(floor.id)}
                        disabled={floorList.length <= 1}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Floor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Multi-Floor Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload multiple floor plans and reorder them as needed</li>
              <li>• Higher floors appear at the top of the list</li>
              <li>• Floor indices become Z-coordinates in exported data</li>
              <li>• Cross-floor corridors will show as dotted lines</li>
              <li>• Use the Floor Navigator to switch between floors while annotating</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={closeFloorModal}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloorModal;