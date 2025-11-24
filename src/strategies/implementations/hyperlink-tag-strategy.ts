import { TextStyle } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for hyperlink tags: <a href="...">
 * 
 * This strategy applies link styling (color and underline) and validates href attributes.
 */
export class HyperlinkTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Extract href attribute if present
    const hrefMatch = attributes.match(/href=['"](.*?)['"]/);
    
    return {
      ...currentStyle,
      color: '#0066CC', // Traditional link blue
      textDecoration: 'underline',
      href: hrefMatch ? hrefMatch[1] : undefined,
    };
  }

  public getTagNames(): string[] {
    return ['a'];
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for href attribute (optional but recommended)
    const hrefMatch = attributes.match(/href=['"](.*?)['"]/);
    if (!hrefMatch) {
      // This is a warning rather than an error since href is technically optional
      // errors.push('Hyperlink missing href attribute');
    } else {
      const href = hrefMatch[1];
      if (!href || href.trim() === '') {
        errors.push('Hyperlink has empty href attribute');
      }
      // Basic URL validation
      if (href && !this.isValidUrl(href)) {
        errors.push('Invalid URL in href attribute');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Basic URL validation
   */
  private isValidUrl(url: string): boolean {
    try {
      // Check for relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return true;
      }
      // Check for absolute URLs
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url);
        return true;
      }
      // Check for other protocols
      if (url.includes('://')) {
        return true;
      }
      // Check for fragments and query strings
      if (url.startsWith('#') || url.startsWith('?')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Extract href attribute from attributes string
   */
  public extractHref(attributes: string): string | undefined {
    const hrefMatch = attributes.match(/href=['"](.*?)['"]/);
    return hrefMatch ? hrefMatch[1] : undefined;
  }
}
