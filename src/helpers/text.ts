import { TextSegment } from '../types';

/**
 * Text utility functions for whitespace handling and line break normalization
 */
export class TextHelpers {
  /**
   * Check if we need a line break before this segment
   * 
   * @param segments - Array of text segments to check
   * @returns true if a line break is needed before the next segment
   */
  static needsLineBreak(segments: TextSegment[]): boolean {
    if (segments.length === 0) return false;
    
    const lastSegment = segments[segments.length - 1];
    return lastSegment !== undefined && 
           lastSegment.text !== '\n' && 
           lastSegment.text.trim() !== '';
  }

  /**
   * Check if there's meaningful content after this position
   * 
   * @param remainingParts - Array of remaining HTML parts
   * @param currentIndex - Current index in the parts array
   * @returns true if there's meaningful content remaining
   */
  static hasMoreContent(remainingParts: string[], currentIndex: number): boolean {
    const remainingContent = remainingParts.slice(currentIndex).join('');
    return remainingContent.trim().length > 0;
  }

  /**
   * Normalize whitespace in segments by trimming leading/trailing spaces
   * and using that information to infer spacing between segments
   * 
   * @param segments - Array of text segments to normalize
   * @returns Array of normalized text segments
   */
  static normalizeSegmentWhitespace(segments: TextSegment[]): TextSegment[] {
    const normalized: TextSegment[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (!segment) continue;
      
      // Skip newlines - handle them as-is
      if (segment.text === '\n') {
        normalized.push({ ...segment });
        continue;
      }
      
      // Trim whitespace and create normalized segment
      const trimmedText = segment.text.trim();
      
      // Skip empty segments after trimming
      if (!trimmedText) {
        continue;
      }
      
      normalized.push({
        ...segment,
        text: trimmedText
      });
    }
    
    return normalized;
  }

  /**
   * Escape special regex characters in a string
   * 
   * @param text - Text to escape
   * @returns Escaped text safe for use in regex
   */
  static escapeRegexSpecialChars(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Clean HTML by removing excessive whitespace while preserving structure
   * 
   * @param html - HTML string to clean
   * @returns Cleaned HTML with normalized whitespace
   */
  static cleanHtmlWhitespace(html: string): string {
    return html.replace(/\s+/g, ' ').trim();
  }
}
