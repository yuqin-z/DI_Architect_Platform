import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Edge } from '../../types';
import { edgeFormSections, getApplicableFields, shouldShowField } from '../../utils/formConfig';
import DynamicField from '../forms/DynamicField';

const EdgeModal: React.FC = () => {
  const {
    showEdgeModal,
    currentEdge,
    nodes,
    corridors,
    closeEdgeModal,
    addEdge,
    updateEdge
  } = useAnnotationStore();
  
  const [formData, setFormData] = useState<Partial<Edge>>({});
  
  const allElements = [...nodes, ...corridors];
  
  useEffect(() => {
    if (currentEdge) {
      setFormData(currentEdge);
    } else {
      setFormData({
        design_importance: 'neutral',
        decision_properties: {
          importance: 'neutral',
          rationale: [],
          rationale_other: ''
        },
        design_intent: {
          where: '',
          how: [],
          design_cues: {
            cue_medium_how: []
          }
        }
      });
    }
  }, [currentEdge]);
  
  const handleSave = () => {
    if (!formData.id || !formData.from || !formData.to) return;
    
    const edgeData = formData as Edge;
    
    if (currentEdge) {
      updateEdge(currentEdge.id, edgeData);
    } else {
      addEdge(edgeData);
    }
    
    closeEdgeModal();
  };
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const updateDesignIntent = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      design_intent: {
        ...prev.design_intent,
        [field]: value
      }
    }));
  };
  
  const updateDesignCues = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      design_intent: {
        ...prev.design_intent,
        design_cues: {
          ...prev.design_intent?.design_cues,
          [field]: value
        }
      }
    }));
  };
  
  const updateDecisionProperties = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      decision_properties: {
        ...prev.decision_properties,
        [field]: value
      }
    }));
  };
  
  const getFieldValue = (section: string, field: string) => {
    if (section === 'decision_properties') {
      return formData.decision_properties?.[field as keyof typeof formData.decision_properties];
    } else if (section === 'design_cues') {
      return formData.design_intent?.design_cues?.[field as keyof typeof formData.design_intent.design_cues];
    }
    return formData.design_intent?.[field as keyof typeof formData.design_intent];
  };
  
  const getSelectOptions = (field: any) => {
    if (field.label === 'From Node' || field.label === 'To Node') {
      return allElements.map(element => ({
        value: element.id,
        label: element.id
      }));
    }
    if (field.label === 'Cue Target (Where)') {
      return nodes.map(node => ({
        value: node.id,
        label: `${node.id} - ${node.type}`
      }));
    }
    return [];
  };
  
  if (!showEdgeModal) return null;
  
  const applicableSections = getApplicableFields(edgeFormSections, 'Decision Edge');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentEdge ? 'Edit Decision Edge' : 'Create Decision Edge'}
          </h2>
          <button
            onClick={closeEdgeModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edge ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id || ''}
              onChange={(e) => updateFormData('id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., DP1-CS2"
            />
          </div>
          
          {/* Dynamic Form Sections */}
          {applicableSections.map(section => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-medium text-gray-700">{section.title}</h3>
              
              {section.fields.map(field => {
                if (!shouldShowField(field, formData.design_intent?.design_cues || {})) return null;
                
                let value;
                let onChange;
                
                if (field.label === 'From Node') {
                  value = formData.from || '';
                  onChange = (newValue: any) => updateFormData('from', newValue);
                } else if (field.label === 'To Node') {
                  value = formData.to || '';
                  onChange = (newValue: any) => updateFormData('to', newValue);
                } else if (section.title === 'Decision Properties') {
                  if (field.label === 'Importance of this decision?') {
                    value = formData.decision_properties?.importance || 'neutral';
                    onChange = (newValue: any) => updateDecisionProperties('importance', newValue);
                  } else if (field.label === 'Decision rationale (why guide the user this way?)') {
                    value = formData.decision_properties?.rationale || [];
                    onChange = (newValue: any) => updateDecisionProperties('rationale', newValue);
                  } else if (field.label === 'Other rationale (specify)') {
                    value = formData.decision_properties?.rationale_other || '';
                    onChange = (newValue: any) => updateDecisionProperties('rationale_other', newValue);
                  }
                } else if (field.label === 'Cue Medium: How') {
                  value = formData.design_intent?.design_cues?.cue_medium_how || [];
                  onChange = (newValue: any) => {
                    updateDesignCues('cue_medium_how', newValue);
                    // Also update the legacy 'how' field for backward compatibility
                    updateDesignIntent('how', newValue);
                  };
                } else if (section.title === 'Design Cues' && field.label !== 'Cue Medium: How') {
                  const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  value = getFieldValue('design_cues', fieldKey);
                  onChange = (newValue: any) => updateDesignCues(fieldKey, newValue);
                } else {
                  const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  value = getFieldValue('design_intent', fieldKey);
                  onChange = (newValue: any) => updateDesignIntent(fieldKey, newValue);
                }
                
                // Handle conditional field visibility
                if (field.dependsOn === 'decision_rationale') {
                  const rationaleValues = formData.decision_properties?.rationale || [];
                  if (!rationaleValues.includes('other')) {
                    return null;
                  }
                }
                
                return (
                  <DynamicField
                    key={field.label}
                    field={field}
                    value={value}
                    onChange={onChange}
                    options={getSelectOptions(field)}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={closeEdgeModal}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentEdge ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EdgeModal;