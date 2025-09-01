import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for paragraph tags: <p>
 */
export class ParagraphTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Paragraphs typically maintain current styling but could add spacing
    // For now, we'll just return the current style unchanged
    return {
      ...currentStyle
      // We may further add margin/padding properties if needed
      // marginTop: '1em',
      // marginBottom: '1em'
    };
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, attributes, currentStyle, segments, remainingParts, currentIndex } = context;
    
    if (isClosingTag) {
      // For closing paragraph tags, add line break if there's more content
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
    
    // Add line break before paragraph if needed
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
    return ['p'];
  }

  /**
   * Paragraph tags should create line breaks for proper formatting
   */
  public isLineBreak(): boolean {
    return true;
  }
}
