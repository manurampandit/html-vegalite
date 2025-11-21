import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for code tags: <code>, <pre>, <kbd>, <samp>
 * 
 * This strategy applies code-specific styling (color) to text.
 * Uses the default parse() implementation from BaseTagStrategy.
 * 
 */
export class CodeTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      color: '#d63384' // Bootstrap's code color
    };
  }

  public getTagNames(): string[] {
    return ['code', 'pre', 'kbd', 'samp'];
  }
}
