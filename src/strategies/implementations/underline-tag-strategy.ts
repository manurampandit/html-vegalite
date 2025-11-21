import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for underline tags: <u>
 * 
 * This strategy applies underline text decoration to text.
 * Uses the default parse() implementation from BaseTagStrategy.
 */
export class UnderlineTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      textDecoration: 'underline'
    };
  }

  public getTagNames(): string[] {
    return ['u'];
  }
}
