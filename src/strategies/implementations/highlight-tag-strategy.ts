import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for highlight tags: <mark>
 * 
 * This strategy applies highlight styling to text.
 * Uses the default parse() implementation from BaseTagStrategy.
 * 
 */
export class HighlightTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      color: '#212529' // Highlight text color
    };
  }

  public getTagNames(): string[] {
    return ['mark'];
  }
}
