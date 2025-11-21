import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';
import { colorMap } from '../../constants';

/**
 * Custom strategy for color tags like <red>, <green>, <blue>
 * 
 * This strategy applies colors based on the tag name using a predefined color map.
 * Uses the default parse() implementation from BaseTagStrategy.
 */
export class ColorTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    const color = colorMap[tagName || ''];
    
    return {
      ...currentStyle,
      color: color || currentStyle.color
    };
  }

  public getTagNames(): string[] {
    return Object.keys(colorMap);
  }
}
