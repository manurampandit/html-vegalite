import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for bold tags: <b>, <strong>
 */
export class BoldTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      fontWeight: 'bold'
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
    return ['b', 'strong'];
  }
}
