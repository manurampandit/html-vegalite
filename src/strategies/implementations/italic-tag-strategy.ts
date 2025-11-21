import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for italic tags: <i>, <em>
 * 
 * This strategy applies italic font style to text.
 * Uses the default parse() implementation from BaseTagStrategy.
 */
export class ItalicTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      fontStyle: 'italic'
    };
  }

  public getTagNames(): string[] {
    return ['i', 'em'];
  }
}
