import { FormSection, FieldConfig } from '../types';

export const nodeFormSections: FormSection[] = [
  {
    title: 'Design Properties',
    fields: [
      {
        label: 'Is this element important in your design?',
        type: 'choice',
        options: [
          { value: 'no', label: 'No' },
          { value: 'neutral', label: 'Neutral' },
          { value: 'yes', label: 'Yes' }
        ],
        helpText: 'Use this to mark elements you care about most; it helps filter less critical items later.',
        optional: false,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD', 'CS']
      }
    ]
  },
  {
    title: 'User Behavior Expectations',
    fields: [
      {
        label: 'Primary Intended Attention AOI',
        type: 'sketch',
        helpText: 'Spatial area(s) intended to attract user attention',
        optional: true,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD', 'CS']
      },
      {
        label: 'Intended Behavior',
        type: 'multiple',
        options: [
          'WD: walk directly (high certainty)',
          'HP: hesitate/pause (uncertainty, minor re-orientation, <3s)',
          'SS: stop & search (uncertainty, active search for cues, >3s)',
          'SA: seek external aid (seek for help)',
          'AL: approach feature/landmark (orienting towards salient cue)',
          'EX: explore/wander (leisure browsing, relaxed)',
          'BT: back-track (realises wrong actions, reversal of route)'
        ],
        helpText: 'Anticipated behavior triggered by this space',
        optional: false,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD', 'CS']
      },
      {
        label: 'Intended Affect (PAD)',
        type: 'grid',
        options: [
          { value: 'High arousal / positive valence', label: 'Excited' },
          { value: 'High arousal / negative valence', label: 'Stressed' },
          { value: 'Low arousal / positive valence', label: 'Relaxed' },
          { value: 'Low arousal / negative valence', label: 'Bored' }
        ],
        helpText: 'Affective state intended for the user at this location',
        optional: false,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD', 'CS']
      }
    ]
  },
  {
    title: 'Space Annotation',
    fields: [
      {
        label: 'Ceiling Height',
        type: 'number',
        helpText: 'Height of space in meters',
        optional: true,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD', 'CS']
      },
      {
        label: 'Width',
        type: 'number',
        helpText: 'Estimated horizontal width of space or corridor',
        optional: true,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD', 'CS']
      },
      {
        label: 'Area',
        type: 'number',
        helpText: 'Floor area of the spatial node in m²',
        optional: true,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD']
      },
      {
        label: 'Number of Connections',
        type: 'number',
        helpText: 'Number of spatial routes leading to/from this point',
        optional: false,
        appliesTo: ['DP', 'DZ']
      }
    ]
  }
];

export const corridorFormSections: FormSection[] = [
  {
    title: 'Design Properties',
    fields: [
      {
        label: 'Is this element important in your design?',
        type: 'choice',
        options: [
          { value: 'no', label: 'No' },
          { value: 'neutral', label: 'Neutral' },
          { value: 'yes', label: 'Yes' }
        ],
        helpText: 'Use this to mark elements you care about most; it helps filter less critical items later.',
        optional: false,
        appliesTo: ['CS']
      }
    ]
  },
  {
    title: 'Basic Information',
    fields: [
      {
        label: 'From Node',
        type: 'select',
        helpText: 'Starting node for this connecting segment',
        optional: true,
        appliesTo: ['CS']
      },
      {
        label: 'To Node',
        type: 'select',
        helpText: 'Ending node for this connecting segment',
        optional: true,
        appliesTo: ['CS']
      }
    ]
  },
  {
    title: 'User Behavior Expectations',
    fields: [
      {
        label: 'Primary Intended Attention AOI',
        type: 'sketch',
        helpText: 'Spatial area(s) intended to attract user attention',
        optional: true,
        appliesTo: ['CS']
      },
      {
        label: 'Intended Behavior',
        type: 'multiple',
        options: [
          'WD: walk directly (high certainty)',
          'HP: hesitate/pause (uncertainty, minor re-orientation, <3s)',
          'SS: stop & search (uncertainty, active search for cues, >3s)',
          'SA: seek external aid (seek for help)',
          'AL: approach feature/landmark (orienting towards salient cue)',
          'EX: explore/wander (leisure browsing, relaxed)',
          'BT: back-track (realises wrong actions, reversal of route)'
        ],
        helpText: 'Anticipated behavior triggered by this space',
        optional: false,
        appliesTo: ['CS']
      },
      {
        label: 'Intended Affect (PAD)',
        type: 'grid',
        options: [
          { value: 'High arousal / positive valence', label: 'Excited' },
          { value: 'High arousal / negative valence', label: 'Stressed' },
          { value: 'Low arousal / positive valence', label: 'Relaxed' },
          { value: 'Low arousal / negative valence', label: 'Bored' }
        ],
        helpText: 'Affective state intended for the user at this location',
        optional: false,
        appliesTo: ['CS']
      }
    ]
  },
  {
    title: 'Space Annotation',
    fields: [
      {
        label: 'Height',
        type: 'number',
        helpText: 'Height of corridor in meters',
        optional: true,
        appliesTo: ['CS']
      },
      {
        label: 'Width',
        type: 'number',
        helpText: 'Width of corridor in meters',
        optional: true,
        appliesTo: ['CS']
      }
    ]
  }
];

export const edgeFormSections: FormSection[] = [
  {
    title: 'Edge Properties',
    fields: [
      {
        label: 'From Node',
        type: 'select',
        helpText: 'Starting node for this decision transition',
        optional: false,
        appliesTo: ['Decision Edge']
      },
      {
        label: 'To Node',
        type: 'select',
        helpText: 'Ending node for this decision transition',
        optional: false,
        appliesTo: ['Decision Edge']
      }
    ]
  },
  {
    title: 'Decision Properties',
    fields: [
      {
        label: 'Importance of this decision?',
        type: 'choice',
        options: [
          { value: 'no', label: 'No' },
          { value: 'neutral', label: 'Neutral' },
          { value: 'yes', label: 'Yes' }
        ],
        helpText: 'How important is this decision point in the overall journey?',
        optional: false,
        appliesTo: ['Decision Edge']
      },
      {
        label: 'Decision rationale (why guide the user this way?)',
        type: 'multiple',
        options: [
          { value: 'shortest_path', label: 'Shortest path' },
          { value: 'wayfinding_clarity', label: 'Wayfinding clarity' },
          { value: 'avoid_congestion', label: 'Avoid congestion' },
          { value: 'safety_comfort', label: 'Safety/comfort' },
          { value: 'enjoyable_journey', label: 'Enjoyable journey' },
          { value: 'commercial_exposure', label: 'Commercial exposure' },
          { value: 'program_adjacency', label: 'Program adjacency' },
          { value: 'encourage_exploration', label: 'Encourage exploration' },
          { value: 'accessibility', label: 'Accessibility' },
          { value: 'other', label: 'Other...' }
        ],
        helpText: 'Select all reasons that apply for guiding users in this direction.',
        optional: true,
        appliesTo: ['Decision Edge']
      },
      {
        label: 'Other rationale (specify)',
        type: 'text',
        helpText: 'Specify other rationale if selected above.',
        optional: true,
        appliesTo: ['Decision Edge'],
        dependsOn: 'decision_rationale'
      }
    ]
  },
  {
    title: 'Design Cues',
    fields: [
      {
        label: 'Cue Medium: How',
        type: 'multiple',
        options: [
          { value: 'geometry', label: 'Geometry' },
          { value: 'architectural_elements', label: 'Architectural elements' },
          { value: 'spatial_arrangement', label: 'Spatial arrangement' },
          { value: 'visibility_vista', label: 'Visibility / Vista' },
          { value: 'landmark', label: 'Landmark' },
          { value: 'material', label: 'Material' },
          { value: 'other_objects_furnishings', label: 'Other objects / Furnishings' },
          { value: 'signage', label: 'Signage' },
          { value: 'landscape', label: 'Landscape' },
          { value: 'intangible_elements', label: 'Intangible elements' },
          { value: 'none', label: 'None' }
        ],
        helpText: 'Categories of design strategies applied in this decision',
        optional: false,
        appliesTo: ['Decision Edge']
      },
      {
        label: 'Verticality',
        type: 'boolean',
        helpText: 'Indicates if the cue spans vertically across floors',
        optional: true,
        appliesTo: ['Decision Edge'],
        dependsOn: 'cue_medium_how'
      },
      {
        label: 'Importance',
        type: 'scale',
        range: { min: 1, max: 5 },
        helpText: 'Designer-perceived importance of this cue (1=Low, 5=High)',
        optional: true,
        appliesTo: ['Decision Edge'],
        dependsOn: 'cue_medium_how'
      },
      {
        label: 'Explanation',
        type: 'text',
        helpText: 'Explanation of the cue or its rationale',
        optional: true,
        appliesTo: ['Decision Edge'],
        dependsOn: 'cue_medium_how'
      },
      {
        label: 'Confidence',
        type: 'scale',
        range: { min: 1, max: 5 },
        helpText: 'Designer confidence in user reacting as intended (1=Low, 5=High)',
        optional: true,
        appliesTo: ['Decision Edge'],
        dependsOn: 'cue_medium_how'
      },
      {
        label: 'Cue Target (Where)',
        type: 'select',
        helpText: 'Target location where this cue is directed',
        optional: true,
        appliesTo: ['Decision Edge'],
        dependsOn: 'cue_medium_how'
      }
    ]
  }
];

export const getApplicableFields = (sections: FormSection[], nodeType: string): FormSection[] => {
  const typeCode = nodeType.match(/\((\w+)\)/)?.[1] || nodeType;
  
  return sections.map(section => ({
    ...section,
    fields: section.fields.filter(field => 
      field.appliesTo.includes(typeCode) || field.appliesTo.includes('Decision Edge')
    )
  })).filter(section => section.fields.length > 0);
};

export const shouldShowField = (field: FieldConfig, formData: any): boolean => {
  if (!field.dependsOn) return true;
  
  const dependentValue = formData[field.dependsOn];
  return dependentValue && (Array.isArray(dependentValue) ? dependentValue.length > 0 : true);
};