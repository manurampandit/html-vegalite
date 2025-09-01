import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';
import { headingSizes } from '../../constants';

/**
 * Strategy for heading tags: <h1>, <h2>, <h3>, <h4>, <h5>, <h6>
 */
export class HeadingTagStrategy extends BaseTagStrategy {

  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Extract tag name from the attributes or context
    const fontSize = tagName ? headingSizes[tagName.toLowerCase()] || 16 : (currentStyle.fontSize || 16);
    
    return {
      ...currentStyle,
      fontWeight: 'bold',
      fontSize: fontSize
    };
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, attributes, currentStyle, segments, remainingParts, currentIndex } = context;
    
    if (isClosingTag) {
      // For closing heading tags, add line break if there's more content
      const newSegments: typeof segments = [];
      
      if (this.hasMoreContent(remainingParts, currentIndex)) {
        newSegments.push({
          text: '\n',
          ...currentStyle
        });
      }

      return {
        newSegments,
        updatedStyle: currentStyle, // Will be ignored since we're popping
        pushStyleToStack: false,
        popFromStyleStack: true,
        errors: []
      };
    }

    // For opening tags, validate and add line break if needed
    const errors: string[] = [];
    if (this.validateAttributes) {
      const validation = this.validateAttributes(attributes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    const newSegments: typeof segments = [];
    
    // Add line break before heading if needed
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

  public getTagNames(): string[] {
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  }

  /**
   * Heading tags should create line breaks for proper formatting
   */
  public isLineBreak(): boolean {
    return true;
  }

  /**
   * Get font size for a specific heading level
   */
  public getFontSize(tagName: string): number {
    return headingSizes[tagName.toLowerCase()] || 16;
  }
}
