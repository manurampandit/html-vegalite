import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for small text tags: <small>, <sub>, <sup>
 * 
 * This strategy applies smaller font sizes and vertical offsets for subscript/superscript.
 * Uses the default parse() implementation from BaseTagStrategy.
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

  public getTagNames(): string[] {
    return ['small', 'sub', 'sup'];
  }
}
