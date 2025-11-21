import { HTMLParser } from './parser';
import { TextLayoutEngine } from './layout';
import { VegaLiteGenerator } from './vega-generator';
import { 
  HTMLToVegaLiteOptions, 
  VegaLiteSpec, 
  TextSegment, 
  PositionedTextSegment,
  ParseResult 
} from './types';

/**
 * Main HTML to Vega-Lite converter class
 * Combines parsing, layout, and generation into a simple API
 */
export class HTMLToVegaLite {
  private parser: HTMLParser;
  private layoutEngine: TextLayoutEngine;
  private generator: VegaLiteGenerator;
  private options: HTMLToVegaLiteOptions;

  constructor(options: HTMLToVegaLiteOptions = {}) {
    this.options = {
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      startX: 10,
      startY: 30,
      lineHeight: undefined, 
      maxWidth: 400,
      background: 'transparent',
      ...options
    };

    // Calculate line height if not provided
    if (!this.options.lineHeight) {
      this.options.lineHeight = (this.options.fontSize ?? 14) * 1.4;
    }

    this.parser = new HTMLParser();
    this.layoutEngine = new TextLayoutEngine(this.options);
    this.generator = new VegaLiteGenerator(this.options);
  }

  /**
   * Convert HTML string to Vega-Lite specification
   * Main API method for end users
   */
  public convert(html: string, overrideOptions: Partial<HTMLToVegaLiteOptions> = {}): VegaLiteSpec {
    // Validate input
    if (!html || typeof html !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    // Merge options, but don't pass fontSize unless explicitly overridden
    const mergedOptions = { ...this.options, ...overrideOptions };
    
    // Create options for generator - only include fontSize if explicitly overridden
    const generatorOptions = { ...mergedOptions };
    if (!overrideOptions.hasOwnProperty('fontSize')) {
      delete generatorOptions.fontSize;
    }

    // Parse HTML to text segments
    const parseResult = this.parser.parseHTML(html);
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('HTML parsing warnings:', parseResult.errors);
    }

    // Layout segments with positioning
    const positionedSegments = this.layoutEngine.layoutSegments(
      parseResult.segments, 
      mergedOptions.maxWidth
    );

    // Calculate bounds
    const bounds = this.layoutEngine.calculateBounds(positionedSegments);

    // Generate Vega-Lite specification
    return this.generator.generateSpec(positionedSegments, bounds, generatorOptions);
  }

  /**
   * Parse HTML only (useful for debugging or custom layouts)
   */
  public parseHTML(html: string): ParseResult {
    return this.parser.parseHTML(html);
  }

  /**
   * Layout segments only (useful for custom positioning)
   */
  public layoutSegments(segments: TextSegment[], maxWidth?: number): PositionedTextSegment[] {
    return this.layoutEngine.layoutSegments(segments, maxWidth);
  }

  /**
   * Generate Vega-Lite spec from positioned segments
   */
  public generateSpec(
    segments: PositionedTextSegment[], 
    bounds: { width: number; height: number },
    options: Partial<HTMLToVegaLiteOptions> = {}
  ): VegaLiteSpec {
    return this.generator.generateSpec(segments, bounds, options);
  }

  /**
   * Update configuration options
   */
  public updateOptions(newOptions: Partial<HTMLToVegaLiteOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Update line height if fontSize changed and lineHeight wasn't explicitly set
    if (newOptions.fontSize && !newOptions.lineHeight) {
      this.options.lineHeight = newOptions.fontSize * 1.4;
    }

    this.layoutEngine.updateOptions(this.options);
    this.generator.updateOptions(this.options);
  }

  /**
   * Get current options
   */
  public getOptions(): HTMLToVegaLiteOptions {
    return { ...this.options };
  }

  /**
   * Register a custom tag strategy
   */
  public registerTagStrategy(strategy: any): void {
    this.parser.registerTagStrategy(strategy);
  }

  /**
   * Unregister a tag strategy by name
   */
  public unregisterTagStrategy(strategyName: string): boolean {
    return this.parser.removeTagStrategy(strategyName);
  }

  /**
   * Get all registered tag strategies
   */
  public getRegisteredStrategies(): string[] {
    return this.parser.getSupportedTags();
  }

  /**
   * Clear all tag strategies (get access to strategy registry)
   */
  public getStrategyRegistry(): any {
    return this.parser.getStrategyRegistry();
  }

  /**
   * Validate HTML input
   */
  public validateHTML(html: string): { isValid: boolean; errors: string[] } {
    return this.parser.validateHTML(html);
  }

  /**
   * Create a minimal spec for testing (static method)
   */
  public static createMinimal(text: string, options: HTMLToVegaLiteOptions = {}): VegaLiteSpec {
    const generator = new VegaLiteGenerator(options);
    return generator.generateMinimalSpec(text);
  }

  /**
   * Quick conversion method (static) for simple use cases
   */
  public static convert(html: string, options: HTMLToVegaLiteOptions = {}): VegaLiteSpec {
    const converter = new HTMLToVegaLite(options);
    return converter.convert(html);
  }
}

// Re-export types and classes for external use
export * from './types';
export { HTMLParser } from './parser';
export { TextLayoutEngine } from './layout';
export { VegaLiteGenerator } from './vega-generator';

// Export strategy system
export * from './strategies/index';

// Default export
export default HTMLToVegaLite;