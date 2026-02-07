import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Node, NodeType, DPCue } from '../../types';
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
    getNodeTypeConfig,
    nodes,
    corridors
  } = useAnnotationStore();

  const [formData, setFormData] = useState<Partial<Node>>({});
  const [activeCueTab, setActiveCueTab] = useState<number>(0);
  const [isSpaceAnnotationOpen, setIsSpaceAnnotationOpen] = useState<boolean>(false);

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
        },
        dp_annotation: { cues: [{}, {}, {}] }
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
    setFormData(prev => {
      const sectionData = (prev[section as keyof typeof prev] as any) || {};
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value
        }
      };
    });
  };

  const updateCueField = (cueIndex: number, field: keyof DPCue, value: any) => {
    setFormData(prev => {
      const dpAnnotation = prev.dp_annotation || {};
      const currentCues = Array.isArray(dpAnnotation.cues) ? [...dpAnnotation.cues] : [{}, {}, {}];

      // Ensure specific cue exists
      if (!currentCues[cueIndex]) currentCues[cueIndex] = {};

      currentCues[cueIndex] = {
        ...currentCues[cueIndex],
        [field]: value
      };

      return {
        ...prev,
        dp_annotation: {
          ...dpAnnotation,
          cues: currentCues
        }
      };
    });
  };

  const getFieldValue = (section: string, field: string) => {
    const sectionData = formData[section as keyof typeof formData] as any;
    return sectionData?.[field];
  };

  const getSelectOptions = (field: any) => {
    if (field.label === 'Target Choice' && currentNode) {
      const connectedIds = new Set<string>();

      corridors.forEach(c => {
        if (c.from === currentNode.id && c.to) connectedIds.add(c.to);
        if (c.to === currentNode.id && c.from) connectedIds.add(c.from);
      });

      return Array.from(connectedIds).map(id => {
        const node = nodes.find(n => n.id === id);
        return {
          value: id,
          label: node ? `${node.id.substring(0, 8)}... (${node.type.split(' (')[1].replace(')', '')})` : id
        };
      });
    }
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
          {applicableSections
            .filter(section => section.title !== 'Basic Information')
            .map(section => {
              // Special handling for Space Annotation (Collapsible)
              if (section.title === 'Space Annotation') {
                return (
                  <div key={section.title} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setIsSpaceAnnotationOpen(!isSpaceAnnotationOpen)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      <h3 className="font-medium text-gray-700">{section.title}</h3>
                      {isSpaceAnnotationOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {isSpaceAnnotationOpen && (
                      <div className="p-4 space-y-4 border-t border-gray-200">
                        {section.fields.map(field => {
                          if (!shouldShowField(field, formData)) return null;
                          const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                          const value = getFieldValue('space_annotation', fieldKey);
                          const onChange = (newValue: any) => updateNestedField('space_annotation', fieldKey, newValue);
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
                    )}
                  </div>
                );
              }

              return (
                <div key={section.title} className="space-y-4">
                  <h3 className="font-medium text-gray-700">{section.title}</h3>

                  {section.fields.map(field => {
                    if (!shouldShowField(field, formData)) return null;

                    let sectionKey = '';
                    // 'Intended Behaviour' and 'Design Cues' both map to dp_annotation in the backend
                    if (section.title === 'Intended Behaviour' || section.title === 'Design Cues') {
                      sectionKey = 'dp_annotation';
                    }
                    else sectionKey = 'behavior_expectation';

                    let fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');

                    // Map keys for Decision Logic section
                    // Map keys for 'Intended Behaviour' and 'Design Cues' sections (both use dp_* keys)
                    if (section.title === 'Intended Behaviour' || section.title === 'Design Cues') {
                      const keyMap: Record<string, string> = {
                        'Target Choice': 'dp_choice',
                        'Decision Confidence': 'dp_confidence',
                        'Decision Behavior': 'dp_behavior',
                        'Decision Behavior Other': 'dp_behavior_other',
                        'DP Rationale': 'dp_rationale',
                        'DP Rationale Other': 'dp_rationale_other',
                        'Decision Affect': 'dp_affect',
                        'Decision Attention AOI': 'dp_attention_aoi'
                      };
                      if (keyMap[field.label]) fieldKey = keyMap[field.label];
                    }

                    let value;
                    let onChange;

                    if (field.label === 'Is this element important in your design?') {
                      value = formData.design_importance || 'neutral';
                      onChange = (newValue: any) => updateFormData('design_importance', newValue);
                    } else if (field.type === 'sketch') {
                      // Handle different sketch targets
                      if (section.title === 'Intended Behaviour' || section.title === 'Design Cues') {
                        value = formData.dp_annotation?.dp_attention_aoi || [];
                        onChange = () => openAttentionModal('dp_annotation');
                      } else {
                        value = formData.behavior_expectation?.attention_zones || [];
                        onChange = () => openAttentionModal('behavior_expectation');
                      }
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
                        onSketchClick={field.type === 'sketch' ? onChange as () => void : undefined}
                      />
                    );
                  })}

                  {/* Cue Tabs for Design Cues */}
                  {section.title === 'Design Cues' && (
                    <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-3">Rationale & Cues</h4>

                      {/* Tabs */}
                      <div className="flex border-b border-gray-300 mb-4">
                        {[0, 1, 2].map(idx => (
                          <button
                            key={idx}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeCueTab === idx
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                              }`}
                            onClick={() => setActiveCueTab(idx)}
                          >
                            Cue {idx + 1}
                          </button>
                        ))}
                      </div>

                      {/* Active Cue Fields */}
                      <div className="space-y-4">
                        <DynamicField
                          field={{
                            label: 'Cue Medium', type: 'multiple',
                            options: [
                              { value: 'geometry', label: 'Geometry (purely morphological signals)' },
                              { value: 'architectural_elements', label: 'Architectural elements (compositional gestures)' },
                              { value: 'spatial_arrangement', label: 'Spatial arrangement (craft the graph/topology)' },
                              { value: 'visibility_vista', label: 'Visibility / vista (framed sight-line)' },
                              { value: 'landmark', label: 'Landmark (focal salient objects)' },
                              { value: 'material', label: 'Material (macro material shifts)' },
                              { value: 'other_objects', label: 'Other objects/furnitures' },
                              { value: 'others', label: 'Others (specify)' },
                              { value: 'not_considered', label: 'Not considered' }
                            ],
                            helpText: 'What cue type is doing the work here?', optional: false, appliesTo: []
                          }}
                          value={formData.dp_annotation?.cues?.[activeCueTab]?.cue_medium || []}
                          onChange={(val) => updateCueField(activeCueTab, 'cue_medium', val)}
                        />
                        {/* Cue Medium Other - Custom Render */}
                        {formData.dp_annotation?.cues?.[activeCueTab]?.cue_medium?.includes('others') && (
                          <DynamicField
                            field={{ label: 'Cue Medium Other', type: 'text', helpText: 'Specify other cue medium', optional: true, appliesTo: [] }}
                            value={formData.dp_annotation?.cues?.[activeCueTab]?.cue_medium_other || ''}
                            onChange={(val) => updateCueField(activeCueTab, 'cue_medium_other', val)}
                          />
                        )}
                        <DynamicField
                          field={{ label: 'Cue Verticality', type: 'boolean', helpText: 'Is this cue cross-floor / vertical?', optional: false, appliesTo: [] }}
                          value={formData.dp_annotation?.cues?.[activeCueTab]?.cue_vertical}
                          onChange={(val) => updateCueField(activeCueTab, 'cue_vertical', val)}
                        />
                        <DynamicField
                          field={{ label: 'Cue Importance', type: 'scale', range: { min: 1, max: 3 }, helpText: 'How important is this cue? (1=Low, 3=High)', optional: true, appliesTo: [] }}
                          value={formData.dp_annotation?.cues?.[activeCueTab]?.cue_importance}
                          onChange={(val) => updateCueField(activeCueTab, 'cue_importance', val)}
                        />
                        <DynamicField
                          field={{ label: 'Cue Confidence', type: 'scale', range: { min: 1, max: 7 }, helpText: 'Confidence that this cue will be perceived/used as intended.', optional: false, appliesTo: [] }}
                          value={formData.dp_annotation?.cues?.[activeCueTab]?.cue_confidence}
                          onChange={(val) => updateCueField(activeCueTab, 'cue_confidence', val)}
                        />
                        <DynamicField
                          field={{ label: 'Cue Explanation', type: 'text', helpText: 'Briefly explain how this cue is expected to guide the user.', optional: true, appliesTo: [] }}
                          value={formData.dp_annotation?.cues?.[activeCueTab]?.cue_explain || ''}
                          onChange={(val) => updateCueField(activeCueTab, 'cue_explain', val)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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