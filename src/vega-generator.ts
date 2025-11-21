import { 
  PositionedTextSegment, 
  VegaLiteSpec, 
  VegaLiteLayer, 
  StyleGroup,
  HTMLToVegaLiteOptions 
} from './types';

/**
 * Vega-Lite specification generator
 */
export class VegaLiteGenerator {
  private fontSize: number;
  private fontFamily: string;

  constructor(options: HTMLToVegaLiteOptions = {}) {
    this.fontSize = options.fontSize ?? 14;
    this.fontFamily = options.fontFamily ?? 'Arial, sans-serif';
  }

  /**
   * Generate complete Vega-Lite specification from positioned text segments
   */
  public generateSpec(
    segments: PositionedTextSegment[], 
    bounds: { width: number; height: number },
    options: Partial<HTMLToVegaLiteOptions> = {}
  ): VegaLiteSpec {
    const styleGroups = this.groupSegmentsByStyle(segments);
    const layers = this.createLayers(styleGroups, bounds, options);

    // Enforce maxWidth constraint if provided
    const finalWidth = options.maxWidth ? 
      Math.min(bounds.width, options.maxWidth) : 
      bounds.width;

    return {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      width: finalWidth,
      height: bounds.height,
      background: options.background ?? "transparent",
      padding: 0,
      autosize: "none",
      config: {
        view: { stroke: null }
      },
      resolve: { 
        scale: { 
          x: "independent", 
          y: "independent" 
        } 
      },
      layer: layers
    };
  }

  /**
   * Group text segments by their styling properties for layered composition
   */
  private groupSegmentsByStyle(segments: PositionedTextSegment[]): Record<string, StyleGroup> {
    const styleGroups: Record<string, StyleGroup> = {};

    segments.forEach((segment, index) => {
      const styleKey = this.createStyleKey(segment);
      
      if (!styleGroups[styleKey]) {
        styleGroups[styleKey] = {
          style: {
            fontWeight: segment.fontWeight,
            fontStyle: segment.fontStyle,
            color: segment.color,
            textDecoration: segment.textDecoration ?? 'none',
            fontSize: segment.fontSize ?? this.fontSize
          },
          data: []
        };
      }

      styleGroups[styleKey].data.push({
        id: index,
        text: segment.text,
        x: segment.x,
        y: segment.y,
        width: segment.width,
        height: segment.height
      });
    });

    return styleGroups;
  }

  /**
   * Create a unique key for style grouping
   */
  private createStyleKey(segment: PositionedTextSegment): string {
    return `${segment.fontWeight}-${segment.fontStyle}-${segment.color}-${segment.textDecoration ?? 'none'}-${segment.fontSize ?? 'default'}`;
  }

  /**
   * Create Vega-Lite layers from style groups
   */
  private createLayers(
    styleGroups: Record<string, StyleGroup>, 
    bounds: { width: number; height: number },
    options: Partial<HTMLToVegaLiteOptions> = {}
  ): any[] {
    const layers: any[] = [];
    
    // Create text layers
    Object.values(styleGroups).forEach(group => {
      layers.push(this.createLayer(group, bounds, options));
      
      // Add decoration layers (underline, strikethrough) if needed
      if (group.style.textDecoration === 'underline') {
        layers.push(this.createUnderlineLayer(group, bounds, options));
      } else if (group.style.textDecoration === 'line-through') {
        layers.push(this.createStrikethroughLayer(group, bounds, options));
      }
    });
    
    return layers;
  }

  /**
   * Create a single Vega-Lite layer for a style group
   */
  private createLayer(
    group: StyleGroup, 
    bounds: { width: number; height: number },
    options: Partial<HTMLToVegaLiteOptions> = {}
  ): VegaLiteLayer {
    const baseFontSize = options.fontSize ?? this.fontSize;
    const fontFamily = options.fontFamily ?? this.fontFamily;
    
    // If global fontSize is explicitly overridden in options, use it for all text
    // Otherwise, use group's fontSize if available, then fallback to base
    const fontSize = options.fontSize || group.style.fontSize || baseFontSize;
    
    // Keep original coordinates since we're using 'top' baseline
    return {
      data: { values: group.data },
      mark: {
        type: 'text',
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: group.style.fontWeight,
        fontStyle: group.style.fontStyle,
        color: group.style.color,
        align: 'left',
        baseline: 'top'
      },
      encoding: {
        x: {
          field: 'x',
          type: 'quantitative',
          axis: null,
          scale: { domain: [0, bounds.width] }
        },
        y: {
          field: 'y',
          type: 'quantitative',
          axis: null,
          scale: { domain: [bounds.height, 0] }  // Invert Y domain to match top-down layout
        },
        text: {
          field: 'text',
          type: 'nominal'
        }
      }
    };
  }

  /**
   * Generate a minimal spec for testing
   */
  public generateMinimalSpec(text: string): VegaLiteSpec {
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      width: 200,
      height: 50,
      background: "transparent",
      padding: 0,
      autosize: "none",
      config: {
        view: { stroke: null }
      },
      layer: [{
        data: { values: [{ id: 0, text, x: 10, y: 20 }] },
        mark: {
          type: 'text',
          fontSize: this.fontSize,
          fontFamily: this.fontFamily,
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000',
          align: 'left',
          baseline: 'top'
        },
        encoding: {
          x: {
            field: 'x',
            type: 'quantitative',
            axis: null,
            scale: { domain: [0, 200] }
          },
          y: {
            field: 'y',
            type: 'quantitative',
            axis: null,
            scale: { domain: [0, 50] }
          },
          text: {
            field: 'text',
            type: 'nominal'
          }
        }
      }]
    };
  }

  /**
   * Update generator options
   */
  public updateOptions(options: Partial<HTMLToVegaLiteOptions>): void {
    if (options.fontSize !== undefined) {
      this.fontSize = options.fontSize;
    }
    if (options.fontFamily !== undefined) {
      this.fontFamily = options.fontFamily;
    }
  }

  /**
   * Create an underline layer for text with underline decoration
   */
  private createUnderlineLayer(
    group: StyleGroup, 
    bounds: { width: number; height: number },
    options: Partial<HTMLToVegaLiteOptions> = {}
  ): any {
    // Global options take precedence over style fontSize  
    const groupFontSize = options.fontSize ?? (group.style.fontSize || this.fontSize);
    
    // Create line segments for each text segment
    const lineData = group.data.map(segment => {
      const textTopY = segment.y;
      const textHeight = segment.height || groupFontSize;
      return {
        id: segment.id,
        x: segment.x,
        x2: segment.x + (segment.width || this.estimateTextWidth(segment.text, groupFontSize)),
        y: textTopY + textHeight + 1 // Position line below text (top + height + offset)
      };
    });

    return {
      data: { values: lineData },
      mark: {
        type: 'rule',
        color: group.style.color,
        strokeWidth: 1
      },
      encoding: {
        x: {
          field: 'x',
          type: 'quantitative',
          axis: null,
          scale: { domain: [0, bounds.width] }
        },
        x2: {
          field: 'x2',
          type: 'quantitative'
        },
        y: {
          field: 'y',
          type: 'quantitative',
          axis: null,
          scale: { domain: [bounds.height, 0] }  // Invert Y domain to match top-down layout
        }
      }
    };
  }

  /**
   * Create a strikethrough layer for text with line-through decoration
   */
  private createStrikethroughLayer(
    group: StyleGroup, 
    bounds: { width: number; height: number },
    options: Partial<HTMLToVegaLiteOptions> = {}
  ): any {
    // Global options take precedence over style fontSize  
    const groupFontSize = options.fontSize ?? (group.style.fontSize || this.fontSize);
    
    // Create line segments for each text segment
    const lineData = group.data.map(segment => {
      const textTopY = segment.y;
      const textHeight = segment.height || groupFontSize;
      return {
        id: segment.id,
        x: segment.x,
        x2: segment.x + (segment.width || this.estimateTextWidth(segment.text, groupFontSize)),
        y: textTopY + (textHeight * 0.5) // Position line through center of text
      };
    });

    return {
      data: { values: lineData },
      mark: {
        type: 'rule',
        color: group.style.color,
        strokeWidth: 1
      },
      encoding: {
        x: {
          field: 'x',
          type: 'quantitative',
          axis: null,
          scale: { domain: [0, bounds.width] }
        },
        x2: {
          field: 'x2',
          type: 'quantitative'
        },
        y: {
          field: 'y',
          type: 'quantitative',
          axis: null,
          scale: { domain: [bounds.height, 0] }  // Invert Y domain to match top-down layout
        }
      }
    };
  }

  /**
   * Estimate text width for line decorations
   * This is a rough approximation - in a real implementation you'd use proper text measurement
   */
  private estimateTextWidth(text: string, fontSize: number): number {
    // Rough approximation: average character width is about 0.6 * fontSize
    return text.length * fontSize * 0.6;
  }
}