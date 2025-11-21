import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';
import { StyleHelpers } from '../../helpers/style';

/**
 * Strategy for span tags with style attributes: <span style="...">
 */
export class SpanTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    const newStyle = { ...currentStyle };
    
    const styleStr = StyleHelpers.extractStyleAttribute(attributes);
    if (!styleStr) return newStyle;
    
    // Parse individual CSS properties using helper functions
    StyleHelpers.parseAllCssProperties(styleStr, newStyle);
    
    return newStyle;
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
    return ['span'];
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    return StyleHelpers.validateStyleAttribute(attributes);
  }


}
