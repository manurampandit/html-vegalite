import { TextSegment, PositionedTextSegment, TextMeasurement, TextStyle } from '../types';

/**
 * Layout utility functions for spacing, positioning, and general layout calculations
 */
export class LayoutHelpers {
  


  /**
   * Calculate small offset for unstyled text (improves readability)
   * 
   * @param segment - Text segment to check
   * @param currentX - Current X position
   * @param startX - Starting X position  
   * @param hasWrapped - Whether text has wrapped to a new line
   * @returns Offset value in pixels
   */
  static calculateUnstyledTextOffset(segment: TextSegment, currentX: number, startX: number, hasWrapped: boolean): number {
    // Apply small offset for unstyled text (e.g., 2px), but not for list items or after wrapping
    const isUnstyled = this.isUnstyledTextSegment(segment);
    return isUnstyled && !segment.isListItem && !hasWrapped && currentX === startX ? 2 : 0;
  }

  /**
   * Check if segments share parent styling (for spacing calculations)
   * 
   * @param segment1 - First segment
   * @param segment2 - Second segment
   * @returns true if segments appear to share common parent styling
   */
  static hasSharedParentStyling(segment1: TextSegment, segment2: TextSegment): boolean {
    // Basic heuristic: segments share parent styling if they have identical style properties
    // This is a simplified approach - could be enhanced with actual parent element tracking
    return (
      segment1.fontWeight === segment2.fontWeight &&
      segment1.fontStyle === segment2.fontStyle &&
      segment1.color === segment2.color &&
      segment1.textDecoration === segment2.textDecoration
    );
  }

  /**
   * Calculate spacing between segments based on context type
   * 
   * @param segment - Current segment
   * @param nextSegment - Next segment (optional)
   * @param baseSpaceWidth - Base space width from font measurement
   * @returns Adjusted space width in pixels
   */
  static calculateIntelligentSpacing(
    segment: TextSegment, 
    nextSegment: TextSegment | undefined, 
    baseSpaceWidth: number
  ): number {
    if (!segment.hasSpaceAfter) {
      return 0;
    }

    let spaceWidth = baseSpaceWidth;

    // Enhanced spacing for different contexts
    switch (segment.spacingContext) {
      case 'text-to-tag':
        // Apply more generous spacing when normal text precedes styled text (minimum 8px)
        spaceWidth = Math.max(spaceWidth, 8);
        break;
        
      case 'tag-to-tag':
        if (nextSegment && LayoutHelpers.hasSharedParentStyling(segment, nextSegment)) {
          // Apply reduced spacing for segments within the same parent element (maximum 5px)
          spaceWidth = Math.min(spaceWidth, 5);
        } else {
          // Apply controlled spacing between consecutive styled elements (maximum 7px to avoid excessive gaps)
          spaceWidth = Math.max(spaceWidth, 7);
        }
        break;
        
      case 'tag-to-text':
        // Apply reduced spacing when styled text is followed by normal text (maximum 6px)
        spaceWidth = Math.min(spaceWidth, 6);
        break;
        
      case 'list-prefix':
        // List prefixes should maintain their base spacing
        break;
    }

    return spaceWidth;
  }

  /**
   * Check if current line should wrap based on available width
   * 
   * @param currentX - Current X position
   * @param segmentWidth - Width of current segment
   * @param wrapWidth - Maximum line width
   * @param startX - Starting X position
   * @returns true if segment should wrap to next line
   */
  static shouldWrapLine(currentX: number, segmentWidth: number, wrapWidth: number, startX: number): boolean {
    const segmentWouldExceedWidth = currentX + segmentWidth > wrapWidth;
    const shouldWrapSegment = segmentWouldExceedWidth && currentX > startX;
    return shouldWrapSegment;
  }

  /**
   * Calculate line height for a segment based on its properties
   * 
   * @param segment - Text segment
   * @param measurement - Text measurement
   * @param baseLineHeight - Base line height
   * @returns Calculated line height for the segment
   */
  static calculateSegmentLineHeight(segment: TextSegment, measurement: TextMeasurement, baseLineHeight: number): number {
    // Use the larger of the base line height or the measured height
    // This ensures proper spacing for different font sizes
    return Math.max(baseLineHeight, measurement.height * 1.2);
  }

  /**
   * Create positioned segment from text segment and layout calculations
   * 
   * @param segment - Text segment
   * @param x - X position
   * @param y - Y position  
   * @param measurement - Text measurement
   * @param segmentLineHeight - Line height for segment
   * @returns Positioned text segment
   */
  static createPositionedSegment(
    segment: TextSegment, 
    x: number, 
    y: number, 
    measurement: TextMeasurement, 
    segmentLineHeight: number
  ): PositionedTextSegment {
    return {
      ...segment,
      x,
      y: y + (segmentLineHeight - measurement.height) + (segment.verticalOffset || 0),
      width: measurement.width,
      height: measurement.height
    };
  }

  /**
   * Helper to check if a segment is unstyled text
   * This is a simplified version - the full implementation should use StyleHelpers
   */
  private static isUnstyledTextSegment(segment: TextSegment): boolean {
    // This is a basic check - in production, would use StyleHelpers.isUnstyledSegment
    const color = segment.color?.toLowerCase();
    return (
      segment.fontWeight === 'normal' &&
      segment.fontStyle === 'normal' &&
      (segment.textDecoration === 'none' || !segment.textDecoration) &&
      (!color || color === '#000000' || color === 'black')
    );
  }
}



/**
 * Spacing analysis helper functions
 */
export class SpacingHelpers {
  
  /**
   * Determine spacing context between two segments for intelligent spacing
   * 
   * @param currentSegment - Current text segment
   * @param nextSegment - Next text segment (optional)
   * @param index - Current segment index
   * @param allSegments - All segments for context
   * @returns Spacing context string
   */
  static getSpacingContext(
    currentSegment: TextSegment, 
    nextSegment: TextSegment | null, 
    index: number, 
    allSegments: TextSegment[]
  ): 'text-to-tag' | 'tag-to-tag' | 'tag-to-text' | 'normal' {
    const currentIsStyled = SpacingHelpers.isStyledSegment(currentSegment);
    const nextIsStyled = nextSegment ? SpacingHelpers.isStyledSegment(nextSegment) : false;

    if (!currentIsStyled && nextIsStyled) {
      return 'text-to-tag';
    } else if (currentIsStyled && nextIsStyled) {
      return 'tag-to-tag';
    } else if (currentIsStyled && !nextIsStyled) {
      return 'tag-to-text';
    } else {
      return 'normal';
    }
  }

  /**
   * Check if a segment has styling applied (opposite of unstyled)
   * 
   * @param segment - Text segment to check
   * @returns true if segment has styling beyond default
   */
  static isStyledSegment(segment: TextSegment): boolean {
    const color = segment.color?.toLowerCase();
    
    return !(
      segment.fontWeight === 'normal' &&
      segment.fontStyle === 'normal' &&
      (segment.textDecoration === 'none' || !segment.textDecoration) &&
      (!color || color === '#000000' || color === 'black') &&
      !segment.fontSize // No custom font size
    );
  }

  /**
   * Map text segments to their approximate positions in the original HTML
   * This is used for spacing analysis based on original HTML structure
   * 
   * @param segments - Array of text segments
   * @param cleanedHtml - Cleaned HTML string
   * @returns Array of position information for each segment
   */
  static mapSegmentsToHtmlPositions(segments: TextSegment[], cleanedHtml: string): Array<{ start: number; end: number }> {
    const positions: Array<{ start: number; end: number }> = [];
    let htmlIndex = 0;
    
    for (const segment of segments) {
      const segmentText = segment.text.trim();
      if (segmentText) {
        // Find the segment text in the cleaned HTML
        const foundIndex = cleanedHtml.indexOf(segmentText, htmlIndex);
        if (foundIndex !== -1) {
          positions.push({
            start: foundIndex,
            end: foundIndex + segmentText.length
          });
          htmlIndex = foundIndex + segmentText.length;
        } else {
          // Fallback: approximate position
          positions.push({
            start: htmlIndex,
            end: htmlIndex + segmentText.length
          });
          htmlIndex += segmentText.length;
        }
      } else {
        positions.push({ start: htmlIndex, end: htmlIndex });
      }
    }
    
    return positions;
  }

  /**
   * Check if there should be whitespace between two segments based on HTML analysis
   * 
   * @param currentSegment - Current segment
   * @param nextSegment - Next segment
   * @param cleanedHtml - Cleaned HTML string
   * @param positions - Position mapping for segments
   * @param currentIndex - Index of current segment
   * @returns true if there should be space between segments
   */
  static shouldHaveSpaceBetween(
    currentSegment: TextSegment,
    nextSegment: TextSegment,
    cleanedHtml: string,
    positions: Array<{ start: number; end: number }>,
    currentIndex: number
  ): boolean {
    if (currentIndex >= positions.length - 1) {
      return false;
    }

    const currentPos = positions[currentIndex];
    const nextPos = positions[currentIndex + 1];
    
    if (!currentPos || !nextPos) {
      return false;
    }

    // Check HTML between the two segments
    const betweenText = cleanedHtml.substring(currentPos.end, nextPos.start);
    
    // If there's any whitespace in the original HTML, preserve it as a single space
    // This implements the rule: space>=1 becomes 1 space, space=0 stays 0
    return /\s/.test(betweenText);
  }
}
