import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for strike-through text tags: <s>, <strike>, <del>
 * 
 * This strategy applies line-through text decoration and a muted color.
 * Uses the default parse() implementation from BaseTagStrategy.
 */
export class StrikethroughTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    return {
      ...currentStyle,
      textDecoration: 'line-through' as any, // Would need to extend TextStyle type
      color: '#6c757d' // Muted color
    };
  }

  public getTagNames(): string[] {
    return ['s', 'strike', 'del'];
  }
}
