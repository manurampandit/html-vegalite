import { TextSegment } from './types';
import { TextHelpers } from './helpers/text';

/**
 * Intelligent HTML spacing analyzer that preserves original spacing context
 * Implements the rule: space>=1 becomes 1 space, space=0 stays 0
 */
export class SpacingAnalyzer {
  
  /**
   * Analyze HTML and assign spacing metadata to segments
   * This replaces the old haphazard spacing logic with intelligent detection
   */
  public static analyzeAndAssignSpacing(segments: TextSegment[], originalHtml: string): TextSegment[] {
    // First, normalize whitespace in segments (trim leading/trailing spaces)
    const normalizedSegments = TextHelpers.normalizeSegmentWhitespace(segments);
    if (normalizedSegments.length <= 1) {
      return normalizedSegments; // No spacing needed for single or no segments
    }

    // Clean HTML for analysis (remove excessive whitespace but preserve structure)
    const cleanedHtml = TextHelpers.cleanHtmlWhitespace(originalHtml);
    
    // Create a mapping of segments to their positions in the HTML structure
    const segmentPositions = this.mapSegmentsToHtmlPositions(normalizedSegments, cleanedHtml);
    
    // Analyze spacing between each pair of adjacent segments  
    const spacedSegments = normalizedSegments.map((segment, index) => {
      // Preserve list-prefix spacing context and hasSpaceAfter from parser
      if (segment.spacingContext === 'list-prefix') {
        return {
          ...segment,
          hasSpaceAfter: true, // Always maintain space after list prefixes
          spacingContext: 'list-prefix' as const // Preserve the special context with proper typing
        };
      }
      
      if (index >= normalizedSegments.length - 1) {
        // Last segment never needs space after it
        return {
          ...segment,
          hasSpaceAfter: false,
          spacingContext: this.getSpacingContext(segment, null, index, normalizedSegments)
        };
      }

      const currentSegment = segment;
      const nextSegment = normalizedSegments[index + 1];
      
      if (!nextSegment) {
        return {
          ...segment,
          hasSpaceAfter: false,
          spacingContext: this.getSpacingContext(segment, null, index, normalizedSegments)
        };
      }
      
      // Determine if there should be space between current and next segment
      const hasSpaceAfter = this.shouldHaveSpaceBetween(
        currentSegment, 
        nextSegment, 
        index, 
        normalizedSegments, 
        cleanedHtml,
        segmentPositions
      );

      const spacingContext = this.getSpacingContext(currentSegment, nextSegment, index, normalizedSegments);

      return {
        ...currentSegment,
        hasSpaceAfter,
        spacingContext
      };
    });

    return spacedSegments;
  }

  /**
   * Determine if there should be space between two adjacent segments
   * Core logic: space>=1 in original HTML becomes 1 space, space=0 stays 0
   */
  private static shouldHaveSpaceBetween(
    current: TextSegment,
    next: TextSegment,
    currentIndex: number,
    segments: TextSegment[],
    originalHtml: string,
    positions: Map<number, {start: number, end: number}>
  ): boolean {
    
    // Skip newline segments
    if (current.text === '\n' || next.text === '\n') {
      return false;
    }

    // Get positions of current and next segments in original HTML
    const currentPos = positions.get(currentIndex);
    const nextPos = positions.get(currentIndex + 1);
    
    if (!currentPos || !nextPos) {
      // Fallback: analyze text patterns
      return this.analyzeTextPatternSpacing(current, next, originalHtml);
    }

    // Extract the HTML between the end of current segment and start of next segment
    const betweenHtml = originalHtml.substring(currentPos.end, nextPos.start);
    
    // Check if there's whitespace between segments
    const hasWhitespace = /\s/.test(betweenHtml);
    
    // Rule: If there's any whitespace (space>=1), normalize to 1 space
    // If no whitespace (space=0), keep no space
    return hasWhitespace;
  }

  /**
   * Fallback method to analyze spacing based on text patterns when position mapping fails
   */
  private static analyzeTextPatternSpacing(current: TextSegment, next: TextSegment, originalHtml: string): boolean {
    const currentText = current.text.trim();
    const nextText = next.text.trim();
    
    if (!currentText || !nextText) return false;

    // Create regex patterns to find the segments in HTML
    const currentPattern = TextHelpers.escapeRegexSpecialChars(currentText);
    const nextPattern = TextHelpers.escapeRegexSpecialChars(nextText);
    
    // Look for pattern: currentText...whitespace...nextText
    const combinedPattern = new RegExp(
      currentPattern + '([^\\w\\s]*)(\\s+)([^\\w\\s]*)' + nextPattern,
      'i'
    );
    
    const match = originalHtml.match(combinedPattern);
    return match && match[2] ? match[2].length > 0 : false;
  }

  /**
   * Map segments to their approximate positions in the original HTML
   * This is a heuristic approach since the parser doesn't preserve exact positions
   */
  private static mapSegmentsToHtmlPositions(segments: TextSegment[], html: string): Map<number, {start: number, end: number}> {
    const positions = new Map<number, {start: number, end: number}>();
    let searchStartIndex = 0;

    segments.forEach((segment, index) => {
      if (segment.text === '\n') {
        // Skip newlines for position mapping
        positions.set(index, {start: searchStartIndex, end: searchStartIndex});
        return;
      }

      const segmentText = segment.text.trim();
      if (!segmentText) {
        positions.set(index, {start: searchStartIndex, end: searchStartIndex});
        return;
      }

      // Find the segment text in HTML starting from searchStartIndex
      const textIndex = html.indexOf(segmentText, searchStartIndex);
      if (textIndex !== -1) {
        positions.set(index, {
          start: textIndex,
          end: textIndex + segmentText.length
        });
        searchStartIndex = textIndex + segmentText.length;
      } else {
        // Fallback if exact text not found
        positions.set(index, {start: searchStartIndex, end: searchStartIndex});
      }
    });

    return positions;
  }

  /**
   * Determine the spacing context between segments
   */
  private static getSpacingContext(
    current: TextSegment, 
    next: TextSegment | null, 
    index: number, 
    segments: TextSegment[]
  ): 'tag-to-tag' | 'text-to-tag' | 'tag-to-text' | 'text-to-text' {
    const currentIsFromTag = this.isFromTag(current, index, segments);
    const nextIsFromTag = next ? this.isFromTag(next, index + 1, segments) : false;

    if (currentIsFromTag && next && nextIsFromTag) {
      return 'tag-to-tag';
    } else if (currentIsFromTag && next && !nextIsFromTag) {
      return 'tag-to-text';
    } else if (!currentIsFromTag && next && nextIsFromTag) {
      return 'text-to-tag';
    } else {
      return 'text-to-text';
    }
  }

  /**
   * Determine if a segment likely comes from a tag (has non-default styling)
   */
  private static isFromTag(segment: TextSegment, index: number, segments: TextSegment[]): boolean {
    // A segment is likely from a tag if it has non-default styling
    return !!(segment.fontWeight === 'bold' ||
           segment.fontStyle === 'italic' ||
           (segment.color && segment.color !== '#000000') ||
           segment.textDecoration === 'underline' ||
           segment.textDecoration === 'line-through' ||
           (segment.fontSize && segment.fontSize !== 14));
  }


}
