import { VegaLiteGenerator } from '../src/vega-generator';
import { PositionedTextSegment, HTMLToVegaLiteOptions } from '../src/types';

describe('VegaLiteGenerator', () => {
  let generator: VegaLiteGenerator;
  const defaultOptions: HTMLToVegaLiteOptions = {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif'
  };

  beforeEach(() => {
    generator = new VegaLiteGenerator(defaultOptions);
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultGenerator = new VegaLiteGenerator();
      expect(defaultGenerator).toBeInstanceOf(VegaLiteGenerator);
    });

    it('should create instance with custom options', () => {
      const customOptions = { fontSize: 16, fontFamily: 'Helvetica' };
      const customGenerator = new VegaLiteGenerator(customOptions);
      expect(customGenerator).toBeInstanceOf(VegaLiteGenerator);
    });
  });

  describe('generateSpec', () => {
    it('should generate basic Vega-Lite spec from single segment', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Hello World',
        x: 10,
        y: 30,
        width: 100,
        height: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      }];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec).toHaveProperty('$schema');
      expect(spec.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json');
      expect(spec.width).toBe(200);
      expect(spec.height).toBe(50);
      expect(spec.background).toBe('transparent');
      expect(spec.layer).toHaveLength(1);
    });

    it('should generate spec with multiple layers for different styles', () => {
      const segments: PositionedTextSegment[] = [
        {
          text: 'Normal text',
          x: 10,
          y: 30,
          width: 80,
          height: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000',
          textDecoration: 'none'
        },
        {
          text: 'Bold text',
          x: 100,
          y: 30,
          width: 70,
          height: 14,
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000',
          textDecoration: 'none'
        }
      ];

      const bounds = { width: 300, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec.layer).toHaveLength(2);
      
      const normalLayer = spec.layer.find(layer => layer.mark.fontWeight === 'normal');
      const boldLayer = spec.layer.find(layer => layer.mark.fontWeight === 'bold');
      
      expect(normalLayer).toBeDefined();
      expect(boldLayer).toBeDefined();
      expect(normalLayer?.data.values).toEqual([
        { id: 0, text: 'Normal text', x: 10, y: 30, width: 80, height: 14 }
      ]);
      expect(boldLayer?.data.values).toEqual([
        { id: 1, text: 'Bold text', x: 100, y: 30, width: 70, height: 14 }
      ]);
    });

    it('should group segments with same style into single layer', () => {
      const segments: PositionedTextSegment[] = [
        {
          text: 'First bold',
          x: 10,
          y: 30,
          width: 80,
          height: 14,
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000',
          textDecoration: 'none'
        },
        {
          text: 'Second bold',
          x: 100,
          y: 30,
          width: 90,
          height: 14,
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#000000',
          textDecoration: 'none'
        }
      ];

      const bounds = { width: 300, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec.layer).toHaveLength(1);
      expect(spec.layer[0].data.values).toHaveLength(2);
      expect(spec.layer[0].mark.fontWeight).toBe('bold');
    });

    it('should handle different colors correctly', () => {
      const segments: PositionedTextSegment[] = [
        {
          text: 'Red text',
          x: 10,
          y: 30,
          width: 60,
          height: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#FF0000',
          textDecoration: 'none'
        },
        {
          text: 'Blue text',
          x: 80,
          y: 30,
          width: 70,
          height: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#0000FF',
          textDecoration: 'none'
        }
      ];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec.layer).toHaveLength(2);
      
      const redLayer = spec.layer.find(layer => layer.mark.color === '#FF0000');
      const blueLayer = spec.layer.find(layer => layer.mark.color === '#0000FF');
      
      expect(redLayer).toBeDefined();
      expect(blueLayer).toBeDefined();
    });

    it('should handle italic font style', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Italic text',
        x: 10,
        y: 30,
        width: 80,
        height: 14,
        fontWeight: 'normal',
        fontStyle: 'italic',
        color: '#000000',
        textDecoration: 'none'
      }];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec.layer[0].mark.fontStyle).toBe('italic');
    });

    it('should handle text decoration', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Underlined text',
        x: 10,
        y: 30,
        width: 100,
        height: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'underline'
      }];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec.layer).toHaveLength(2); // Text layer + underline layer
      
      // First layer should be text
      expect(spec.layer[0].mark.type).toBe('text');
      
      // Second layer should be underline rule
      expect(spec.layer[1].mark.type).toBe('rule');
      expect(spec.layer[1].data.values[0]).toHaveProperty('x2');
    });

    it('should apply override options', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Test text',
        x: 10,
        y: 30,
        width: 70,
        height: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      }];

      const bounds = { width: 200, height: 50 };
      const overrideOptions = { background: '#FFFFFF' };
      const spec = generator.generateSpec(segments, bounds, overrideOptions);

      expect(spec.background).toBe('#FFFFFF');
    });

    it('should set correct encoding properties', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Test',
        x: 10,
        y: 30,
        width: 40,
        height: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      }];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      const layer = spec.layer[0];
      expect(layer.encoding.x).toEqual({
        field: 'x',
        type: 'quantitative',
        axis: null,
        scale: null
      });
      expect(layer.encoding.y).toEqual({
        field: 'y',
        type: 'quantitative',
        axis: null,
        scale: null
      });
      expect(layer.encoding.text).toEqual({
        field: 'text',
        type: 'nominal'
      });
    });

    it('should handle empty segments array', () => {
      const segments: PositionedTextSegment[] = [];
      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec.layer).toHaveLength(0);
      expect(spec.width).toBe(200);
      expect(spec.height).toBe(50);
    });
  });

  describe('generateMinimalSpec', () => {
    it('should generate minimal spec with single text', () => {
      const spec = generator.generateMinimalSpec('Hello World');

      expect(spec.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json');
      expect(spec.width).toBe(200);
      expect(spec.height).toBe(50);
      expect(spec.background).toBe('transparent');
      expect(spec.layer).toHaveLength(1);
      
      const layer = spec.layer[0];
      expect(layer.data.values).toEqual([
        { id: 0, text: 'Hello World', x: 10, y: 20 }
      ]);
      expect(layer.mark.type).toBe('text');
      expect(layer.mark.fontSize).toBe(14);
      expect(layer.mark.fontFamily).toBe('Arial, sans-serif');
      expect(layer.mark.fontWeight).toBe('normal');
      expect(layer.mark.fontStyle).toBe('normal');
      expect(layer.mark.color).toBe('#000000');
    });

    it('should use generator font settings in minimal spec', () => {
      const customGenerator = new VegaLiteGenerator({ 
        fontSize: 18, 
        fontFamily: 'Times New Roman' 
      });
      
      const spec = customGenerator.generateMinimalSpec('Test');

      expect(spec.layer[0].mark.fontSize).toBe(18);
      expect(spec.layer[0].mark.fontFamily).toBe('Times New Roman');
    });
  });

  describe('updateOptions', () => {
    it('should update fontSize', () => {
      generator.updateOptions({ fontSize: 16 });
      
      const spec = generator.generateMinimalSpec('Test');
      expect(spec.layer[0].mark.fontSize).toBe(16);
    });

    it('should update fontFamily', () => {
      generator.updateOptions({ fontFamily: 'Helvetica' });
      
      const spec = generator.generateMinimalSpec('Test');
      expect(spec.layer[0].mark.fontFamily).toBe('Helvetica');
    });

    it('should update multiple options', () => {
      generator.updateOptions({ 
        fontSize: 20, 
        fontFamily: 'Georgia' 
      });
      
      const spec = generator.generateMinimalSpec('Test');
      expect(spec.layer[0].mark.fontSize).toBe(20);
      expect(spec.layer[0].mark.fontFamily).toBe('Georgia');
    });

    it('should ignore undefined options', () => {
      const originalSpec = generator.generateMinimalSpec('Test');
      
      generator.updateOptions({ fontSize: undefined });
      
      const newSpec = generator.generateMinimalSpec('Test');
      expect(newSpec.layer[0].mark.fontSize).toBe(originalSpec.layer[0].mark.fontSize);
    });
  });

  describe('style grouping', () => {
    it('should create unique style keys for different combinations', () => {
      const segments: PositionedTextSegment[] = [
        {
          text: 'Normal',
          x: 0, y: 0, width: 50, height: 14,
          fontWeight: 'normal', fontStyle: 'normal', color: '#000000', textDecoration: 'none'
        },
        {
          text: 'Bold',
          x: 50, y: 0, width: 40, height: 14,
          fontWeight: 'bold', fontStyle: 'normal', color: '#000000', textDecoration: 'none'
        },
        {
          text: 'Bold Italic',
          x: 90, y: 0, width: 80, height: 14,
          fontWeight: 'bold', fontStyle: 'italic', color: '#000000', textDecoration: 'none'
        },
        {
          text: 'Red Bold',
          x: 170, y: 0, width: 70, height: 14,
          fontWeight: 'bold', fontStyle: 'normal', color: '#FF0000', textDecoration: 'none'
        }
      ];

      const bounds = { width: 300, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      // Should create 4 different layers for 4 different style combinations
      expect(spec.layer).toHaveLength(4);
    });

    it('should group segments with identical styles', () => {
      const segments: PositionedTextSegment[] = [
        {
          text: 'First',
          x: 0, y: 0, width: 40, height: 14,
          fontWeight: 'bold', fontStyle: 'normal', color: '#000000', textDecoration: 'none'
        },
        {
          text: 'Normal text',
          x: 40, y: 0, width: 80, height: 14,
          fontWeight: 'normal', fontStyle: 'normal', color: '#000000', textDecoration: 'none'
        },
        {
          text: 'Second',
          x: 120, y: 0, width: 50, height: 14,
          fontWeight: 'bold', fontStyle: 'normal', color: '#000000', textDecoration: 'none'
        }
      ];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      // Should create 2 layers: one for bold, one for normal
      expect(spec.layer).toHaveLength(2);
      
      const boldLayer = spec.layer.find(layer => layer.mark.fontWeight === 'bold');
      expect(boldLayer?.data.values).toHaveLength(2); // "First" and "Second"
    });
  });

  describe('Vega-Lite spec structure', () => {
    it('should include all required Vega-Lite properties', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Test',
        x: 10, y: 30, width: 40, height: 14,
        fontWeight: 'normal', fontStyle: 'normal', color: '#000000', textDecoration: 'none'
      }];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      expect(spec).toHaveProperty('$schema');
      expect(spec).toHaveProperty('width');
      expect(spec).toHaveProperty('height');
      expect(spec).toHaveProperty('background');
      expect(spec).toHaveProperty('padding');
      expect(spec).toHaveProperty('autosize');
      expect(spec).toHaveProperty('config');
      expect(spec).toHaveProperty('resolve');
      expect(spec).toHaveProperty('layer');
      
      expect(spec.config).toHaveProperty('view');
      expect(spec.resolve).toHaveProperty('scale');
    });

    it('should set correct mark properties', () => {
      const segments: PositionedTextSegment[] = [{
        text: 'Test',
        x: 10, y: 30, width: 40, height: 14,
        fontWeight: 'bold', fontStyle: 'italic', color: '#FF0000', textDecoration: 'underline'
      }];

      const bounds = { width: 200, height: 50 };
      const spec = generator.generateSpec(segments, bounds);

      const mark = spec.layer[0].mark;
      expect(mark.type).toBe('text');
      expect(mark.fontSize).toBe(14);
      expect(mark.fontFamily).toBe('Arial, sans-serif');
      expect(mark.fontWeight).toBe('bold');
      expect(mark.fontStyle).toBe('italic');
      expect(mark.color).toBe('#FF0000');
      expect(mark.align).toBe('left');
      expect(mark.baseline).toBe('top');
    });
  });
});
