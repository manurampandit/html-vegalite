import { TextStyle, ParseContext, ParsedOutput, TextSegment } from '../../types';
import { TagStrategy } from './tag-strategy.interface';
import { TextHelpers } from '../../helpers/text';

/**
 * Abstract base class implementing common tag strategy functionality
 */
export abstract class BaseTagStrategy implements TagStrategy {
  abstract applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle;
  abstract getTagNames(): string[];
  
  /**
   * Default parse implementation for simple style-only tags.
   * 
   * This implementation:
   * - For closing tags: pops from the style stack
   * - For opening tags: validates attributes, applies styling, and pushes to style stack
   * 
   * Override this method for complex behaviors such as:
   * - Adding line breaks (headings, paragraphs)
   * - Complex validation or parsing logic (hyperlinks)
   * 
   * @param context - The parsing context containing tag information and current state
   * @returns ParsedOutput with segments, style updates, and stack operations
   */
  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, attributes, currentStyle } = context;

    if (isClosingTag) {
      // For closing tags, just pop from style stack
      return {
        newSegments: [],
        updatedStyle: currentStyle, // Will be ignored since we're popping
        pushStyleToStack: false,
        popFromStyleStack: true,
        errors: []
      };
    }

    // For opening tags, validate and apply styling
    const errors: string[] = [];
    if (this.validateAttributes) {
      const validation = this.validateAttributes(attributes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    const newStyle = this.applyStyle(currentStyle, attributes, context.tagName);

    return {
      newSegments: [],
      updatedStyle: newStyle,
      pushStyleToStack: true,
      popFromStyleStack: false,
      errors
    };
  }
  
  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    // Default implementation - no validation
    // TODO will add in further implementations
    return { isValid: true, errors: [] };
  }
  
  public isLineBreak(): boolean {
    // Default implementation - most tags are not line breaks
    return false;
  }

  /**
   * Check if we need a line break before this segment
   */
  protected needsLineBreak(segments: TextSegment[]): boolean {
    return TextHelpers.needsLineBreak(segments);
  }

  /**
   * Check if there's meaningful content after this tag
   */
  protected hasMoreContent(remainingParts: string[], currentIndex: number): boolean {
    return TextHelpers.hasMoreContent(remainingParts, currentIndex);
  }

  /**
   * Method for handling opening tags of block-level elements (headings, paragraphs, lists)
   * 
   * This method:
   * 1. Validates attributes
   * 2. Adds line break before the element if needed
   * 3. Applies styling
   * 
   * @param context - The parsing context
   * @returns ParsedOutput for opening tag
   */
  protected handleBlockLevelOpeningTag(context: ParseContext): ParsedOutput {
    const { attributes, currentStyle, segments } = context;
    const errors: string[] = [];
    const newSegments: TextSegment[] = [];

    // Validate attributes
    if (this.validateAttributes) {
      const validation = this.validateAttributes(attributes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    // Add line break before block element if needed
    if (this.needsLineBreak(segments)) {
      newSegments.push({
        text: '\n',
        ...currentStyle
      });
    }

    const newStyle = this.applyStyle(currentStyle, attributes, context.tagName);

    return {
      newSegments,
      updatedStyle: newStyle,
      pushStyleToStack: true,
      popFromStyleStack: false,
      errors
    };
  }

  /**
   * Method for handling closing tags of block-level elements (headings, paragraphs, lists)
   * 
   * This method:
   * 1. Adds line break after the element if there's more content
   * 2. Returns appropriate ParsedOutput for popping from style stack
   * 
   * @param context - The parsing context
   * @returns ParsedOutput for closing tag
   */
  protected handleBlockLevelClosingTag(context: ParseContext): ParsedOutput {
    const { currentStyle, remainingParts, currentIndex } = context;
    const newSegments: TextSegment[] = [];

    // Add line break after block element if there's more content
    if (this.hasMoreContent(remainingParts, currentIndex)) {
      newSegments.push({
        text: '\n',
        ...currentStyle
      });
    }

    return {
      newSegments,
      updatedStyle: currentStyle, 
      pushStyleToStack: false,
      popFromStyleStack: true,
      errors: []
    };
  }
}
