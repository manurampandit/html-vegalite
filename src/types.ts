/**
 * Text styling properties
 */
export interface TextStyle {
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  textDecoration?: 'none' | 'underline' | 'line-through';
  fontSize?: number;
  verticalOffset?: number; // Negative for superscript, positive for subscript
  // List context properties
  isListItem?: boolean;
  listNestingLevel?: number;
  listType?: 'ul' | 'ol';
}

/**
 * Text segment with content and styling
 */
export interface TextSegment extends TextStyle {
  text: string;
  /** Whether this segment should have a space after it (based on original HTML) */
  hasSpaceAfter?: boolean;
  /** The type of spacing context for this segment */
  spacingContext?: 'tag-to-tag' | 'text-to-tag' | 'tag-to-text' | 'text-to-text' | 'list-prefix';
}

/**
 * Positioned text segment with coordinates and dimensions
 */
export interface PositionedTextSegment extends TextSegment {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Configuration options for HTML to Vega-Lite conversion
 */
export interface HTMLToVegaLiteOptions {
  /** Font size in pixels */
  fontSize?: number;
  /** Font family string */
  fontFamily?: string;
  /** Starting X coordinate */
  startX?: number;
  /** Starting Y coordinate */
  startY?: number;
  /** Line height multiplier */
  lineHeight?: number | undefined;
  /** Maximum width before wrapping */
  maxWidth?: number;
  /** Background color */
  background?: string;
}

/**
 * Text measurement result
 */
export interface TextMeasurement {
  width: number;
  height: number;
}

/**
 * Vega-Lite layer data for text
 */
export interface VegaLiteLayerData {
  id: number;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Vega-Lite layer data for lines (decoration)
 */
export interface VegaLiteLineData {
  id: number;
  x: number;
  x2: number;
  y: number;
}

/**
 * Text mark specification
 */
export interface VegaLiteTextMark {
  type: 'text';
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
}

/**
 * Rule mark specification for lines
 */
export interface VegaLiteRuleMark {
  type: 'rule';
  color?: string;
  strokeWidth?: number;
}

/**
 * Encoding for text elements
 */
export interface VegaLiteTextEncoding {
  x: {
    field: 'x';
    type: 'quantitative';
    axis: null;
    scale: null | { domain: number[] };
  };
  y: {
    field: 'y';
    type: 'quantitative';
    axis: null;
    scale: null | { domain: number[] };
  };
  text: {
    field: 'text';
    type: 'nominal';
  };
}

/**
 * Encoding for line/rule elements
 */
export interface VegaLiteRuleEncoding {
  x: {
    field: 'x';
    type: 'quantitative';
    axis: null;
    scale: { domain: [number, number] };
  };
  x2: {
    field: 'x2';
    type: 'quantitative';
  };
  y: {
    field: 'y';
    type: 'quantitative';
    axis: null;
    scale: { domain: [number, number] };
  };
}

/**
 * Vega-Lite encoding configuration
 */
export interface VegaLiteEncoding {
  x: {
    field: string;
    type: 'quantitative';
    axis: null;
    scale: null | { domain: number[] };
  };
  y: {
    field: string;
    type: 'quantitative';
    axis: null;
    scale: null | { domain: number[] };
  };
  text: {
    field: string;
    type: 'nominal';
  };
}

/**
 * Vega-Lite layer specification
 */
export interface VegaLiteLayer {
  data: { values: VegaLiteLayerData[] };
  mark: VegaLiteTextMark;
  encoding: VegaLiteEncoding;
}

/**
 * Complete Vega-Lite specification
 */
export interface VegaLiteSpec {
  $schema: string;
  width: number;
  height: number;
  background?: string;
  padding?: number;
  autosize?: string;
  config?: {
    view?: { stroke?: null | string };
  };
  resolve?: {
    scale?: { x?: string; y?: string };
  };
  layer: any[]; // Allow both text and rule layers
}

/**
 * Style group for layered composition
 */
export interface StyleGroup {
  style: TextStyle;
  data: VegaLiteLayerData[];
}

/**
 * Supported HTML tags
 */
export type SupportedHTMLTag = 'b' | 'strong' | 'i' | 'em' | 'u' | 'span';

/**
 * Parse result from HTML parser
 */
export interface ParseResult {
  segments: TextSegment[];
  errors?: string[];
}

/**
 * Context information passed to tag strategies during parsing
 */
export interface ParseContext {
  /** Current text style */
  currentStyle: TextStyle;
  /** Style stack for nested tags */
  styleStack: TextStyle[];
  /** Segments parsed so far */
  segments: TextSegment[];
  /** Tag attributes string */
  attributes: string;
  /** Tag name */
  tagName: string;
  /** Whether this is a closing tag */
  isClosingTag: boolean;
  /** Remaining content parts after this tag */
  remainingParts: string[];
  /** Current index in parts array */
  currentIndex: number;
}

/**
 * Output from tag strategy parsing
 */
export interface ParsedOutput {
  /** New segments to add */
  newSegments: TextSegment[];
  /** Updated style for style stack */
  updatedStyle: TextStyle;
  /** Whether to push this style onto the stack */
  pushStyleToStack: boolean;
  /** Whether to pop from style stack (for closing tags) */
  popFromStyleStack: boolean;
  /** Any validation errors */
  errors: string[];
}