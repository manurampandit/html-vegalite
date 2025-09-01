import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for code tags: <code>, <pre>, <kbd>, <samp>
 */
export class CodeTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      // For now, we'll use a different color to indicate code
      color: '#d63384' // Bootstrap's code color
      // In a real implementation, we might also add:
      // fontFamily: 'monospace',
      // backgroundColor: '#f8f9fa',
      // padding: '0.125rem 0.25rem',
      // borderRadius: '0.25rem'
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
    return ['code', 'pre', 'kbd', 'samp'];
  }
}
