import { TextStyle, TextSegment, TextMeasurement } from '../types';
import { colorMap, inverseHeadingSizes, FONT_STYLE, FONT_WEIGHT, TEXT_DECORATION, VALID_FONT_WEIGHTS, VALID_FONT_STYLES, VALID_TEXT_DECORATIONS } from '../constants';

/**
 * Style utility functions for font/weight/size/color resolution and CSS parsing
 */
export class StyleHelpers {
  /**
   * Get default text style
   * 
   * @returns Default TextStyle object
   */
  static getDefaultStyle(): TextStyle {
    return {
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      textDecoration: 'none'
      // fontSize is optional and will be set by strategies when needed
    };
  }

  /**
   * Extract style attribute from HTML attributes string
   * 
   * @param attributes - HTML attributes string
   * @returns Extracted style string or null if not found
   */
  static extractStyleAttribute(attributes: string): string | null {
    const styleMatch = attributes.match(/style=['"](.*?)['"]/);
    return styleMatch && styleMatch[1] ? styleMatch[1] : null;
  }

  /**
   * Parse CSS color property and apply to style
   * 
   * @param styleStr - CSS style string
   * @param style - TextStyle object to modify
   */
  static parseColor(styleStr: string, style: TextStyle): void {
    const colorMatch = styleStr.match(/color:\s*([^;]+)/);
    if (colorMatch && colorMatch[1]) {
      style.color = colorMatch[1].trim();
    }
  }

  /**
   * Parse CSS font-weight property and apply to style
   * 
   * @param styleStr - CSS style string
   * @param style - TextStyle object to modify
   */
  static parseFontWeight(styleStr: string, style: TextStyle): void {
    const fontWeightMatch = styleStr.match(/font-weight:\s*([^;]+)/);
    if (fontWeightMatch && fontWeightMatch[1]) {
      const weight = fontWeightMatch[1].trim();
      if (weight === 'bold' || parseInt(weight) >= 600) {
        style.fontWeight = 'bold';
      } else {
        style.fontWeight = 'normal';
      }
    }
  }

  /**
   * Parse CSS font-style property and apply to style
   * 
   * @param styleStr - CSS style string
   * @param style - TextStyle object to modify
   */
  static parseFontStyle(styleStr: string, style: TextStyle): void {
    const fontStyleMatch = styleStr.match(/font-style:\s*([^;]+)/);
    if (fontStyleMatch && fontStyleMatch[1]) {
      const fontStyle = fontStyleMatch[1].trim();
      if (fontStyle === 'italic' || fontStyle === 'oblique') {
        style.fontStyle = 'italic';
      } else {
        style.fontStyle = 'normal';
      }
    }
  }

  /**
   * Parse CSS text-decoration property and apply to style
   * 
   * @param styleStr - CSS style string
   * @param style - TextStyle object to modify
   */
  static parseTextDecoration(styleStr: string, style: TextStyle): void {
    const textDecorationMatch = styleStr.match(/text-decoration:\s*([^;]+)/);
    if (textDecorationMatch && textDecorationMatch[1]) {
      const decoration = textDecorationMatch[1].trim();
      if (decoration.includes('underline')) {
        style.textDecoration = 'underline';
      } else {
        style.textDecoration = 'none';
      }
    }
  }

  /**
   * Parse all CSS properties from a style string and apply to style object
   * 
   * @param styleStr - CSS style string
   * @param style - TextStyle object to modify
   */
  static parseAllCssProperties(styleStr: string, style: TextStyle): void {
    this.parseColor(styleStr, style);
    this.parseFontWeight(styleStr, style);
    this.parseFontStyle(styleStr, style);
    this.parseTextDecoration(styleStr, style);
  }

  /**
   * Validate CSS property values
   * 
   * @param property - CSS property name
   * @param value - CSS property value
   * @returns Array of validation errors (empty if valid)
   */
  static validateCssProperty(property: string, value: string): string[] {
    const errors: string[] = [];
    
    switch (property) {
      case 'font-weight':
        if (!VALID_FONT_WEIGHTS.includes(value as any)) {
          errors.push(`Invalid font-weight value: ${value}`);
        }
        break;
      case 'font-style':
        if (!VALID_FONT_STYLES.includes(value as any)) {
          errors.push(`Invalid font-style value: ${value}`);
        }
        break;
      case 'text-decoration':
        if (!VALID_TEXT_DECORATIONS.some(dec => value.includes(dec))) {
          errors.push(`Invalid text-decoration value: ${value}`);
        }
        break;
      case 'color':
        // Basic color validation - can be enhanced
        if (!/^(#[0-9a-f]{3,6}|[a-z]+|rgb\(.*\))$/i.test(value)) {
          errors.push(`Invalid color value: ${value}`);
        }
        break;
    }
    
    return errors;
  }

  /**
   * Validate CSS style attribute
   * 
   * @param attributes - HTML attributes string
   * @returns Validation result with errors
   */
  static validateStyleAttribute(attributes: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const styleStr = this.extractStyleAttribute(attributes);
    
    if (!styleStr) {
      return { isValid: true, errors: [] }; // No style attribute is valid
    }
    
    // Parse and validate each CSS property
    const cssPropertyPattern = /([a-zA-Z-]+)\s*:\s*([^;]+)/g;
    let match;
    const validProperties = new Set(['color', 'font-weight', 'font-style', 'text-decoration']);
    
    while ((match = cssPropertyPattern.exec(styleStr)) !== null) {
      if (!match[1] || !match[2]) continue;
      
      const property = match[1].trim();
      const value = match[2].trim();
      
      if (!validProperties.has(property)) {
        errors.push(`Unsupported CSS property: ${property}`);
      } else {
        errors.push(...this.validateCssProperty(property, value));
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Check if a text segment is unstyled (no HTML tags applied)
   * 
   * @param segment - TextSegment to check
   * @returns true if segment has no styling applied
   */
  static isUnstyledSegment(segment: TextSegment): boolean {
    const color = segment.color?.toLowerCase();

    return (
      segment.fontWeight === FONT_WEIGHT.NORMAL &&
      segment.fontStyle === FONT_STYLE.NORMAL &&
      segment.textDecoration === TEXT_DECORATION.NONE &&
      (!color || color === colorMap['black'])
    );
  }

  /**
   * Check if a text segment has heading style (h1-h6)
   * 
   * @param segment - TextSegment to check
   * @param measurement - Optional measurement info
   * @returns true if segment appears to be a heading
   */
  static isHeadingStyle(segment: TextSegment, measurement?: { height: number }): boolean {
    return segment.fontWeight === FONT_WEIGHT.BOLD && 
           segment.fontSize !== undefined &&
           inverseHeadingSizes[segment.fontSize.toString()] !== undefined;
  }

  /**
   * Get the heading type (h1-h6) from a text segment
   * 
   * @param segment - TextSegment to analyze
   * @returns Heading type string (h1-h6) or null if not a heading
   */
  static getHeadingType(segment: TextSegment): string | null {
    if (segment.fontSize && inverseHeadingSizes[segment.fontSize.toString()]) {
      return inverseHeadingSizes[segment.fontSize.toString()] || null;
    }
    return null;
  }

  /**
   * Calculate approximate text width based on character count and styling
   * (Fallback measurement when canvas is not available)
   * 
   * @param text - Text to measure
   * @param style - TextStyle object
   * @param baseFontSize - Base font size (default: 14)
   * @returns TextMeasurement object
   */
  static measureTextFallback(text: string, style: TextStyle, baseFontSize: number = 14): TextMeasurement {
    // Approximate character width based on font properties
    const fontSize = style.fontSize || baseFontSize;
    let charWidth = fontSize * 0.6; // Base character width
    
    // Adjust for bold text (wider)
    if (style.fontWeight === FONT_WEIGHT.BOLD) {
      charWidth *= 1.15;
    }
    
    // Adjust for italic text (slightly wider due to slant)
    if (style.fontStyle === FONT_STYLE.ITALIC) {
      charWidth *= 1.05;
    }
    
    return {
      width: text.length * charWidth,
      height: fontSize
    };
  }

  /**
   * Create font string for canvas context from TextStyle
   * 
   * @param style - TextStyle object
   * @param baseFontSize - Base font size
   * @param fontFamily - Font family string
   * @returns CSS font string for canvas context
   */
  static createCanvasFontString(style: TextStyle, baseFontSize: number = 14, fontFamily: string = 'Arial, sans-serif'): string {
    const weight = style.fontWeight === FONT_WEIGHT.BOLD ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL;
    const fontStyle = style.fontStyle === FONT_STYLE.ITALIC ? FONT_STYLE.ITALIC : FONT_STYLE.NORMAL;
    const fontSize = style.fontSize || baseFontSize;
    
    return `${fontStyle} ${weight} ${fontSize}px ${fontFamily}`;
  }
}
