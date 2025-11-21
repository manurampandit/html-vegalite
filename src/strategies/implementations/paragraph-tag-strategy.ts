import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for paragraph tags: <p>
 */
export class ParagraphTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Paragraphs typically maintain current styling but could add spacing
    // For now, we'll just return the current style unchanged
    return {
      ...currentStyle
      // We may further add margin/padding properties if needed
      // marginTop: '1em',
      // marginBottom: '1em'
    };
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag } = context;
    
    if (isClosingTag) {
      return this.handleBlockLevelClosingTag(context);
    }

    return this.handleBlockLevelOpeningTag(context);
  }

  public getTagNames(): string[] {
    return ['p'];
  }

  /**
   * Paragraph tags should create line breaks for proper formatting
   */
  public isLineBreak(): boolean {
    return true;
  }
}
