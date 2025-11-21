import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for bold tags: <b>, <strong>
 * 
 * This strategy applies bold font weight to text.
 * Uses the default parse() implementation from BaseTagStrategy.
 */
export class BoldTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      fontWeight: 'bold'
    };
  }

  public getTagNames(): string[] {
    return ['b', 'strong'];
  }
}
