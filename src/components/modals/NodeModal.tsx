import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Node, NodeType } from '../../types';
import { nodeFormSections, getApplicableFields, shouldShowField } from '../../utils/formConfig';
import DynamicField from '../forms/DynamicField';

const NodeModal: React.FC = () => {
  const {
    showNodeModal,
    currentNode,
    closeNodeModal,
    addNode,
    updateNode,
    openAttentionModal,
    getNodeTypeConfig
  } = useAnnotationStore();
  
  const [formData, setFormData] = useState<Partial<Node>>({});
  
  const nodeTypes: NodeType[] = [
    'Entrance/Exit (E)',
    'Decision Point (DP)',
    'Decision Zone (DZ)',
    'Vertical Connection (VC)',
    'Activity Destination (AD)',
    'Connecting Segment (CS)'
  ];
  
  useEffect(() => {
    if (currentNode) {
      setFormData(currentNode);
    } else {
      setFormData({
        type: 'Decision Point (DP)',
        shape: 'circle',
        design_importance: 'neutral',
        space_annotation: {},
        behavior_expectation: {
          attention_zones: [],
          behavior: [],
          affect: 'Low arousal / positive valence'
        }
      });
    }
  }, [currentNode]);
  
  const handleSave = () => {
    if (!formData.id || !formData.type || !formData.position) return;
    
    const nodeData = formData as Node;
    
    if (currentNode) {
      updateNode(currentNode.id, nodeData);
    } else {
      addNode(nodeData);
    }
    
    closeNodeModal();
  };
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const updateNestedField = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };
  
  const getFieldValue = (section: string, field: string) => {
    const sectionData = formData[section as keyof typeof formData] as any;
    return sectionData?.[field];
  };
  
  const getSelectOptions = (field: any) => {
    // This would be populated with actual node IDs in a real implementation
    return [];
  };
  
  if (!showNodeModal) return null;
  
  const applicableSections = getApplicableFields(nodeFormSections, formData.type || '');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentNode ? 'Edit Node' : 'Create Node'}
          </h2>
          <button
            onClick={closeNodeModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id || ''}
                  onChange={(e) => updateFormData('id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated"
                  disabled={!!currentNode}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type || ''}
                  onChange={(e) => {
                    const newType = e.target.value as NodeType;
                    const config = getNodeTypeConfig(newType);
                    updateFormData('type', newType);
                    updateFormData('shape', config.shape);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nodeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Visual Preview */}
            {formData.type && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="text-sm text-gray-600 mb-2">Visual Appearance:</div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getNodeTypeConfig(formData.type).color }}
                  >
                    {formData.type.match(/\((\w+)\)/)?.[1]}
                  </div>
                  <div className="text-sm text-gray-700">
                    {getNodeTypeConfig(formData.type).shape} shape • {formData.type}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Dynamic Form Sections */}
          {applicableSections.map(section => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-medium text-gray-700">{section.title}</h3>
              
              {section.fields.map(field => {
                if (!shouldShowField(field, formData)) return null;
                
                const sectionKey = section.title === 'Space Annotation' ? 'space_annotation' : 'behavior_expectation';
                const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                
                let value;
                let onChange;
                
                if (field.label === 'Is this element important in your design?') {
                  value = formData.design_importance || 'neutral';
                  onChange = (newValue: any) => updateFormData('design_importance', newValue);
                } else if (field.type === 'sketch') {
                  value = formData.behavior_expectation?.attention_zones || [];
                  onChange = () => openAttentionModal();
                } else if (field.label === 'Intended Behavior') {
                  value = formData.behavior_expectation?.behavior || [];
                  onChange = (newValue: any) => updateNestedField('behavior_expectation', 'behavior', newValue);
                } else if (field.label === 'Intended Affect (PAD)') {
                  value = formData.behavior_expectation?.affect || '';
                  onChange = (newValue: any) => updateNestedField('behavior_expectation', 'affect', newValue);
                } else {
                  value = getFieldValue(sectionKey, fieldKey);
                  onChange = (newValue: any) => updateNestedField(sectionKey, fieldKey, newValue);
                }
                
                return (
                  <DynamicField
                    key={field.label}
                    field={field}
                    value={value}
                    onChange={onChange}
                    options={getSelectOptions(field)}
                    onSketchClick={field.type === 'sketch' ? openAttentionModal : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={closeNodeModal}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentNode ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeModal;