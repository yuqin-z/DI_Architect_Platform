import React from 'react';
import { HelpCircle, Pencil, ArrowLeftRight } from 'lucide-react';
import { FieldConfig } from '../../types';

interface DynamicFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  options?: { value: string; label: string }[];
  onSketchClick?: () => void;
  onReverseClick?: () => void;
}

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  options = [],
  onSketchClick,
  onReverseClick
}) => {
  // Define tooltips for design cue options
  const designCueTooltips: Record<string, string> = {
    'geometry': 'Purely morphological signals, change of shape – e.g., corridor widening, ceiling drop.',
    'architectural_elements': 'Compositional gestures beyond simple geometry – e.g., curvature, helical stair, diagonal cut.',
    'spatial_arrangement': 'Topology crafted to steer flow – e.g., intentional cul-de-sac, high-choice hub.',
    'visibility_vista': 'Framed sight-lines to control what is seen – e.g., view to atrium, framed view to landmark.',
    'landmark': 'Focal salient object acting as attention anchor – e.g., iconic statue, courtyard.',
    'material': 'Macro material shifts – e.g., transparent glass walls, colour change.',
    'other_objects_furnishings': 'Deliberate placement of objects/furniture to guide flow.',
    'signage': 'Sign systems and symbols – e.g., directional, regulatory, informational.',
    'landscape': 'Green/blue elements shaping experience – e.g., planters, trees, water features.',
    'intangible_elements': 'Environmental qualities – e.g., lighting, smell, temperature, sound.',
    'none': 'No deliberate cue here.'
  };
  
  // Define tooltips for decision rationale options
  const rationaleTooltips: Record<string, string> = {
    'shortest_path': 'Minimise distance/time.',
    'wayfinding_clarity': 'Simpler, fewer turns; easier to understand.',
    'avoid_congestion': 'Bypass crowded areas/queues.',
    'safety_comfort': 'Better lighting, less noise, wider corridor, perceived safety.',
    'enjoyable_journey': 'Pleasant route; views/ambience.',
    'commercial_exposure': 'Pass by shops/promotions.',
    'program_adjacency': 'Keep near related destinations/amenities.',
    'encourage_exploration': 'Invite discovery of areas.',
    'accessibility': 'Step-free/low effort for mobility needs.'
  };
  
  const renderField = () => {
    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            step={field.range ? 0.1 : 1}
            min={field.range?.min}
            max={field.range?.max}
          />
        );

      case 'text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            rows={3}
            placeholder="Enter detailed explanation..."
          />
        );

      case 'select':
        return (
          <div className="flex items-center gap-2">
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select option</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {onReverseClick && (
              <button
                type="button"
                onClick={onReverseClick}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                title="Reverse From/To"
              >
                <ArrowLeftRight size={16} />
              </button>
            )}
          </div>
        );

      case 'multiple':
        const currentValues = Array.isArray(value) ? value : [];
        const fieldOptions = field.options || options;
        
        // Special handling for design cues with "None" exclusivity
        const isDesignCues = field.label === 'Cue Medium: How';
        const hasNone = currentValues.includes('none');
        
        return (
          <div className="space-y-2">
            {fieldOptions.map(option => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const tooltip = designCueTooltips[optionValue] || rationaleTooltips[optionValue];
              
              // For design cues: disable other options if "None" is selected, disable "None" if others are selected
              const isDisabled = isDesignCues && (
                (optionValue === 'none' && currentValues.some(v => v !== 'none')) ||
                (optionValue !== 'none' && hasNone)
              );
              
              return (
                <label key={optionValue} className="flex items-start group">
                  <input
                    type="checkbox"
                    checked={currentValues.includes(optionValue)}
                    disabled={isDisabled}
                    onChange={(e) => {
                      if (isDesignCues) {
                        if (optionValue === 'none') {
                          // If selecting "None", clear all other selections
                          onChange(['none']);
                        } else {
                          // If selecting any other option, remove "None" and add this option
                          const newValues = currentValues.filter(v => v !== 'none');
                          if (e.target.checked) {
                            onChange([...newValues, optionValue]);
                          } else {
                            onChange(newValues.filter(v => v !== optionValue));
                          }
                        }
                      } else {
                        // Normal multi-select behavior
                        if (e.target.checked) {
                          onChange([...currentValues, optionValue]);
                        } else {
                          onChange(currentValues.filter((v: string) => v !== optionValue));
                        }
                      }
                    }}
                    className={`mr-2 mt-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <span className={`text-sm flex-1 ${isDisabled ? 'opacity-50' : ''}`}>{optionLabel}</span>
                  {tooltip && (
                    <div className="relative ml-2">
                      <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help mt-1" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs whitespace-normal">
                        {tooltip}
                        <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Cross-floor (spans multiple levels)</span>
          </label>
        );

      case 'scale':
        const scaleMin = field.range?.min || 1;
        const scaleMax = field.range?.max || 5;
        const currentValue = value || scaleMin;
        
        return (
          <div className="space-y-3">
            <input
              type="range"
              min={scaleMin}
              max={scaleMax}
              value={currentValue}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentValue - scaleMin) / (scaleMax - scaleMin)) * 100}%, #e5e7eb ${((currentValue - scaleMin) / (scaleMax - scaleMin)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{scaleMin} (Low)</span>
              <div className="flex space-x-2">
                {Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => (
                  <div
                    key={i + scaleMin}
                    className={`w-2 h-2 rounded-full ${
                      currentValue === i + scaleMin ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span>{scaleMax} (High)</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-gray-700">Current: {currentValue}</span>
            </div>
          </div>
        );

      case 'choice':
        const choiceOptions = field.options || [];
        return (
          <div className="space-y-2">
            {choiceOptions.map(option => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <label key={optionValue} className="flex items-center">
                  <input
                    type="radio"
                    name={field.label}
                    value={optionValue}
                    checked={value === optionValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{optionLabel}</span>
                </label>
              );
            })}
          </div>
        );

      case 'sketch':
        return (
          <div className="space-y-2">
            <button
              onClick={onSketchClick}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Pencil size={16} />
              Sketch Areas ({Array.isArray(value) ? value.length : 0} zones)
            </button>
            <div className="text-xs text-gray-500">
              Click to draw up to 3 attention zones on the spatial plan
            </div>
          </div>
        );

      case 'grid':
        const gridOptions = field.options || [];
        const colors = ['bg-green-200', 'bg-red-200', 'bg-blue-200', 'bg-gray-200'];
        
        return (
          <div className="relative">
            {/* Axes Labels */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              High Arousal
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              Low Arousal
            </div>
            <div className="absolute top-1/2 -left-16 transform -translate-y-1/2 -rotate-90 text-xs text-gray-500">
              Negative
            </div>
            <div className="absolute top-1/2 -right-16 transform -translate-y-1/2 rotate-90 text-xs text-gray-500">
              Positive
            </div>
            
            {/* Grid */}
            <div className="grid grid-cols-2 gap-1 w-48 h-48 mx-auto border border-gray-300">
              {gridOptions.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isSelected = value === optionValue;
                
                return (
                  <button
                    key={optionValue}
                    onClick={() => onChange(optionValue)}
                    className={`${colors[index]} border border-gray-300 p-4 text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-opacity-50 scale-105'
                        : 'hover:scale-105'
                    }`}
                    title={optionValue}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{optionLabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {!field.optional && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="group relative">
          <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs whitespace-normal">
            {field.helpText}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
      {renderField()}
    </div>
  );
};

export default DynamicField;