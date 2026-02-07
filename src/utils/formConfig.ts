import { FormSection, FieldConfig } from '../types';

export const nodeFormSections: FormSection[] = [
  {
    title: 'Basic Information',
    fields: [
      {
        label: 'ID',
        type: 'text',
        helpText: 'Unique identifier for the node',
        optional: false,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD']
      },
      {
        label: 'Type',
        type: 'select',
        helpText: 'Type of the node',
        optional: false,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD']
      }
    ]
  },
  {
    title: 'Intended Behaviour',
    fields: [
      {
        label: 'Target Choice',
        type: 'select',
        helpText: 'The connecting node that represents the correct content',
        optional: true,
        appliesTo: ['DP']
      },
      {
        label: 'Decision Confidence',
        type: 'scale',
        range: { min: 1, max: 7 },
        helpText: 'Expected confidence in making this decision (1=Low, 7=High)',
        optional: false,
        appliesTo: ['DP']
      },
      {
        label: 'Decision Behavior',
        type: 'choice',
        options: [
          { value: 'WD', label: 'WD: walk directly' },
          { value: 'HP', label: 'HP: hesitate-pause' },
          { value: 'SS', label: 'SS: stop & search' },
          { value: 'SA', label: 'SA: seek external aid' },
          { value: 'AL', label: 'AL: approach landmark' },
          { value: 'EX', label: 'EX: explore-wander' },
          { value: 'Others', label: 'Others (Specify)' }
        ],
        helpText: 'What do you intend the user to do here (behavioural state)?',
        optional: false,
        appliesTo: ['DP']
      },
      {
        label: 'Decision Behavior Other',
        type: 'text',
        helpText: 'Specify other behavior',
        optional: true,
        appliesTo: ['DP'],
        dependsOn: 'decision_behavior'
      },
      {
        label: 'DP Rationale',
        type: 'multiple',
        options: [
          { value: 'shortest_path', label: 'Shortest path: Minimise distance/time' },
          { value: 'wayfinding_clarity', label: 'Wayfinding clarity: Simpler, fewer turns' },
          { value: 'avoid_congestion', label: 'Avoid congestion: Bypass crowded areas' },
          { value: 'safety_comfort', label: 'Safety/comfort: Better lighting, less noise' },
          { value: 'enjoyable_journey', label: 'Enjoyable journey: Pleasant route/views' },
          { value: 'commercial_exposure', label: 'Commercial exposure: Pass by shops' },
          { value: 'program_adjacency', label: 'Program adjacency: Keep near related amenities' },
          { value: 'encourage_exploration', label: 'Encourage exploration: Invite discovery' },
          { value: 'accessibility', label: 'Accessibility: Step-free/low effort' },
          { value: 'other', label: 'Other...' }
        ],
        helpText: 'Why do you think users will go this way?',
        optional: false,
        appliesTo: ['DP']
      },
      {
        label: 'DP Rationale Other',
        type: 'text',
        helpText: 'Specify other rationale',
        optional: true,
        appliesTo: ['DP'],
        dependsOn: 'dp_rationale' // Note: Logic handled in component to check for 'other' value
      },
      {
        label: 'Decision Affect',
        type: 'grid',
        options: [
          { value: 'High arousal / positive valence', label: 'Excited' },
          { value: 'High arousal / negative valence', label: 'Stressed' },
          { value: 'Low arousal / positive valence', label: 'Relaxed' },
          { value: 'Low arousal / negative valence', label: 'Depressed' }
        ],
        helpText: 'Intended affect at this location.',
        optional: false,
        appliesTo: ['DP']
      }
    ]
  },
  {
    title: 'Design Cues',
    fields: [
      {
        label: 'Decision Attention AOI',
        type: 'sketch',
        helpText: 'What should the user primarily notice here? (max 3 AOIs)',
        optional: false,
        appliesTo: ['DP']
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
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD']
      },
      {
        label: 'Width',
        type: 'number',
        helpText: 'Estimated horizontal width of space or corridor',
        optional: true,
        appliesTo: ['E', 'DP', 'DZ', 'VC', 'AD']
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
    title: 'Connecting Segment Notes',
    fields: [
      {
        label: 'Notes',
        type: 'text',
        helpText: 'Put any notes on this connecting segment here.',
        optional: true,
        appliesTo: ['CS']
      }
    ]
  }
];

// Removed edgeFormSections as per request

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