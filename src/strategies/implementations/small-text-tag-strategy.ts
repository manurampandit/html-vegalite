import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for small text tags: <small>, <sub>, <sup>
 */
export class SmallTextTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    const baseFontSize = currentStyle.fontSize || 14;
    const smallerFontSize = baseFontSize * 0.75; // 75% of normal size
    
    switch (tagName?.toLowerCase()) {
      case 'sub':
        return {
          ...currentStyle,
          fontSize: smallerFontSize,
          verticalOffset: baseFontSize * 0.15 // Move down for subscript
        };
      case 'sup':
        return {
          ...currentStyle,
          fontSize: smallerFontSize,
          verticalOffset: -(baseFontSize * 0.35) // Move up for superscript
        };
      case 'small':
        return {
          ...currentStyle,
          fontSize: smallerFontSize,
          color: '#6c757d' // Muted color for small text
        };
      default:
        return currentStyle;
    }
  }

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

  public getTagNames(): string[] {
    return ['small', 'sub', 'sup'];
  }
}
