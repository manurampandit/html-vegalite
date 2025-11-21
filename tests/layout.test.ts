import { TextLayoutEngine } from '../src/layout';
import { TextSegment, HTMLToVegaLiteOptions } from '../src/types';

describe('TextLayoutEngine', () => {
  let layoutEngine: TextLayoutEngine;
  const defaultOptions: HTMLToVegaLiteOptions = {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    startX: 10,
    startY: 30,
    lineHeight: 20,
    maxWidth: 400
  };

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine(defaultOptions);
  });

  describe('constructor', () => {
    it('should create instance with options', () => {
      const customOptions = { ...defaultOptions, fontSize: 16, startX: 20 };
      const customEngine = new TextLayoutEngine(customOptions);
      
      expect(customEngine).toBeInstanceOf(TextLayoutEngine);
    });
  });

  describe('layoutSegments', () => {
    it('should layout single text segment', () => {
      const segments: TextSegment[] = [{
        text: 'Hello World',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      }];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned).toHaveLength(1);
      expect(positioned[0].text).toBe('Hello World');
      expect(positioned[0].x).toBe(12); // startX (offset for unstyled text)
      expect(positioned[0].y).toBe(36); // startY
      expect(positioned[0].fontWeight).toBe('normal');
      expect(positioned[0].fontStyle).toBe('normal');
      expect(positioned[0].color).toBe('#000000');
    });

    it('should layout multiple segments on same line', () => {
      const segments: TextSegment[] = [
        {
          text: 'Hello ',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000'
        },
        {
          text: 'World',
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000'
        }
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned).toHaveLength(2);
      expect(positioned[0].x).toBe(10);
      expect(positioned[1].x).toBeGreaterThan(positioned[0].x);
      expect(positioned[0].y).toBe(positioned[1].y); // Same line
    });

    it('should wrap text when maxWidth is exceeded', () => {
      const longText = 'This is a very long text that should definitely exceed the maximum width and wrap to the next line';
      const segments: TextSegment[] = [{
        text: longText,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      }];

      const positioned = layoutEngine.layoutSegments(segments, 200); // Small width

      expect(positioned.length).toBeGreaterThan(1);
      
      // Check that some segments are on different lines
      const yPositions = positioned.map(p => p.y);
      const uniqueYPositions = [...new Set(yPositions)];
      expect(uniqueYPositions.length).toBeGreaterThan(1);
    });

    it('should handle empty segments', () => {
      const segments: TextSegment[] = [];
      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned).toHaveLength(0);
    });

    it('should handle segments with empty text', () => {
      const segments: TextSegment[] = [{
        text: '',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      }];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned).toHaveLength(1);
      expect(positioned[0].text).toBe('');
      expect(positioned[0].x).toBe(10);
      expect(positioned[0].y).toBe(36);
    });

    it('should position segments with different font weights correctly', () => {
      const segments: TextSegment[] = [
        {
          text: 'Normal ',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000'
        },
        {
          text: 'Bold',
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000'
        }
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned).toHaveLength(2);
      expect(positioned[0].fontWeight).toBe('normal');
      expect(positioned[1].fontWeight).toBe('bold');
      expect(positioned[1].x).toBeGreaterThan(positioned[0].x);
    });

    it('should handle different font styles', () => {
      const segments: TextSegment[] = [
        {
          text: 'Normal ',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000'
        },
        {
          text: 'Italic',
          fontWeight: 'normal',
          fontStyle: 'italic',
          color: '#000000'
        }
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned).toHaveLength(2);
      expect(positioned[0].fontStyle).toBe('normal');
      expect(positioned[1].fontStyle).toBe('italic');
    });

    it('should preserve text decorations', () => {
      const segments: TextSegment[] = [{
        text: 'Underlined text',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'underline'
      }];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned[0].textDecoration).toBe('underline');
    });

    it('should handle colors correctly', () => {
      const segments: TextSegment[] = [{
        text: 'Red text',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#FF0000'
      }];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned[0].color).toBe('#FF0000');
    });
  });

  describe('calculateBounds', () => {
    it('should calculate bounds for single segment', () => {
      const positioned = [{
        text: 'Hello',
        x: 10,
        y: 30,
        width: 50,
        height: 14,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        color: '#000000'
      }];

      const bounds = layoutEngine.calculateBounds(positioned);

      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });

    it('should calculate bounds for multiple segments', () => {
      const positioned = [
        {
          text: 'First line',
          x: 10,
          y: 30,
          width: 80,
          height: 14,
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          color: '#000000'
        },
        {
          text: 'Second line',
          x: 10,
          y: 50,
          width: 90,
          height: 14,
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          color: '#000000'
        }
      ];

      const bounds = layoutEngine.calculateBounds(positioned);

      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(20); // Should span multiple lines
    });

    it('should handle empty positioned segments', () => {
      const bounds = layoutEngine.calculateBounds([]);

      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });

    it('should calculate correct bounds for segments at different positions', () => {
      const positioned = [
        {
          text: 'Left',
          x: 0,
          y: 0,
          width: 40,
          height: 14,
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          color: '#000000'
        },
        {
          text: 'Right',
          x: 100,
          y: 50,
          width: 50,
          height: 14,
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          color: '#000000'
        }
      ];

      const bounds = layoutEngine.calculateBounds(positioned);

      expect(bounds.width).toBeGreaterThan(100);
      expect(bounds.height).toBeGreaterThan(50);
    });
  });

  describe('updateOptions', () => {
    it('should update layout options', () => {
      const newOptions = {
        fontSize: 16,
        startX: 20,
        startY: 40,
        lineHeight: 24
      };

      layoutEngine.updateOptions(newOptions);

      // Test that new options are applied by creating new segments
      const segments: TextSegment[] = [{
        text: 'Test',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      }];

      const positioned = layoutEngine.layoutSegments(segments);

      expect(positioned[0].x).toBe(20); // New startX
      expect(positioned[0].y).toBe(48); // New startY (Change in vertical positioning after Heading)
    });
  });

  describe('text measurement', () => {
    it('should estimate text width reasonably', () => {
      const segments: TextSegment[] = [
        {
          text: 'Short',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000'
        },
        {
          text: 'Much longer text',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000'
        }
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      // The longer text should have a greater advance (next position)
      const shortAdvance = positioned[0].x + (positioned[0].text.length * 8); // Rough estimate
      const longAdvance = positioned[1].x + (positioned[1].text.length * 8); // Rough estimate

      expect(longAdvance).toBeGreaterThan(shortAdvance);
    });

    it('should handle bold text width estimation', () => {
      const segments: TextSegment[] = [
        {
          text: 'Normal text',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000'
        },
        {
          text: 'Bold text',
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000'
        }
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      // Both should be positioned, bold might be slightly different
      expect(positioned).toHaveLength(2);
      expect(positioned[0].fontWeight).toBe('normal');
      expect(positioned[1].fontWeight).toBe('bold');
    });

    it('should handle space between two adjecent tags', () => {
      const segments: TextSegment[] = [
        {
          text: 'italics text',
          fontWeight: 'normal',
          fontStyle: 'italic',
          color: '#000000',
          hasSpaceAfter: true,
          spacingContext: 'tag-to-tag'
        },
        {
          text: 'Bold text',
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000',
          hasSpaceAfter: false
        }
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      // Both should be positioned, with a space between the two segements.
      expect(positioned).toHaveLength(2);
      expect(positioned[0].fontStyle).toBe('italic');
      expect(positioned[0].fontWeight).toBe('normal');
      expect(positioned[1].fontWeight).toBe('bold');
      expect(positioned[1].fontStyle).toBe('normal');

      // Check X positioning
      const firstSegmentRight = positioned[0].x + positioned[0].width;
      const secondSegmentX = positioned[1].x;  

      // Measure expected space width
      const spaceWidth = layoutEngine.measureText(' ', positioned[0]).width;

      // Assert controlled tag-to-tag spacing (maximum 7px to avoid excessive gaps)
      // This is a tag-to-tag transition (italic -> bold) which gets controlled spacing
      expect(secondSegmentX - firstSegmentRight).toBeGreaterThanOrEqual(3);
      expect(secondSegmentX - firstSegmentRight).toBeLessThanOrEqual(8);
    });

    it('should have appropriate vertical spacing for heading tag', () => {
      const segments: TextSegment[] = [
        {
          text: 'Heading 1',
          fontSize: 32,
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000'
        },
      ];

      const positioned = layoutEngine.layoutSegments(segments);

      // Both should be positioned, with adequate vertical spacing
      expect(positioned).toHaveLength(1);
      expect(positioned[0].fontSize).toBe(32);
      expect(positioned[0].y).toBe(30);
    });
  });

  describe('line wrapping', () => {
    it('should wrap long text to new lines', () => {
      const longText = 'This is a very long piece of text that should definitely exceed the maximum width and therefore be wrapped to multiple lines to test the line wrapping functionality';
      
      const segments: TextSegment[] = [{
        text: longText,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      }];

      const positioned = layoutEngine.layoutSegments(segments, 300);

      // Should create multiple segments
      expect(positioned.length).toBeGreaterThan(1);

      // Should have different Y positions (multiple lines)
      const yPositions = positioned.map(p => p.y);
      const uniqueYs = [...new Set(yPositions)];
      expect(uniqueYs.length).toBeGreaterThan(1);

      // All segments should start at the left margin (except continuing lines)
      const firstLineSegments = positioned.filter(p => p.y === Math.min(...yPositions));
      expect(firstLineSegments[0].x).toBe(10); // startX
    });

    it('should maintain proper line spacing', () => {
      const segments: TextSegment[] = [{
        text: 'Line one that is long enough to wrap to multiple lines for testing',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      }];

      const positioned = layoutEngine.layoutSegments(segments, 200);

      if (positioned.length > 1) {
        const yPositions = positioned.map(p => p.y);
        const uniqueYs = [...new Set(yPositions)].sort((a, b) => a - b);
        
        if (uniqueYs.length > 1) {
          const lineSpacing = uniqueYs[1] - uniqueYs[0];
          expect(lineSpacing).toBe(20); // Default lineHeight stays the same
        }
      }
    });
  });
});
