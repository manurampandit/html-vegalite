import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';

/**
 * Strategy for line break tags: <br>
 */
export class LineBreakTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Line breaks don't change text styling, but we need to signal a line break
    return {
      ...currentStyle
    };
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, currentStyle } = context;
    
    // <br> is self-closing, so we shouldn't see closing tags
    if (isClosingTag) {
      return {
        newSegments: [],
        updatedStyle: currentStyle,
        pushStyleToStack: false,
        popFromStyleStack: false,
        errors: ['Unexpected closing tag for self-closing <br> element']
      };
    }

    // For opening tags, immediately add a line break segment
    return {
      newSegments: [
        {
          text: '\n',
          ...currentStyle
        }
      ],
      updatedStyle: currentStyle, // Style doesn't change for line breaks
      pushStyleToStack: false, // Don't push to stack since it's self-closing
      popFromStyleStack: false,
      errors: []
    };
  }

  public getTagNames(): string[] {
    return ['br'];
  }

  /**
   * Line break tags are self-closing and should insert a line break character
   */
  public isLineBreak(): boolean {
    return true;
  }
}
