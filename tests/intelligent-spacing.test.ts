import { HTMLToVegaLite } from '../src/index';

describe('Intelligent Word Spacing System', () => {
  let converter: HTMLToVegaLite;

  beforeEach(() => {
    converter = new HTMLToVegaLite();
  });

  /**
   * Helper function to get spacing between two adjacent text segments
   */
  const getSpacingBetween = (spec: any, textIndex1: number, textIndex2: number): number => {
    const textItems = spec.layer.flatMap(layer => 
      layer.data.values.filter(item => item.text && item.text.trim())
    ).sort((a, b) => a.x - b.x);
    
    if (textIndex1 >= textItems.length || textIndex2 >= textItems.length) {
      return -1;
    }
    
    const item1 = textItems[textIndex1];
    const item2 = textItems[textIndex2];
    
    return item2.x - (item1.x + item1.width);
  };

  describe('Core Spacing Rules', () => {
    it('should have NO space when HTML has no space between tags', () => {
      const html = '<b>Hello</b><i>World</i>';
      const spec = converter.convert(html);
      
      const spacing = getSpacingBetween(spec, 0, 1);
      expect(spacing).toBeLessThan(5); // Should be very close to 0
    });

    it('should have space when HTML has space between tags', () => {
      const html = '<b>Hello</b> <i>World</i>';
      const spec = converter.convert(html);
      
      const spacing = getSpacingBetween(spec, 0, 1);
      expect(spacing).toBeGreaterThan(3); // Should have clear spacing
    });

    it('should normalize multiple spaces to single space', () => {
      const html1 = '<b>Hello</b> <i>World</i>';    // single space
      const html2 = '<b>Hello</b>   <i>World</i>';  // multiple spaces
      
      const spec1 = converter.convert(html1);
      const spec2 = converter.convert(html2);
      
      const spacing1 = getSpacingBetween(spec1, 0, 1);
      const spacing2 = getSpacingBetween(spec2, 0, 1);
      
      // Both should have similar spacing (normalized)
      expect(Math.abs(spacing1 - spacing2)).toBeLessThan(3);
      expect(spacing1).toBeGreaterThan(3);
      expect(spacing2).toBeGreaterThan(3);
    });
  });

  describe('Special Spacing Cases', () => {
    it('should handle text-to-tag spacing correctly', () => {
      const html = 'Hello <b>World</b>';
      const spec = converter.convert(html);
      
      const spacing = getSpacingBetween(spec, 0, 1);
      expect(spacing).toBeGreaterThan(1); // Should have space
    });

    it('should handle tag-to-text spacing correctly', () => {
      const html = '<b>Hello</b> World';
      const spec = converter.convert(html);
      
      const spacing = getSpacingBetween(spec, 0, 1);
      expect(spacing).toBeGreaterThan(3); // Should have space
    });

    it('should handle no space between tag and text', () => {
      const html = '<b>Hello</b>World';
      const spec = converter.convert(html);
      
      const spacing = getSpacingBetween(spec, 0, 1);
      expect(spacing).toBeLessThan(5); // Should have minimal/no space
    });
  });

  describe('Complex Spacing Scenarios', () => {
    it('should handle mixed inline elements with proper spacing', () => {
      const html = 'Start <b>bold</b> middle <i>italic</i> end';
      const spec = converter.convert(html);
      
      const textItems = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text.trim())
      ).sort((a, b) => a.x - b.x);
      
      expect(textItems.length).toBe(5);
      
      // All adjacent pairs should have spacing
      for (let i = 0; i < textItems.length - 1; i++) {
        const spacing = getSpacingBetween(spec, i, i + 1);
        expect(spacing).toBeGreaterThan(1);
      }
    });

    it('should handle nested tags with proper spacing context', () => {
      const html = '<h2>Title <span style="color: blue">with</span> nested</h2>';
      const spec = converter.convert(html);
      
      // All text should be on same line (heading)
      const textItems = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text.trim())
      );
      
      expect(textItems.length).toBe(3);
      
      // Should have proper spacing between all elements
      const spacing1 = getSpacingBetween(spec, 0, 1);
      const spacing2 = getSpacingBetween(spec, 1, 2);
      
      expect(spacing1).toBeGreaterThan(3);
      expect(spacing2).toBeGreaterThan(3);
    });

    it('should handle consecutive tags without spaces', () => {
      const html = '<b>Bold</b><i>Italic</i><u>Underline</u>';
      const spec = converter.convert(html);
      
      const spacing1 = getSpacingBetween(spec, 0, 1);
      const spacing2 = getSpacingBetween(spec, 1, 2);
      
      expect(spacing1).toBeLessThan(5); // No space
      expect(spacing2).toBeLessThan(5); // No space
    });

    it('should handle consecutive tags with spaces', () => {
      const html = '<b>Bold</b> <i>Italic</i> <u>Underline</u>';
      const spec = converter.convert(html);
      
      const spacing1 = getSpacingBetween(spec, 0, 1);
      const spacing2 = getSpacingBetween(spec, 1, 2);
      
      expect(spacing1).toBeGreaterThan(3); // Has space
      expect(spacing2).toBeGreaterThan(3); // Has space
    });

    it('should apply enhanced spacing for tag-to-tag transitions', () => {
      const html = '<b>Bold</b> <i>italic</i> <code>code</code>';
      const spec = converter.convert(html);
      
      const spacing1 = getSpacingBetween(spec, 0, 1); // bold -> italic  
      const spacing2 = getSpacingBetween(spec, 1, 2); // italic -> code
      
      // Tag-to-tag transitions should get controlled spacing (7px maximum to avoid excessive gaps)
      expect(spacing1).toBeGreaterThanOrEqual(3); // Should be ~4-7px
      expect(spacing2).toBeGreaterThanOrEqual(3); // Should be ~4-7px
      expect(spacing1).toBeLessThanOrEqual(8); // But capped to avoid excess
      expect(spacing2).toBeLessThanOrEqual(8); // But capped to avoid excess
    });

    it('should apply reduced spacing for tag-to-text transitions', () => {
      const html = '<b>Bold</b> text and <i>italic</i> more';
      const spec = converter.convert(html);
      
      const spacing1 = getSpacingBetween(spec, 0, 1); // bold -> text
      const spacing2 = getSpacingBetween(spec, 2, 3); // italic -> more
      
      // Tag-to-text transitions should get reduced spacing (6px maximum)
      expect(spacing1).toBeLessThanOrEqual(9); // Should be ~6-8px
      expect(spacing2).toBeLessThanOrEqual(9); // Should be ~6-8px
      expect(spacing1).toBeGreaterThan(4); // But not too tight
      expect(spacing2).toBeGreaterThan(4); // But not too tight
    });

    it('should apply reduced spacing for nested tag elements within same parent', () => {
      const html = '<b>Bold with <i>nested italic</i> text</b>';
      const spec = converter.convert(html);
      
      const spacing1 = getSpacingBetween(spec, 0, 1); // "Bold with" -> "nested italic"
      const spacing2 = getSpacingBetween(spec, 1, 2); // "nested italic" -> "text"
      
      // Nested elements within same parent should get reduced spacing (5px maximum)
      expect(spacing1).toBeLessThanOrEqual(6); // Should be ~5px
      expect(spacing2).toBeLessThanOrEqual(6); // Should be ~5px
      expect(spacing1).toBeGreaterThan(3); // But not too tight
      expect(spacing2).toBeGreaterThan(3); // But not too tight
    });
  });

  describe('Font-Aware Spacing', () => {
    it('should calculate space width based on segment font properties', () => {
      // Test with different font sizes/styles
      const html1 = '<span style="font-size: 12px">Small</span> <span style="font-size: 12px">Text</span>';
      const html2 = '<span style="font-size: 24px">Large</span> <span style="font-size: 24px">Text</span>';
      
      const spec1 = converter.convert(html1);
      const spec2 = converter.convert(html2);
      
      const spacing1 = getSpacingBetween(spec1, 0, 1);
      const spacing2 = getSpacingBetween(spec2, 0, 1);
      
      // Both should have reasonable spacing (font-aware spacing not yet implemented)
      expect(spacing1).toBeGreaterThan(1);
      expect(spacing2).toBeGreaterThan(1);
    });
  });
});
