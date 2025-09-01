import { TextStyle, ParseContext, ParsedOutput, TextSegment } from '../../types';
import { TagStrategy } from './tag-strategy.interface';
import { TextHelpers } from '../../helpers/text';

/**
 * Abstract base class implementing common tag strategy functionality
 */
export abstract class BaseTagStrategy implements TagStrategy {
  abstract applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle;
  abstract getTagNames(): string[];
  abstract parse(context: ParseContext): ParsedOutput;
  
  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    // Default implementation - no validation
    // TODO will add in further implementations
    return { isValid: true, errors: [] };
  }
  
  public isLineBreak(): boolean {
    // Default implementation - most tags are not line breaks
    return false;
  }

  /**
   * Check if we need a line break before this segment
   */
  protected needsLineBreak(segments: TextSegment[]): boolean {
    return TextHelpers.needsLineBreak(segments);
  }

  /**
   * Check if there's meaningful content after this tag
   */
  protected hasMoreContent(remainingParts: string[], currentIndex: number): boolean {
    return TextHelpers.hasMoreContent(remainingParts, currentIndex);
  }
}
