export const headingSizes: Record<string, number> = {
  h1: 32,
  h2: 24,
  h3: 18.72,
  h4: 16,
  h5: 13.28,
  h6: 10.72,
};

export const inverseHeadingSizes: Record<string, string> = {
  '32': 'h1',
  '24': 'h2',
  '18.72': 'h3',
  '16': 'h4',
  '13.28': 'h5',
  '10.72': 'h6',
};

export const colorMap: Record<string, string> = {
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'black': "#000000"
    // TODO Add more colors as needed
  };



// Font style/weight/decoration constants
export const FONT_WEIGHT = {
  NORMAL: 'normal' as const,
  BOLD: 'bold' as const
};

export const FONT_STYLE = {
  NORMAL: 'normal' as const,
  ITALIC: 'italic' as const,
  OBLIQUE: 'oblique' as const
};

export const TEXT_DECORATION = {
  NONE: 'none' as const,
  UNDERLINE: 'underline' as const,
  LINE_THROUGH: 'line-through' as const
};

// Tag parsing types
export const TAG_TYPES = {
  CLOSING_TAG: 'closing',
  OPENING_TAG: 'opening',
  TEXT_CONTENT: 'text'
} as const;

export type TagType = typeof TAG_TYPES[keyof typeof TAG_TYPES];

// List-related constants
export const LIST_TAGS = {
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  LIST_ITEM: 'li'
} as const;

export const LIST_PREFIXES = {
  BULLET: '• ',
  NUMBER_SUFFIX: '. '
} as const;

export const DEFAULT_COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF'
} as const;

// CSS validation constants
export const VALID_FONT_WEIGHTS = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;
export const VALID_FONT_STYLES = ['normal', 'italic', 'oblique'] as const;
export const VALID_TEXT_DECORATIONS = ['none', 'underline', 'line-through'] as const;