import { TextStyle, ParseContext, ParsedOutput } from '../../types';

/**
 * Base interface for all tag strategies
 */
export interface TagStrategy {
  /**
   * Apply styling for opening tag (legacy method - kept for backward compatibility)
   */
  applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle;
  
  /**
   * Parse a tag using the new strategy-based approach
   */
  parse(context: ParseContext): ParsedOutput;
  
  /**
   * Get tag names this strategy handles
   */
  getTagNames(): string[];
  
  /**
   * Validate tag attributes (optional)
   */
  validateAttributes?(attributes: string): { isValid: boolean; errors: string[] };
  
  /**
   * Check if this tag represents a line break (optional)
   */
  isLineBreak?(): boolean;
}
