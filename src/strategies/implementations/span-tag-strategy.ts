import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';
import { StyleHelpers } from '../../helpers/style';

/**
 * Strategy for span tags with style attributes: <span style="...">
 * 
 * This strategy parses CSS style attributes and applies them to text.
 * Uses the default parse() implementation from BaseTagStrategy.
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

  public getTagNames(): string[] {
    return ['span'];
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    return StyleHelpers.validateStyleAttribute(attributes);
  }
}
