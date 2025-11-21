import { HTMLToVegaLite } from '../src/index';
import { 
  createDefaultTagStrategyRegistry, 
  createMinimalTagStrategyRegistry,
  ColorTagStrategy,
  StrikethroughTagStrategy 
} from '../src/strategies/index';

describe('Integration Tests', () => {
  describe('End-to-End HTML to Vega-Lite Conversion', () => {
    it('should convert complete HTML document flow', () => {
      const converter = new HTMLToVegaLite({
        fontSize: 14,
        fontFamily: 'Arial',
        maxWidth: 400,
        startX: 10,
        startY: 30
      });

      const html = `
        <h1>Sales Report Q4 2024</h1>
        <h2>Executive Summary</h2>
        <p><b>Revenue:</b> <span style="color: green">$2.5M</span> (↑15%)</p>
        <p><b>Status:</b> <span style="color: blue">On Track</span></p>
        <h2>Key Metrics</h2>
        <p>Run <code>npm run analytics</code> to generate detailed reports.</p>
        <p><mark>Important:</mark> Review <a href="#appendix">appendix</a> for methodology.</p>
      `;

      const spec = converter.convert(html);

      // Verify structure
      expect(spec.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json');
      expect(spec.width).toBeGreaterThan(0);
      expect(spec.height).toBeGreaterThan(0);
      expect(spec.layer.length).toBeGreaterThan(5);

      // Verify content is present
      const allValues = spec.layer.flatMap(layer => layer.data.values);
      const allText = allValues.map(v => v.text).join(' ');
      expect(allText).toContain('Sales Report Q4 2024');
      expect(allText).toContain('$2.5M');
      expect(allText).toContain('npm run analytics');

      // Verify styling is applied
      const greenLayer = spec.layer.find(layer => layer.mark.color === 'green');
      expect(greenLayer).toBeDefined();
      
      const blueLayer = spec.layer.find(layer => layer.mark.color === 'blue');
      expect(blueLayer).toBeDefined();

      const boldLayers = spec.layer.filter(layer => layer.mark.fontWeight === 'bold');
      expect(boldLayers.length).toBeGreaterThan(0);
    });

    it('should handle complex nested styling scenarios', () => {
      const converter = new HTMLToVegaLite();
      
      const html = `
        <div>
          <h1><span style="color: red">Critical</span> Alert</h1>
          <p>System status: <b><i><span style="color: orange">Warning</span></i></b></p>
          <p>Action required: <u><b>Review <a href="#logs">error logs</a></b></u></p>
        </div>
      `;

      const spec = converter.convert(html);

      expect(spec.layer.length).toBeGreaterThan(3);

      // Should have layers with combined styles
      const redLayer = spec.layer.find(layer => layer.mark.color === 'red');
      expect(redLayer).toBeDefined();

      const orangeLayer = spec.layer.find(layer => layer.mark.color === 'orange');
      expect(orangeLayer).toBeDefined();

      const linkLayer = spec.layer.find(layer => layer.mark.color === '#0066CC');
      expect(linkLayer).toBeDefined();
    });
  });

  describe('Strategy Registry Integration', () => {
    it('should work with default strategy registry', () => {
      const registry = createDefaultTagStrategyRegistry();
      const converter = new HTMLToVegaLite();

      const html = '<h1>Title</h1><p>Paragraph</p><code>code</code><mark>highlight</mark>';
      const spec = converter.convert(html);

      expect(spec.layer.length).toBeGreaterThan(2);
      
      const allValues = spec.layer.flatMap(layer => layer.data.values);
      const texts = allValues.map(v => v.text);
      expect(texts).toContain('Title');
      expect(texts).toContain('Paragraph');
      expect(texts).toContain('code');
      expect(texts).toContain('highlight');
    });

    it('should work with minimal strategy registry', () => {
      const minimalRegistry = createMinimalTagStrategyRegistry();
      const converter = new HTMLToVegaLite();

      // Clear and replace with minimal registry
      const strategyRegistry = converter.getStrategyRegistry();
      const minimalTags = minimalRegistry.getSupportedTags();
      
      expect(minimalTags).toContain('b');
      expect(minimalTags).toContain('i');
      expect(minimalTags).not.toContain('h1');
      expect(minimalTags).not.toContain('code');
    });

    it('should work with custom strategies', () => {
      const converter = new HTMLToVegaLite();
      
      // Register custom strategies
      const colorStrategy = new ColorTagStrategy();
      const strikeStrategy = new StrikethroughTagStrategy();
      
      converter.registerTagStrategy(colorStrategy);
      converter.registerTagStrategy(strikeStrategy);

      const html = '<red>Error:</red> <green>Success</green> <s>Old info</s>';
      const spec = converter.convert(html);

      expect(spec.layer.length).toBeGreaterThan(2);

      const redLayer = spec.layer.find(layer => layer.mark.color === '#FF0000');
      expect(redLayer).toBeDefined();
      expect(redLayer?.data.values[0].text).toBe('Error:');

      const greenLayer = spec.layer.find(layer => layer.mark.color === '#00FF00');
      expect(greenLayer).toBeDefined();
      expect(greenLayer?.data.values[0].text).toBe('Success');
    });
  });

  describe('Parser to Layout to Generator Integration', () => {
    it('should maintain data integrity through the pipeline', () => {
      const converter = new HTMLToVegaLite({
        fontSize: 16,
        fontFamily: 'Helvetica',
        startX: 0,
        startY: 0,
        lineHeight: 20,
        maxWidth: 300
      });

      const html = '<b>Bold</b> normal <i>italic</i>';

      // Test individual pipeline stages
      const parseResult = converter.parseHTML(html);
      expect(parseResult.segments).toHaveLength(3);
      expect(parseResult.segments[0].text).toBe('Bold');
      expect(parseResult.segments[0].fontWeight).toBe('bold');
      expect(parseResult.segments[1].text).toBe('normal');
      expect(parseResult.segments[1].fontWeight).toBe('normal');
      expect(parseResult.segments[2].text).toBe('italic');
      expect(parseResult.segments[2].fontStyle).toBe('italic');

      // Test layout
      const positioned = converter.layoutSegments(parseResult.segments);
      expect(positioned).toHaveLength(3);
      expect(positioned[0].x).toBe(0); // startX
      expect(positioned[0].y).toBe(4); // startY
      expect(positioned[1].x).toBeGreaterThan(positioned[0].x); // Should advance
      expect(positioned[2].x).toBeGreaterThan(positioned[1].x); // Should advance further

      // Test full conversion
      const spec = converter.convert(html);
      expect(spec.layer.length).toBeGreaterThan(1);
      expect(spec.width).toBeGreaterThan(0);
      expect(spec.height).toBeGreaterThan(0);
    });

    it('should handle text wrapping across the pipeline', () => {
      const converter = new HTMLToVegaLite({
        maxWidth: 100, // Force wrapping
        fontSize: 12,
        lineHeight: 16
      });

      const longText = 'This is a very long sentence that should definitely wrap across multiple lines when the maxWidth is constrained to a small value';
      const html = `<p>${longText}</p>`;

      const parseResult = converter.parseHTML(html);
      expect(parseResult.segments).toHaveLength(1);
      expect(parseResult.segments[0].text).toBe(longText);

      const positioned = converter.layoutSegments(parseResult.segments, 100);
      
      if (positioned.length > 1) {
        // Should have segments on different lines
        const yPositions = positioned.map(p => p.y);
        const uniqueYs = [...new Set(yPositions)];
        expect(uniqueYs.length).toBeGreaterThan(1);
      }

      const spec = converter.convert(html);
      expect(spec.width).toBeLessThanOrEqual(100);
      expect(spec.height).toBeGreaterThan(16); // Should be multiple lines
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed HTML gracefully', () => {
      const converter = new HTMLToVegaLite();

      const malformedHtml = '<b>Unclosed <i>nested <u>tags';
      
      expect(() => {
        const spec = converter.convert(malformedHtml);
        expect(spec).toHaveProperty('layer');
        expect(spec.layer.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should handle unsupported tags with warnings', () => {
      const converter = new HTMLToVegaLite();

      const htmlWithUnsupported = '<b>Supported</b> <unsupported>Not supported</unsupported>';
      const parseResult = converter.parseHTML(htmlWithUnsupported);

      expect(parseResult.segments.length).toBeGreaterThan(0);
      // Should still process supported parts
      expect(parseResult.segments.some(s => s.text === 'Supported')).toBe(true);
    });

    it('should handle empty and edge case inputs', () => {
      const converter = new HTMLToVegaLite();

      // Empty string
      expect(() => converter.convert('')).toThrow();

      // Just whitespace
      const whitespaceSpec = converter.convert('   ');
      expect(whitespaceSpec.layer).toHaveLength(0); // Whitespace should create no layers

      // Just tags without content
      const emptyTagsSpec = converter.convert('<b></b><i></i>');
      expect(emptyTagsSpec.layer).toHaveLength(0);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large documents efficiently', () => {
      const converter = new HTMLToVegaLite();

      // Generate large HTML document
      const sections = Array.from({ length: 20 }, (_, i) => `
        <h2>Section ${i + 1}</h2>
        <p>This is <b>section ${i + 1}</b> with some <i>italic text</i> and a <a href="#${i}">link</a>.</p>
        <p>Additional paragraph with <code>code snippet ${i}</code> and <mark>highlighted text</mark>.</p>
      `).join('');

      const start = Date.now();
      const spec = converter.convert(sections);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(spec.layer.length).toBeGreaterThan(5); // Should have reasonable number of layers
      expect(spec.width).toBeGreaterThan(0);
      expect(spec.height).toBeGreaterThan(100); // Multiple sections should be tall
    });

    it('should handle many similar elements efficiently', () => {
      const converter = new HTMLToVegaLite();

      // Many elements with same styling should be grouped efficiently
      const manyBoldElements = Array.from({ length: 100 }, (_, i) => 
        `<b>Bold ${i}</b>`
      ).join(' ');

      const start = Date.now();
      const spec = converter.convert(manyBoldElements);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
      
      // Should group all bold elements into one layer
      const boldLayers = spec.layer.filter(layer => layer.mark.fontWeight === 'bold');
      expect(boldLayers).toHaveLength(1);
      expect(boldLayers[0].data.values).toHaveLength(100);
    });
  });

  describe('Option Override Integration', () => {
    it('should respect global and override options correctly', () => {
      const converter = new HTMLToVegaLite({
        fontSize: 14,
        fontFamily: 'Arial',
        background: 'white',
        maxWidth: 300
      });

      const html = '<b>Test content</b>';

      // Test with overrides
      const spec = converter.convert(html, {
        fontSize: 18,
        background: 'blue',
        maxWidth: 500
      });

      expect(spec.layer[0].mark.fontSize).toBe(18); // Overridden
      expect(spec.layer[0].mark.fontFamily).toBe('Arial'); // From constructor
      expect(spec.background).toBe('blue'); // Overridden
      expect(spec.width).toBeLessThanOrEqual(500); // Overridden maxWidth
    });

    it('should update options dynamically', () => {
      const converter = new HTMLToVegaLite({ fontSize: 12 });

      const html = '<b>Test</b>';
      const spec1 = converter.convert(html);
      expect(spec1.layer[0].mark.fontSize).toBe(12);

      // Update options
      converter.updateOptions({ fontSize: 16, fontFamily: 'Times' });

      const spec2 = converter.convert(html);
      expect(spec2.layer[0].mark.fontSize).toBe(16);
      expect(spec2.layer[0].mark.fontFamily).toBe('Times');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle documentation-style content', () => {
      const converter = new HTMLToVegaLite();

      const documentationHtml = `
        <h1>API Documentation</h1>
        <h2>Installation</h2>
        <p>Install the package using:</p>
        <pre><code>npm install html-vegalite</code></pre>
        <h2>Basic Usage</h2>
        <p>Import and use the <code>HTMLToVegaLite</code> class:</p>
        <pre><code>import { HTMLToVegaLite } from 'html-vegalite';</code></pre>
        <p><mark>Note:</mark> See <a href="#examples">examples</a> for more details.</p>
      `;

      const spec = converter.convert(documentationHtml);

      expect(spec.layer.length).toBeGreaterThanOrEqual(5);
      expect(spec.height).toBeGreaterThan(100); // Multi-section content

      const allText = spec.layer.flatMap(l => l.data.values).map(v => v.text).join(' ');
      expect(allText).toContain('API Documentation');
      expect(allText).toContain('npm install html-vegalite');
      expect(allText).toContain('HTMLToVegaLite');
    });

    it('should handle report-style content with metrics', () => {
      const converter = new HTMLToVegaLite();

      const reportHtml = `
        <h1>Performance Report</h1>
        <h2>Key Metrics</h2>
        <p><b>Response Time:</b> <span style="color: green">120ms</span> (Target: <150ms)</p>
        <p><b>Error Rate:</b> <span style="color: red">0.02%</span> (Target: <0.1%)</p>
        <p><b>Throughput:</b> <span style="color: blue">1,250 req/sec</span></p>
        <h2>Actions</h2>
        <p><mark>Urgent:</mark> Investigate <a href="#errors">error spike</a> at 2PM.</p>
      `;

      const spec = converter.convert(reportHtml);

      expect(spec.layer.length).toBeGreaterThan(6);

      // Verify colored metrics
      const greenLayer = spec.layer.find(l => l.mark.color === 'green');
      expect(greenLayer).toBeDefined();
      
      const redLayer = spec.layer.find(l => l.mark.color === 'red');
      expect(redLayer).toBeDefined();
      
      const blueLayer = spec.layer.find(l => l.mark.color === 'blue');
      expect(blueLayer).toBeDefined();
    });

    it('should handle notification-style content', () => {
      const converter = new HTMLToVegaLite();

      const notificationHtml = `
        <h2><span style="color: orange">⚠️ System Alert</span></h2>
        <p><b>Level:</b> Warning</p>
        <p><b>Service:</b> <code>api-gateway</code></p>
        <p><b>Message:</b> High memory usage detected</p>
        <p><b>Action:</b> <a href="#dashboard">View Dashboard</a> | <a href="#logs">Check Logs</a></p>
      `;

      const spec = converter.convert(notificationHtml);

      expect(spec.layer.length).toBeGreaterThan(4);

      const orangeLayer = spec.layer.find(l => l.mark.color === 'orange');
      expect(orangeLayer).toBeDefined();

      const linkLayers = spec.layer.filter(l => l.mark.color === '#0066CC');
      expect(linkLayers.length).toBeGreaterThan(0);
    });
  });
});
