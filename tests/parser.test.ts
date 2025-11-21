import { HTMLParser } from '../src/parser';
import { 
  BoldTagStrategy, 
  ItalicTagStrategy, 
  ColorTagStrategy,
  TagStrategy 
} from '../src/strategies/index';

describe('HTMLParser', () => {
  let parser: HTMLParser;

  beforeEach(() => {
    parser = new HTMLParser();
  });

  describe('parseHTML', () => {
    it('should parse simple text without tags', () => {
      const result = parser.parseHTML('Hello World');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Hello World');
      expect(result.segments[0].fontWeight).toBe('normal');
      expect(result.segments[0].fontStyle).toBe('normal');
      expect(result.segments[0].color).toBe('#000000');
    });

    it('should parse bold tags', () => {
      const result = parser.parseHTML('<b>Bold text</b>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Bold text');
      expect(result.segments[0].fontWeight).toBe('bold');
    });

    it('should parse strong tags as bold', () => {
      const result = parser.parseHTML('<strong>Strong text</strong>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Strong text');
      expect(result.segments[0].fontWeight).toBe('bold');
    });

    it('should parse italic tags', () => {
      const result = parser.parseHTML('<i>Italic text</i>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Italic text');
      expect(result.segments[0].fontStyle).toBe('italic');
    });

    it('should parse em tags as italic', () => {
      const result = parser.parseHTML('<em>Emphasized text</em>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Emphasized text');
      expect(result.segments[0].fontStyle).toBe('italic');
    });

    it('should parse underline tags', () => {
      const result = parser.parseHTML('<u>Underlined text</u>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Underlined text');
      expect(result.segments[0].textDecoration).toBe('underline');
    });

    it('should parse span with style attributes', () => {
      const result = parser.parseHTML('<span style="color: red; font-weight: bold">Styled text</span>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Styled text');
      expect(result.segments[0].color).toBe('red');
      expect(result.segments[0].fontWeight).toBe('bold');
    });

    it('should parse heading tags', () => {
      const result = parser.parseHTML('<h1>Main Title</h1>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Main Title');
      expect(result.segments[0].fontWeight).toBe('bold');
    });

    it('should parse mixed formatting', () => {
      const result = parser.parseHTML('<b>Bold</b> and <i>italic</i> text');
      
      expect(result.segments).toHaveLength(4);
      
      expect(result.segments[0].text).toBe('Bold');
      expect(result.segments[0].fontWeight).toBe('bold');
      
      expect(result.segments[1].text).toBe('and');
      expect(result.segments[1].fontWeight).toBe('normal');
      
      expect(result.segments[2].text).toBe('italic');
      expect(result.segments[2].fontStyle).toBe('italic');
      
      expect(result.segments[3].text).toBe('text');
      expect(result.segments[3].fontWeight).toBe('normal');
    });

    it('should parse nested tags', () => {
      const result = parser.parseHTML('<b>Bold <i>and italic</i></b>');
      
      expect(result.segments).toHaveLength(2);
      
      expect(result.segments[0].text).toBe('Bold');
      expect(result.segments[0].fontWeight).toBe('bold');
      expect(result.segments[0].fontStyle).toBe('normal');
      
      expect(result.segments[1].text).toBe('and italic');
      expect(result.segments[1].fontWeight).toBe('bold');
      expect(result.segments[1].fontStyle).toBe('italic');
    });

    it('should handle hyperlinks', () => {
      const result = parser.parseHTML('<a href="https://example.com">Link text</a>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Link text');
      expect(result.segments[0].color).toBe('#0066CC');
      expect(result.segments[0].textDecoration).toBe('underline');
    });

    it('should handle code tags', () => {
      const result = parser.parseHTML('<code>console.log("Hello")</code>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('console.log("Hello")');
    });

    it('should handle mark tags', () => {
      const result = parser.parseHTML('<mark>Highlighted text</mark>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Highlighted text');
    });
  });

  describe('validateHTML', () => {
    it('should validate correct HTML', () => {
      const validation = parser.validateHTML('<b>Bold text</b>');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect unclosed tags', () => {
      const validation = parser.validateHTML('<b>Unclosed bold');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unclosed tags: b');
    });

    it('should detect mismatched closing tags', () => {
      const validation = parser.validateHTML('<b>Bold</i>');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Mismatched closing tag/)
        ])
      );
    });

    it('should detect unsupported tags', () => {
      const validation = parser.validateHTML('<unsupported>Text</unsupported>');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unsupported tag: unsupported');
    });

    it('should handle self-closing tags', () => {
      const validation = parser.validateHTML('Line 1<br>Line 2');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid input types', () => {
      const validation1 = parser.validateHTML('');
      expect(validation1.isValid).toBe(false);
      expect(validation1.errors).toContain('Input must be a non-empty string');

      const validation2 = parser.validateHTML(null as any);
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors).toContain('Input must be a non-empty string');
    });
  });

  describe('strategy management', () => {
    it('should register custom strategy', () => {
      const customStrategy: TagStrategy = {
        getTagNames: () => ['custom'],
        applyStyle: (style) => ({ ...style, color: '#ff0000' }),
        validateAttributes: () => ({ isValid: true, errors: [] }),
        parse: (context) => ({
          newSegments: [],
          updatedStyle: { ...context.currentStyle, color: '#ff0000' },
          pushStyleToStack: !context.isClosingTag,
          popFromStyleStack: context.isClosingTag,
          errors: []
        })
      };
      
      parser.registerTagStrategy(customStrategy);
      
      const supportedTags = parser.getSupportedTags();
      expect(supportedTags).toContain('custom');
    });

    it('should remove strategy', () => {
      const result = parser.removeTagStrategy('b');
      expect(result).toBe(true);
      
      const supportedTags = parser.getSupportedTags();
      expect(supportedTags).not.toContain('b');
    });

    it('should check if tag is supported', () => {
      expect(parser.isTagSupported('b')).toBe(true);
      expect(parser.isTagSupported('unsupported')).toBe(false);
    });

    it('should get all supported tags', () => {
      const supportedTags = parser.getSupportedTags();
      
      expect(supportedTags).toContain('b');
      expect(supportedTags).toContain('i');
      expect(supportedTags).toContain('u');
      expect(supportedTags).toContain('span');
      expect(supportedTags).toContain('h1');
      expect(supportedTags).toContain('a');
    });
  });

  describe('parseWithDetails', () => {
    it('should return detailed parsing information', () => {
      const html = '<b>Bold</b> and <i>italic</i>';
      const details = parser.parseWithDetails(html);
      
      expect(details.segments).toHaveLength(3);
      expect(details.errors).toEqual([]);
      expect(details.warnings).toEqual([]);
      expect(details.supportedTags).toContain('b');
      expect(details.supportedTags).toContain('i');
      expect(details.usedTags).toContain('b');
      expect(details.usedTags).toContain('i');
    });

    it('should track used tags', () => {
      const html = '<h1>Title</h1><p>Paragraph with <a href="#">link</a></p>';
      const details = parser.parseWithDetails(html);
      
      expect(details.usedTags).toContain('h1');
      expect(details.usedTags).toContain('p');
      expect(details.usedTags).toContain('a');
    });
  });

  describe('custom strategies', () => {
    it('should work with ColorTagStrategy', () => {
      const colorStrategy = new ColorTagStrategy();
      parser.registerTagStrategy(colorStrategy);
      
      const result = parser.parseHTML('<red>Red text</red>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Red text');
      expect(result.segments[0].color).toBe('#FF0000');
    });
  });

  describe('error handling', () => {
    it('should handle malformed attributes gracefully', () => {
      const result = parser.parseHTML('<span style="color: red; font-weight:">Text</span>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Text');
      // Should still apply valid styles
      expect(result.segments[0].color).toBe('red');
    });

    it('should handle empty tags', () => {
      const result = parser.parseHTML('<b></b>');
      
      expect(result.segments).toHaveLength(0);
    });

    it('should handle text with special characters', () => {
      const result = parser.parseHTML('<b>Special chars: &amp; &lt; &gt;</b>');
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Special chars: &amp; &lt; &gt;');
    });
  });
});
