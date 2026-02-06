import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { JourneyReflection } from '../../types';

const JourneyReflectionModal: React.FC = () => {
  const {
    showJourneyReflectionModal,
    journeyReflection,
    closeJourneyReflectionModal,
    setJourneyReflection,
    saveProject
  } = useAnnotationStore();
  
  const [formData, setFormData] = useState<JourneyReflection>({
    confidence: 3,
    adherence_expectation: 3,
    team_alignment: 3,
    notes: ''
  });
  
  useEffect(() => {
    if (showJourneyReflectionModal) {
      if (journeyReflection) {
        setFormData(journeyReflection);
      } else {
        setFormData({
          confidence: 3,
          adherence_expectation: 3,
          team_alignment: 3,
          notes: ''
        });
      }
    }
  }, [showJourneyReflectionModal, journeyReflection]);
  
  const handleSave = () => {
    setJourneyReflection(formData);
    closeJourneyReflectionModal();
    
    // Trigger the actual save after setting the journey reflection
    setTimeout(() => {
      saveProject();
    }, 100);
  };
  
  const handleCancel = () => {
    closeJourneyReflectionModal();
  };
  
  const isValid = formData.confidence >= 1 && formData.confidence <= 5 &&
                  formData.adherence_expectation >= 1 && formData.adherence_expectation <= 5 &&
                  formData.team_alignment >= 1 && formData.team_alignment <= 5;
  
  const renderLikertScale = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    helpText: string,
    lowLabel: string,
    highLabel: string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="group relative">
          <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs whitespace-normal">
            {helpText}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - 1) / 4) * 100}%, #e5e7eb ${((value - 1) / 4) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>1 ({lowLabel})</span>
          <div className="flex space-x-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i + 1}
                className={`w-2 h-2 rounded-full ${
                  value === i + 1 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span>5 ({highLabel})</span>
        </div>
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">Current: {value}</span>
        </div>
      </div>
    </div>
  );
  
  if (!showJourneyReflectionModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Journey Reflection</h2>
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
            Please reflect on this journey design before saving. This helps capture your design intent and confidence.
          </div>
          
          {/* Confidence */}
          {renderLikertScale(
            'Confidence in this journey',
            formData.confidence,
            (value) => setFormData(prev => ({ ...prev, confidence: value })),
            'How confident are you in the quality of this designed journey?',
            'Very low',
            'Very high'
          )}
          
          {/* Adherence Expectation */}
          {renderLikertScale(
            'Likelihood users will follow as intended',
            formData.adherence_expectation,
            (value) => setFormData(prev => ({ ...prev, adherence_expectation: value })),
            'Do you expect users to move as you intend?',
            'Very unlikely',
            'Very likely'
          )}
          
          {/* Team Alignment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Team consensus vs personal view <span className="text-red-500">*</span>
              </label>
              <div className="group relative">
                <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs whitespace-normal">
                  To what extent does this reflect the design team rather than only you?
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {[
                { value: 1, label: 'Purely personal' },
                { value: 2, label: 'Mostly personal' },
                { value: 3, label: 'Mixed' },
                { value: 4, label: 'Mostly team view' },
                { value: 5, label: 'Team consensus' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="team_alignment"
                    value={option.value}
                    checked={formData.team_alignment === option.value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      team_alignment: parseInt(e.target.value) 
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.value} - {option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes / Rationale
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              rows={4}
              placeholder="Optional notes about this journey design..."
            />
          </div>
          
          {/* Validation Message */}
          {!isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-800">
                Please complete all required fields (1-5 scale).
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
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyReflectionModal;