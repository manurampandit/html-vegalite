import { TextStyle, TextSegment, PositionedTextSegment, TextMeasurement, HTMLToVegaLiteOptions } from './types';
import { colorMap, inverseHeadingSizes, headingSizes, FONT_STYLE, FONT_WEIGHT, TEXT_DECORATION } from './constants';
import { StyleHelpers } from './helpers/style';

/**
 * Text layout engine that positions text segments
 */
export class TextLayoutEngine {
  private fontSize: number;
  private fontFamily: string;
  private startX: number;
  private startY: number;
  private lineHeight: number;
  private canvasContext: CanvasRenderingContext2D | null = null;

  constructor(options: HTMLToVegaLiteOptions = {}) {
    this.fontSize = options.fontSize ?? 14;
    this.fontFamily = options.fontFamily ?? 'Arial, sans-serif';
    this.startX = options.startX ?? 10;
    this.startY = options.startY ?? 30;
    this.lineHeight = options.lineHeight ?? this.fontSize * 1.4;
    
    this.initializeCanvas();
  }

  /**
   * Initialize canvas for text measurement
   */
  private initializeCanvas(): void {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      this.canvasContext = canvas.getContext('2d');
    }
  }

  /**
   * Measure text dimensions using canvas API or fallback
   */
  public measureText(text: string, style: TextStyle): TextMeasurement {
    if (this.canvasContext) {
      return this.measureTextWithCanvas(text, style);
    } else {
      return StyleHelpers.measureTextFallback(text, style, this.fontSize);
    }
  }

  /**
   * Measure text using canvas API (browser environment)
   */
  private measureTextWithCanvas(text: string, style: TextStyle): TextMeasurement {
    if (!this.canvasContext) {
      return StyleHelpers.measureTextFallback(text, style, this.fontSize);
    }

    this.canvasContext.font = StyleHelpers.createCanvasFontString(style, this.fontSize, this.fontFamily);
    
    const metrics = this.canvasContext.measureText(text);
    const fontSize = style.fontSize || this.fontSize;
    
    return {
      width: metrics.width,
      height: fontSize
    };
  }



  /**
   * Get additional spacing below heading based on heading level
   * H1 gets the most spacing, H6 gets the least
   * Uses half of the heading font size as spacing
   */
  private getHeadingSpacing(headingType: string): number {
    return (headingSizes[headingType] || 0) / 2;
  }

  /**
   * Check if we're at the end of a heading block
   */
  private isEndOfHeadingBlock(segments: TextSegment[], currentIndex: number, currentHeadingType: string): boolean {
    // Check if the next non-newline segment is also part of the same heading
    for (let i = currentIndex + 1; i < segments.length; i++) {
      const nextSegment = segments[i];
      if (!nextSegment) continue;
      
      // Skip newline segments
      if (nextSegment.text === '\n') continue;
      
      // Check if next segment is still a heading
      const nextMeasurement = this.measureText(nextSegment.text, nextSegment);
      if (!StyleHelpers.isHeadingStyle(nextSegment, nextMeasurement)) {
        // Next segment is not a heading, so current heading block ends here
        return true;
      }
      
      // Check if it's the same heading type
      const nextHeadingType = StyleHelpers.getHeadingType(nextSegment);
      if (nextHeadingType !== currentHeadingType) {
        // Different heading type, so current heading block ends here
        return true;
      }
      
      // Same heading type continues
      return false;
    }
    
    // Reached end of segments
    return true;
  }




  /**
   * Layout text segments with positioning and line wrapping
   */
  public layoutSegments(segments: TextSegment[], maxWidth?: number): PositionedTextSegment[] {
    const positioned: PositionedTextSegment[] = [];
    let currentX = this.startX;
    let currentY = this.startY;
    const wrapWidth = maxWidth ?? 400;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;
      
      // Handle explicit line breaks
      if (segment.text === '\n') {
        currentX = this.startX;
        currentY += this.lineHeight;
        continue;
      }
      
      // Check if this segment needs word wrapping
      const measurement = this.measureText(segment.text, segment);
      const segmentLineHeight = Math.max(this.lineHeight, measurement.height);

      const isHeading = StyleHelpers.isHeadingStyle(segment, measurement);
      
      // Check if segment fits on current line
      const segmentWouldExceedWidth = currentX + measurement.width > wrapWidth;
      const shouldWrapSegment = segmentWouldExceedWidth && currentX > this.startX;
      
      if (shouldWrapSegment) {
        // This segment needs to wrap to next line
        currentX = this.startX;
        currentY += segmentLineHeight;
      }
      
      if (measurement.width > wrapWidth && segment.text.includes(' ')) {
        // Word wrap this segment
        const words = segment.text.split(' ');
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!word) continue; // Skip empty words
          
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testMeasurement = this.measureText(testLine, segment);
          
          if (testMeasurement.width > wrapWidth && currentLine) {
            // Add current line if it has content
            const lineMeasurement = this.measureText(currentLine, segment);
            
            // Calculate indentation for list items in word wrapping
            let indentationX = 0;
            if (segment.isListItem && segment.listNestingLevel) {
              indentationX = 20 + ((segment.listNestingLevel - 1) * 20);
            }
            
            positioned.push({
              ...segment,
              text: currentLine,
              x: currentX + indentationX,
              y: currentY + (segment.verticalOffset || 0),
              width: lineMeasurement.width,
              height: lineMeasurement.height
            });
            currentX = this.startX;
            currentY += this.lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        // Add remaining text
        if (currentLine) {
          const lineMeasurement = this.measureText(currentLine, segment);
          
          // Calculate indentation for list items in word wrapping
          let indentationX = 0;
          if (segment.isListItem && segment.listNestingLevel) {
            indentationX = 20 + ((segment.listNestingLevel - 1) * 20);
          }
          
          // Don't apply offset for wrapped segments that continue text flow
          const offsetX = StyleHelpers.isUnstyledSegment(segment) && !segment.isListItem && currentX === this.startX ? 2 : 0;
          
          positioned.push({
            ...segment,
            text: currentLine,
            x: currentX + indentationX + offsetX,
            y: currentY + (segment.verticalOffset || 0), // Apply vertical offset for sub/sup
            width: lineMeasurement.width,
            height: lineMeasurement.height
          });
          currentX += lineMeasurement.width;
          
          // Intelligent spacing for word-wrapped segments
          if (segment.hasSpaceAfter) {
            const spaceMeasurement = this.measureText(' ', segment);
            let spaceWidth = spaceMeasurement.width;
            
            // Enhanced spacing for text-to-tag and tag-to-tag transitions to improve readability
            // (tag-to-text transitions use reduced spacing)
            if (segment.spacingContext === 'text-to-tag') {
              // Apply more generous spacing when normal text precedes styled text (minimum 8px)
              spaceWidth = Math.max(spaceWidth, 8);
            } else if (segment.spacingContext === 'tag-to-tag') {
              // For word-wrapped segments, we need to find the next segment more carefully
              let nextSegment = null;
              for (let j = i + 1; j < segments.length; j++) {
                if (segments[j]?.text.trim()) {
                  nextSegment = segments[j];
                  break;
                }
              }
              if (nextSegment && this.hasSharedParentStyling(segment, nextSegment)) {
                // Apply reduced spacing for segments within the same parent element (maximum 5px)
                spaceWidth = Math.min(spaceWidth, 5);
              } else {
                // Apply enhanced spacing between consecutive styled elements (minimum 10px)
                spaceWidth = Math.max(spaceWidth, 10);
              }
            } else if (segment.spacingContext === 'tag-to-text') {
              // Apply reduced spacing when styled text is followed by normal text (maximum 6px)
              spaceWidth = Math.min(spaceWidth, 6);
            } else if (segment.spacingContext === 'list-prefix') {
              // Apply consistent spacing for list prefixes regardless of following content styling (fixed 5px)
              spaceWidth = 5;
            }
            
            currentX += spaceWidth;
          }
        }
        
        // Apply additional spacing after heading blocks (word-wrapped case)
        if (isHeading) {
          const headingType = StyleHelpers.getHeadingType(segment);
          if (headingType && this.isEndOfHeadingBlock(segments, i, headingType)) {
            // This is the end of a heading block, add extra spacing
            const additionalSpacing = this.getHeadingSpacing(headingType);
            currentY += additionalSpacing;
          }
        }
      } else {
        // Line wrapping logic for segments that don't need word wrapping
        const hasWrapped = currentX > this.startX && currentX + measurement.width > wrapWidth;
        if (hasWrapped) {
          currentX = this.startX;
          currentY += segmentLineHeight;
        }

        const isUnstyled = StyleHelpers.isUnstyledSegment(segment);

        // Calculate indentation for list items
        let indentationX = 0;
        if (segment.isListItem && segment.listNestingLevel) {
          // Base padding for first-level lists: 20px
          // Additional indentation for nested lists: 20px per level
          indentationX = 20 + ((segment.listNestingLevel - 1) * 20);
        }

        // Apply small offset for unstyled text (e.g., 2px), but not for list items or after wrapping
        const offsetX = isUnstyled && !segment.isListItem && !hasWrapped ? 2 : 0;
        const totalOffsetX = offsetX + indentationX;

        positioned.push({
          ...segment,
          x: currentX + totalOffsetX, 
          y: currentY + (segmentLineHeight - measurement.height) + (segment.verticalOffset || 0), // Apply vertical offset
          width: measurement.width,
          height: measurement.height
        });

        currentX += measurement.width;
        
        // Intelligent spacing: only add space if segment indicates it should have space after it
        if (segment.hasSpaceAfter) {
          const spaceMeasurement = this.measureText(' ', segment);
          let spaceWidth = spaceMeasurement.width;
          
          // Enhanced spacing for text-to-tag and tag-to-tag transitions to improve readability
          // (tag-to-text transitions use reduced spacing)
          if (segment.spacingContext === 'text-to-tag') {
            // Apply more generous spacing when normal text precedes styled text (minimum 8px)
            spaceWidth = Math.max(spaceWidth, 8);
          } else if (segment.spacingContext === 'tag-to-tag') {
            // Check if segments share parent styling (nested within same element)
            const nextSegment = segments[i + 1];
            if (nextSegment && this.hasSharedParentStyling(segment, nextSegment)) {
              // Apply reduced spacing for segments within the same parent element (maximum 5px)
              spaceWidth = Math.min(spaceWidth, 5);
            } else {
              // Apply controlled spacing between consecutive styled elements (maximum 7px to avoid excessive gaps)
              spaceWidth = Math.max(spaceWidth, 7);
            }
          } else if (segment.spacingContext === 'tag-to-text') {
            // Apply reduced spacing when styled text is followed by normal text (maximum 6px)
            spaceWidth = Math.min(spaceWidth, 6);
          } else if (segment.spacingContext === 'list-prefix') {
            // Apply consistent spacing for list prefixes regardless of following content styling (fixed 5px)
            spaceWidth = 5;
          }
          
          currentX += spaceWidth;
        }

        // No extra vertical spacing - line breaks are handled by parser
      }

      // Apply additional spacing after heading blocks
      if (isHeading) {
        const headingType = StyleHelpers.getHeadingType(segment);
        if (headingType && this.isEndOfHeadingBlock(segments, i, headingType)) {
          // This is the end of a heading block, add extra spacing
          const additionalSpacing = this.getHeadingSpacing(headingType);
          currentY += additionalSpacing;
        }
      }
    }

    return positioned;
  }

  /**
   * Calculate bounding box for positioned segments
   */
  public calculateBounds(segments: PositionedTextSegment[]): { width: number; height: number } {
    if (segments.length === 0) {
      return { width: 0, height: 0 };
    }

    const maxX = Math.max(...segments.map(s => s.x + s.width));
    const maxY = Math.max(...segments.map(s => s.y + s.height));
    
    return {
      width: maxX + 20, // Add padding
      height: maxY + 10  // Add padding
    };
  }

  /**
   * Update layout options
   */
  public updateOptions(options: Partial<HTMLToVegaLiteOptions>): void {
    if (options.fontSize !== undefined) {
      this.fontSize = options.fontSize;
      this.lineHeight = options.lineHeight ?? this.fontSize * 1.4;
    }
    if (options.fontFamily !== undefined) {
      this.fontFamily = options.fontFamily;
    }
    if (options.startX !== undefined) {
      this.startX = options.startX;
    }
    if (options.startY !== undefined) {
      this.startY = options.startY;
    }
    if (options.lineHeight !== undefined) {
      this.lineHeight = options.lineHeight;
    }
  }

  /**
   * Get current layout options
   */
  public getOptions(): HTMLToVegaLiteOptions {
    return {
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      startX: this.startX,
      startY: this.startY,
      lineHeight: this.lineHeight
    };
  }

  /**
   * Check if two segments share parent styling (indicating they're nested within the same element)
   */
  private hasSharedParentStyling(current: TextSegment, next: TextSegment): boolean {
    // Segments share parent styling if they have overlapping base styles
    // This indicates they're part of the same parent element with additional nested styling
    
    const currentBaseStyles = {
      fontWeight: current.fontWeight || 'normal',
      color: current.color || '#000000',
      fontSize: current.fontSize || 14
    };
    
    const nextBaseStyles = {
      fontWeight: next.fontWeight || 'normal', 
      color: next.color || '#000000',
      fontSize: next.fontSize || 14
    };
    
    // If they share font weight (like both being bold), they likely share a parent
    const sharesFontWeight = currentBaseStyles.fontWeight === nextBaseStyles.fontWeight && 
                            currentBaseStyles.fontWeight !== 'normal';
    
    const sharesColor = currentBaseStyles.color === nextBaseStyles.color && 
                       currentBaseStyles.color !== '#000000';
                       
    const sharesFontSize = currentBaseStyles.fontSize === nextBaseStyles.fontSize &&
                          currentBaseStyles.fontSize !== 14;
    
    return sharesFontWeight || sharesColor || sharesFontSize;
  }
}