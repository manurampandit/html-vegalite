import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Example of custom strategy for strike-through text
 */
export class StrikethroughTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      textDecoration: 'line-through' as any, // Would need to extend TextStyle type
      color: '#6c757d' // Muted color
    };
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
    return ['s', 'strike', 'del'];
  }
}
