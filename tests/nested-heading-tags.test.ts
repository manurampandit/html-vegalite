import { HTMLToVegaLite } from '../src/index';

describe('Nested Tags in Headings', () => {
  let converter: HTMLToVegaLite;

  beforeEach(() => {
    converter = new HTMLToVegaLite();
  });

  describe('Style Inheritance and Line Positioning', () => {
    it('should maintain heading font size and weight through nested span tags', () => {
      const html = '<h2>My<span style="color: purple">Custom</span> Example</h2>';
      const spec = converter.convert(html);

      // Should create two layers: one for black text, one for purple
      expect(spec.layer).toHaveLength(2);

      // Find the layers
      const blackLayer = spec.layer.find(layer => layer.mark.color === '#000000');
      const purpleLayer = spec.layer.find(layer => layer.mark.color === 'purple');

      expect(blackLayer).toBeDefined();
      expect(purpleLayer).toBeDefined();

      // Both layers should have H2 styling
      if (blackLayer && purpleLayer) {
        expect(blackLayer.mark.fontWeight).toBe('bold');
        expect(blackLayer.mark.fontSize).toBe(24);
        expect(purpleLayer.mark.fontWeight).toBe('bold');
        expect(purpleLayer.mark.fontSize).toBe(24);

        // Black layer should contain "My" and "Example" (whitespace normalized)
        const blackTexts = blackLayer.data.values.map(v => v.text);
        expect(blackTexts).toContain('My');
        expect(blackTexts).toContain('Example');

        // Purple layer should contain "Custom"
        const purpleTexts = purpleLayer.data.values.map(v => v.text);
        expect(purpleTexts).toContain('Custom');

        // All text should be on the same line (within 5px tolerance)
        const allValues = [
          ...blackLayer.data.values,
          ...purpleLayer.data.values
        ];
        
        const yPositions = allValues.map(v => v.y);
        const minY = Math.min(...yPositions);
        const maxY = Math.max(...yPositions);
        
        expect(maxY - minY).toBeLessThan(5); // Should be on same line
      }
    });

    it('should handle multiple nested tags in headings', () => {
      const html = '<h1>Title <b>with</b> <i>nested</i> <span style="color: red">tags</span></h1>';
      const spec = converter.convert(html);

      // All layers should have H1 styling
      spec.layer.forEach(layer => {
        expect(layer.mark.fontWeight).toBe('bold');
        expect(layer.mark.fontSize).toBe(32); // H1 size
      });

      // Should have appropriate color groupings
      const hasBlackLayer = spec.layer.some(layer => layer.mark.color === '#000000');
      const hasRedLayer = spec.layer.some(layer => layer.mark.color === 'red');
      
      expect(hasBlackLayer).toBe(true);
      expect(hasRedLayer).toBe(true);
    });

    it('should preserve heading spacing with nested tags', () => {
      const html = '<h2>Styled <span style="color: blue">Heading</span></h2><p>Following paragraph</p>';
      const spec = converter.convert(html);

      // Get all text values sorted by Y position
      const allValues = spec.layer.flatMap(layer => 
        layer.data.values.filter(v => v.text.trim() && v.text !== '\n')
      ).sort((a, b) => a.y - b.y);

      expect(allValues.length).toBeGreaterThan(2);

      // Find heading and paragraph elements
      const headingItems = spec.layer
        .filter(layer => layer.mark.fontSize === 24) // H2
        .flatMap(layer => layer.data.values);
      
      const paragraphItems = spec.layer
        .filter(layer => layer.mark.fontSize === 14) // Default paragraph size
        .flatMap(layer => layer.data.values);

      if (headingItems.length > 0 && paragraphItems.length > 0) {
        const maxHeadingY = Math.max(...headingItems.map(v => v.y));
        const minParagraphY = Math.min(...paragraphItems.map(v => v.y));
        
        // Should have proper spacing between heading and paragraph
        const spacing = minParagraphY - maxHeadingY;
        expect(spacing).toBeGreaterThan(20); // Should have H2-level spacing
        expect(spacing).toBeLessThan(80); // But not excessive
      }
    });
  });

  describe('Complex Nesting Scenarios', () => {
    it('should handle deeply nested tags', () => {
      const html = '<h3>Deep <span style="color: green">nested <b>bold</b> content</span> here</h3>';
      const spec = converter.convert(html);

      // All layers should maintain H3 properties
      spec.layer.forEach(layer => {
        expect(layer.mark.fontWeight).toBe('bold'); // H3 is bold
        expect(layer.mark.fontSize).toBe(18.72); // H3 size
      });

      // Should have green and black color layers
      const colors = spec.layer.map(layer => layer.mark.color);
      expect(colors).toContain('#000000'); // Black for "Deep" and "here"
      expect(colors).toContain('green'); // Green for nested content
    });

    it('should handle span with multiple CSS properties', () => {
      const html = '<h4>Text with <span style="color: orange; font-weight: normal">styled span</span> end</h4>';
      const spec = converter.convert(html);

      // Find the layers
      const normalLayer = spec.layer.find(layer => layer.mark.color === '#000000' && layer.mark.fontWeight === 'bold');
      const spanLayer = spec.layer.find(layer => layer.mark.color === 'orange');

      expect(normalLayer).toBeDefined();
      expect(spanLayer).toBeDefined();

      if (normalLayer && spanLayer) {
        // Normal layer should have H4 styling
        expect(normalLayer.mark.fontSize).toBe(16); // H4 size
        expect(normalLayer.mark.fontWeight).toBe('bold');

        // Span layer should have orange color, H4 font size, but normal weight due to CSS
        expect(spanLayer.mark.fontSize).toBe(16); // Still H4 size
        expect(spanLayer.mark.color).toBe('orange');
        expect(spanLayer.mark.fontWeight).toBe('normal'); // CSS font-weight: normal overrides H4 boldness
      }
    });
  });
});
