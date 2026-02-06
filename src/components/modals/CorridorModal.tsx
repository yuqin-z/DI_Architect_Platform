import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Corridor } from '../../types';
import { corridorFormSections, getApplicableFields, shouldShowField } from '../../utils/formConfig';
import DynamicField from '../forms/DynamicField';

const CorridorModal: React.FC = () => {
  const {
    showCorridorModal,
    currentCorridor,
    nodes,
    closeCorridorModal,
    addCorridor,
    updateCorridor,
    generateId,
    openAttentionModal
  } = useAnnotationStore();
  
  const [formData, setFormData] = useState<Partial<Corridor>>({});
  
  useEffect(() => {
    if (currentCorridor) {
      setFormData(currentCorridor);
    } else {
      setFormData({
        id: generateId('CS'),
        path: [],
        design_importance: 'neutral',
        space_annotation: {},
        behavior_expectation: {
          attention_zones: [],
          behavior: [],
          affect: 'Low arousal / positive valence'
        }
      });
    }
  }, [currentCorridor, generateId]);
  
  const handleSave = () => {
    if (!formData.id || !formData.path) return;
    
    const corridorData = formData as Corridor;
    
    if (currentCorridor) {
      updateCorridor(currentCorridor.id, corridorData);
    } else {
      addCorridor(corridorData);
    }
    
    closeCorridorModal();
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
    if (field.label === 'From Node' || field.label === 'To Node') {
      return nodes.map(node => ({
        value: node.id,
        label: node.id
      }));
    }
    return [];
  };
  
  const handleReverseFromTo = () => {
    const currentFrom = formData.from;
    const currentTo = formData.to;
    
    setFormData(prev => ({
      ...prev,
      from: currentTo,
      to: currentFrom
    }));
  };
  
  if (!showCorridorModal) return null;
  
  const applicableSections = getApplicableFields(corridorFormSections, 'CS');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentCorridor ? 'Edit Connecting Segment' : 'Create Connecting Segment'}
          </h2>
          <button
            onClick={closeCorridorModal}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={(e) => updateFormData('id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!currentCorridor}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Path Points
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="text-sm text-gray-600">
                  {formData.path?.length || 0} points defined
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Path points are set when drawing the corridor on the canvas
                </div>
              </div>
            </div>
          </div>
          
          {/* Dynamic Form Sections */}
          {applicableSections.map(section => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-medium text-gray-700">{section.title}</h3>
              
              {section.fields.map(field => {
                if (!shouldShowField(field, formData)) return null;
                
                let value;
                let onChange;
                let onReverseClick;
                
                if (field.label === 'From Node') {
                  value = formData.from || '';
                  onChange = (newValue: any) => updateFormData('from', newValue);
                  onReverseClick = handleReverseFromTo;
                } else if (field.label === 'To Node') {
                  value = formData.to || '';
                  onChange = (newValue: any) => updateFormData('to', newValue);
                } else if (field.label === 'Is this element important in your design?') {
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
                } else if (section.title === 'Space Annotation') {
                  const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  value = getFieldValue('space_annotation', fieldKey);
                  onChange = (newValue: any) => updateNestedField('space_annotation', fieldKey, newValue);
                } else {
                  const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  value = getFieldValue('behavior_expectation', fieldKey);
                  onChange = (newValue: any) => updateNestedField('behavior_expectation', fieldKey, newValue);
                }
                
                return (
                  <DynamicField
                    key={field.label}
                    field={field}
                    value={value}
                    onChange={onChange}
                    options={getSelectOptions(field)}
                    onSketchClick={field.type === 'sketch' ? openAttentionModal : undefined}
                    onReverseClick={field.label === 'From Node' ? onReverseClick : undefined}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Connection Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <div className="font-semibold mb-1">Connection Status:</div>
              <div className="text-xs">
                {formData.from && formData.to ? (
                  <span className="text-green-600">✓ Connected: {formData.from} → {formData.to}</span>
                ) : (
                  <span className="text-orange-600">⚠ Incomplete connection</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={closeCorridorModal}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentCorridor ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorridorModal;