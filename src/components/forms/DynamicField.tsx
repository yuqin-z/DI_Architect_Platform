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
                    className={`w-2 h-2 rounded-full ${currentValue === i + scaleMin ? 'bg-blue-500' : 'bg-gray-300'
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
        // 10x10 gradient grid for PAD affect model
        const gridSize = 10;

        // Helper to convert hex to RGB
        const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
          } : { r: 0, g: 0, b: 0 };
        };

        // Helper to convert RGB to HSL
        const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h = 0, s = 0;
          const l = (max + min) / 2;

          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
              case g: h = ((b - r) / d + 2) / 6; break;
              case b: h = ((r - g) / d + 4) / 6; break;
            }
          }
          return { h, s, l };
        };

        // Helper to convert HSL to RGB
        const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
          let r, g, b;
          if (s === 0) {
            r = g = b = l;
          } else {
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
          }
          return { r, g, b };
        };

        // Helper to convert RGB to hex
        const rgbToHex = (r: number, g: number, b: number): string => {
          const toHex = (n: number) => {
            const hex = Math.round(n * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          };
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        };

        // Desaturate a hex color by a percentage
        const desaturate = (hex: string, amount: number): string => {
          const rgb = hexToRgb(hex);
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          hsl.s = Math.max(0, hsl.s - amount); // Reduce saturation
          const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
          return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        };

        // Original color lookup table
        const originalColors: string[][] = [
          ['#FF0000', '#FF1C00', '#FF3800', '#FF5500', '#FF7100', '#FF8D00', '#FFAA00', '#FFC600', '#FFE200', '#FFFF00'], // R1
          ['#E2001C', '#E21C19', '#E23816', '#E25512', '#E2710F', '#E28D0C', '#E2AA09', '#E2C606', '#E2E203', '#E2FF00'], // R2
          ['#C60038', '#C61C32', '#C6382C', '#C65525', '#C6711F', '#C68D19', '#C6AA12', '#C6C60C', '#C6E206', '#C6FF00'], // R3
          ['#AA0055', '#AA1C4B', '#AA3842', '#AA5538', '#AA712F', '#AA8D25', '#AAAA1C', '#AAC612', '#AAE209', '#AAFF00'], // R4
          ['#8D0071', '#8D1C64', '#8D3858', '#8D554B', '#8D713E', '#8D8D32', '#8DAA25', '#8DC619', '#8DE20C', '#8DFF00'], // R5
          ['#71008D', '#711C7D', '#71386E', '#71555E', '#71714E', '#718D3E', '#71AA2F', '#71C61F', '#71E20F', '#71FF00'], // R6
          ['#5500AA', '#551C97', '#553884', '#555571', '#55715E', '#558D4B', '#55AA38', '#55C625', '#55E212', '#55FF00'], // R7
          ['#3800C6', '#381CB0', '#38389A', '#385584', '#38716E', '#388D58', '#38AA42', '#38C62C', '#38E216', '#38FF00'], // R8
          ['#1C00E2', '#1C1CC9', '#1C38B0', '#1C5597', '#1C717D', '#1C8D64', '#1CAA4B', '#1CC632', '#1CE219', '#1CFF00'], // R9
          ['#0000FF', '#001CE2', '#0038C6', '#0055AA', '#00718D', '#008D71', '#00AA55', '#00C638', '#00E21C', '#00FF00']  // R10
        ];

        // Apply 20% desaturation to all colors
        const colorTable = originalColors.map(row =>
          row.map(color => desaturate(color, 0.20))
        );

        // Get color from lookup table
        const getGridColor = (row: number, col: number): string => {
          if (row >= 0 && row < 10 && col >= 0 && col < 10) {
            return colorTable[row][col];
          }
          return '#CCCCCC'; // Fallback gray
        };

        // Parse current value to get row and col
        const parseGridValue = (val: string): { row: number; col: number } | null => {
          if (!val) return null;
          const match = val.match(/grid-(\d+)-(\d+)/);
          if (match) {
            return { row: parseInt(match[1]), col: parseInt(match[2]) };
          }
          return null;
        };

        const selectedCell = parseGridValue(value);

        return (
          <div className="flex justify-center w-full py-8">
            <div className="relative pt-10 pb-10 px-24 bg-gray-50/30 rounded-xl border border-gray-100 shadow-inner">
              {/* Grid Wrapper */}
              <div className="relative w-80 h-80">
                {/* Corner Labels */}
                <div className="absolute -top-8 -left-2 text-sm font-bold text-gray-900 bg-white/90 px-2 py-0.5 rounded-md shadow-sm z-10">
                  Stress
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700 whitespace-nowrap bg-white/50 px-2 rounded-full">
                  High Arousal
                </div>
                <div className="absolute -top-8 -right-2 text-sm font-bold text-gray-900 bg-white/90 px-2 py-0.5 rounded-md shadow-sm z-10">
                  Excitement
                </div>

                {/* Side Labels */}
                <div className="absolute top-1/2 -left-24 transform -translate-y-1/2 w-20 text-right text-sm font-bold leading-tight text-gray-900">
                  Unpleasant
                </div>
                <div className="absolute top-1/2 -right-24 transform -translate-y-1/2 w-20 text-left text-sm font-bold leading-tight text-gray-900">
                  Pleasant
                </div>

                {/* Bottom Labels */}
                <div className="absolute -bottom-8 -left-2 text-sm font-bold text-gray-900 bg-white/90 px-2 py-0.5 rounded-md shadow-sm z-10">
                  Depression
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700 whitespace-nowrap bg-white/50 px-2 rounded-full">
                  Sleepiness
                </div>
                <div className="absolute -bottom-8 -right-2 text-sm font-bold text-gray-900 bg-white/90 px-2 py-0.5 rounded-md shadow-sm z-10">
                  Relaxation
                </div>

                {/* 10x10 Grid */}
                <div className="grid grid-cols-10 gap-0 w-full h-full border-2 border-gray-400 overflow-hidden rounded-sm shadow-md relative">
                  {Array.from({ length: gridSize * gridSize }, (_, index) => {
                    const row = Math.floor(index / gridSize);
                    const col = index % gridSize;
                    const cellValue = `grid-${row}-${col}`;
                    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                    const bgColor = getGridColor(row, col);

                    return (
                      <button
                        key={cellValue}
                        onClick={() => onChange(cellValue)}
                        className={`border border-white/30 transition-all duration-150 hover:scale-110 hover:z-20 hover:shadow-lg ${isSelected ? 'ring-4 ring-blue-600 ring-inset z-30 scale-110' : 'z-10'
                          }`}
                        style={{ backgroundColor: bgColor }}
                        title={`Row ${row}, Col ${col}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Selected value display */}
              {selectedCell && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-sm font-black text-blue-600 bg-blue-50 px-4 py-1 rounded-full border border-blue-200 shadow-sm">
                  Selected: Row {selectedCell.row}, Col {selectedCell.col}
                </div>
              )}
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