import React, { useState, useEffect } from 'react';
import { X, Building, User, Route, Save } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';

const ProjectIdModal: React.FC = () => {
  const {
    showProjectIdModal,
    projectId,
    closeProjectIdModal,
    setProjectId,
    saveProject,
    generateFileName
  } = useAnnotationStore();
  
  const [formData, setFormData] = useState({
    buildingId: '',
    architectId: '',
    routeId: ''
  });
  
  const [previewFilename, setPreviewFilename] = useState('');
  
  useEffect(() => {
    if (showProjectIdModal) {
      setFormData(projectId);
    }
  }, [showProjectIdModal, projectId]);
  
  useEffect(() => {
    // Update preview filename when form data changes
    const { buildingId, architectId, routeId } = formData;
    const date = new Date().toISOString().split('T')[0];
    const parts = [buildingId, architectId, routeId, date].filter(part => part.trim() !== '');
    
    if (parts.length === 0) {
      setPreviewFilename(`spatial-annotation-${date}.json`);
    } else {
      setPreviewFilename(`${parts.join('_')}.json`);
    }
  }, [formData]);
  
  const handleInputChange = (field: string, value: string) => {
    // Remove special characters and spaces, replace with underscores
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    setFormData(prev => ({
      ...prev,
      [field]: cleanValue
    }));
  };
  
  const handleSave = () => {
    setProjectId(formData);
    closeProjectIdModal();
    
    // Trigger the actual save after setting the project ID
    setTimeout(() => {
      saveProject();
    }, 100);
  };
  
  const handleCancel = () => {
    setFormData(projectId); // Reset to original values
    closeProjectIdModal();
  };
  
  const isValid = formData.buildingId.trim() !== '' && 
                  formData.architectId.trim() !== '' && 
                  formData.routeId.trim() !== '';
  
  if (!showProjectIdModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Project Identification</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            Please provide project identification details. These will be used to generate the filename when saving.
          </div>
          
          {/* Building ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building size={16} className="text-blue-500" />
              Building ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.buildingId}
              onChange={(e) => handleInputChange('buildingId', e.target.value)}
              placeholder="e.g., MALL_01, OFFICE_TOWER_A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={20}
            />
            <div className="text-xs text-gray-500">
              Unique identifier for the building or complex
            </div>
          </div>
          
          {/* Architect ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User size={16} className="text-green-500" />
              Architect ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.architectId}
              onChange={(e) => handleInputChange('architectId', e.target.value)}
              placeholder="e.g., SMITH_ARCH, DESIGN_STUDIO_01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={20}
            />
            <div className="text-xs text-gray-500">
              Identifier for the architect or design firm
            </div>
          </div>
          
          {/* Route ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Route size={16} className="text-purple-500" />
              Route ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.routeId}
              onChange={(e) => handleInputChange('routeId', e.target.value)}
              placeholder="e.g., MAIN_ENTRANCE, ROUTE_A1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={20}
            />
            <div className="text-xs text-gray-500">
              Identifier for the specific route or path being annotated
            </div>
          </div>
          
          {/* Filename Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800 mb-2">
              Generated Filename:
            </div>
            <div className="font-mono text-sm text-blue-700 bg-white px-3 py-2 rounded border">
              {previewFilename}
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Format: BuildingID_ArchitectID_RouteID_YYYY-MM-DD.json
            </div>
          </div>
          
          {/* Validation Message */}
          {!isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-800">
                All fields are required to generate a proper filename.
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectIdModal;