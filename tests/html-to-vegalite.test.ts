import { HTMLToVegaLite } from '../src/index';
import { HTMLToVegaLiteOptions } from '../src/types';

describe('HTMLToVegaLite', () => {
  let converter: HTMLToVegaLite;

  beforeEach(() => {
    converter = new HTMLToVegaLite();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultConverter = new HTMLToVegaLite();
      const options = defaultConverter.getOptions();
      
      expect(options.fontSize).toBe(14);
      expect(options.fontFamily).toBe('Arial, sans-serif');
      expect(options.startX).toBe(10);
      expect(options.startY).toBe(30);
      expect(options.maxWidth).toBe(400);
      expect(options.background).toBe('transparent');
    });

    it('should create instance with custom options', () => {
      const customOptions: HTMLToVegaLiteOptions = {
        fontSize: 16,
        fontFamily: 'Helvetica',
        startX: 20,
        startY: 40,
        maxWidth: 500,
        background: '#ffffff'
      };
      
      const customConverter = new HTMLToVegaLite(customOptions);
      const options = customConverter.getOptions();
      
      expect(options.fontSize).toBe(16);
      expect(options.fontFamily).toBe('Helvetica');
      expect(options.startX).toBe(20);
      expect(options.startY).toBe(40);
      expect(options.maxWidth).toBe(500);
      expect(options.background).toBe('#ffffff');
    });

    it('should calculate lineHeight automatically when not provided', () => {
      const converter = new HTMLToVegaLite({ fontSize: 20 });
      const options = converter.getOptions();
      
      expect(options.lineHeight).toBe(28); // 20 * 1.4
    });
  });

  describe('convert', () => {
    it('should convert simple HTML to Vega-Lite spec', () => {
      const html = '<b>Hello World</b>';
      const spec = converter.convert(html);
      
      expect(spec).toHaveProperty('$schema');
      expect(spec).toHaveProperty('layer');
      expect(spec.layer).toHaveLength(1);
      expect(spec.layer[0].data.values).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'Hello World',
            x: expect.any(Number),
            y: expect.any(Number)
          })
        ])
      );
    });

    it('should handle multiple formatted text segments', () => {
      const html = '<b>Bold</b> and <i>italic</i> text';
      const spec = converter.convert(html);
      
      expect(spec.layer).toHaveLength(3); // Bold, italic, and normal text
      
      // Check that we have bold text
      const boldLayer = spec.layer.find(layer => 
        layer.mark.fontWeight === 'bold'
      );
      expect(boldLayer).toBeDefined();
      expect(boldLayer?.data.values).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Bold' })
        ])
      );

      // Check that we have italic text
      const italicLayer = spec.layer.find(layer => 
        layer.mark.fontStyle === 'italic'
      );
      expect(italicLayer).toBeDefined();
      expect(italicLayer?.data.values).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: 'italic' })
        ])
      );
    });

    it('should handle nested formatting', () => {
      const html = '<b>Bold <i>and italic</i></b>';
      const spec = converter.convert(html);
      
      expect(spec.layer.length).toBeGreaterThan(0);
      
      // Should have a layer with both bold and italic
      const boldItalicLayer = spec.layer.find(layer => 
        layer.mark.fontWeight === 'bold' && layer.mark.fontStyle === 'italic'
      );
      expect(boldItalicLayer).toBeDefined();
    });

    it('should handle override options', () => {
      const html = '<b>Test</b>';
      const overrideOptions = { fontSize: 20, maxWidth: 300 };
      const spec = converter.convert(html, overrideOptions);
      
      expect(spec.layer[0].mark.fontSize).toBe(20);
      expect(spec.width).toBeLessThanOrEqual(300);
    });

    it('should throw error for invalid HTML', () => {
      expect(() => converter.convert('')).toThrow();
      expect(() => converter.convert(null as any)).toThrow();
      expect(() => converter.convert(123 as any)).toThrow();
    });
  });

  describe('parseHTML', () => {
    it('should parse HTML and return segments', () => {
      const html = '<b>Bold</b> text';
      const result = converter.parseHTML(html);
      
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].text).toBe('Bold');
      expect(result.segments[0].fontWeight).toBe('bold');
      expect(result.segments[1].text).toBe('text');
      expect(result.segments[1].fontWeight).toBe('normal');
    });

    it('should return errors for malformed HTML', () => {
      const html = '<b>Unclosed bold';
      const result = converter.parseHTML(html);
      
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('updateOptions', () => {
    it('should update options correctly', () => {
      const newOptions = { fontSize: 18, fontFamily: 'Times' };
      converter.updateOptions(newOptions);
      
      const options = converter.getOptions();
      expect(options.fontSize).toBe(18);
      expect(options.fontFamily).toBe('Times');
    });

    it('should recalculate lineHeight when fontSize changes', () => {
      converter.updateOptions({ fontSize: 16 });
      
      const options = converter.getOptions();
      expect(options.lineHeight).toBe(22.4); // 16 * 1.4
    });
  });

  describe('strategy management', () => {
    it('should register custom strategy', () => {
      const mockStrategy = {
        getTagNames: () => ['custom'],
        applyStyle: (style: any) => ({ ...style, color: '#ff0000' }),
        validateAttributes: () => ({ isValid: true, errors: [] })
      };
      
      expect(() => converter.registerTagStrategy(mockStrategy)).not.toThrow();
      
      const strategies = converter.getRegisteredStrategies();
      expect(strategies).toContain('custom');
    });

    it('should unregister strategy', () => {
      const result = converter.unregisterTagStrategy('b');
      expect(result).toBe(true);
      
      const strategies = converter.getRegisteredStrategies();
      expect(strategies).not.toContain('b');
    });
  });

  describe('static convert method', () => {
    it('should work as static method', () => {
      const html = '<b>Static test</b>';
      const spec = HTMLToVegaLite.convert(html);
      
      expect(spec).toHaveProperty('$schema');
      expect(spec).toHaveProperty('layer');
      expect(spec.layer).toHaveLength(1);
    });

    it('should accept options in static method', () => {
      const html = '<b>Static test</b>';
      const options = { fontSize: 20 };
      const spec = HTMLToVegaLite.convert(html, options);
      
      expect(spec.layer[0].mark.fontSize).toBe(20);
    });
  });
});
