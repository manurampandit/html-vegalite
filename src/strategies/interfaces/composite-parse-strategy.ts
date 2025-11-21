import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from './base-tag-strategy';
import { TagStrategy } from './tag-strategy.interface';
import { CompositeHelpers } from '../../helpers/composite';

/**
 * Configuration for stack management behavior of tags within a composite family
 */
interface CompositeStackConfig {
  /** Whether this tag type should be pushed to/popped from the family stack */
  manageStack: boolean;
  /** Whether this tag type needs counter management (e.g., for ordered lists) */
  needsCounter?: boolean;
}

/**
 * Generic composite strategy that delegates parsing to child strategies based on tag type.
 * Also handles centralized state management (stacks, counters) for the tag family.
 * This pattern can be used for any family of related tags (lists, tables, forms, etc.)
 * 
 * Usage example:
 * ```typescript
 * class MyTagStrategy extends CompositeParseStrategy {
 *   constructor() {
 *     super({
 *       family: 'myFamily',
 *       strategies: {
 *         'tag1': new Tag1Strategy(),
 *         'tag2': new Tag2Strategy(),
 *         'tag3': new Tag3Strategy()
 *       },
 *       stackConfig: {
 *         'tag1': { manageStack: true, needsCounter: false },
 *         'tag2': { manageStack: true, needsCounter: true }
 *       }
 *     });
 *   }
 * }
 * ```
 */
export abstract class CompositeParseStrategy extends BaseTagStrategy {
  protected childStrategies: Map<string, TagStrategy>;
  protected family: string;
  protected stackConfig: Map<string, CompositeStackConfig>;

  /**
   * Create a composite strategy with child strategies and stack management configuration
   * 
   * @param config - Configuration object
   * @param config.family - Family identifier for state management (e.g., 'list', 'table')
   * @param config.strategies - Object mapping tag names to their respective strategies
   * @param config.stackConfig - Configuration for which tags need stack management
   */
  constructor(config: {
    family: string;
    strategies: Record<string, TagStrategy>;
    stackConfig?: Record<string, CompositeStackConfig>;
  }) {
    super();
    this.family = config.family;
    this.childStrategies = new Map<string, TagStrategy>();
    this.stackConfig = new Map<string, CompositeStackConfig>();
    
    // Register all provided strategies
    for (const [tagName, strategy] of Object.entries(config.strategies)) {
      this.childStrategies.set(tagName.toLowerCase(), strategy);
    }
    
    // Register stack configuration
    if (config.stackConfig) {
      for (const [tagName, stackConfig] of Object.entries(config.stackConfig)) {
        this.stackConfig.set(tagName.toLowerCase(), stackConfig);
      }
    }
  }

  /**
   * Delegates style application to the appropriate child strategy and handles stack management
   * 
   * @param currentStyle - Current text style
   * @param attributes - HTML attributes
   * @param tagName - HTML tag name
   * @returns Updated text style
   */
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    if (!tagName) return currentStyle;
    
    const normalizedTagName = tagName.toLowerCase();
    const strategy = this.childStrategies.get(normalizedTagName);
    if (!strategy) return currentStyle;
    
    // Handle stack management for opening tags (applyStyle is called for opening tags)
    const stackConfig = this.stackConfig.get(normalizedTagName);
    if (stackConfig?.manageStack) {
      CompositeHelpers.pushToStack(this.family, normalizedTagName, stackConfig.needsCounter || false);
    }
    
    return strategy.applyStyle(currentStyle, attributes, tagName);
  }

  /**
   * Delegates parsing to the appropriate child strategy while managing composite family state
   * 
   * @param context - Parse context containing tag information
   * @returns Parse output from the child strategy
   */
  public parse(context: ParseContext): ParsedOutput {
    const tagName = context.tagName.toLowerCase();
    const strategy = this.childStrategies.get(tagName);
    
    if (!strategy) {
      return {
        newSegments: [],
        updatedStyle: context.currentStyle,
        pushStyleToStack: false,
        popFromStyleStack: false,
        errors: [`Unknown tag in composite strategy: ${context.tagName}`]
      };
    }
    
    // Handle stack management for this tag family
    const stackConfig = this.stackConfig.get(tagName);
    if (stackConfig?.manageStack) {
      if (context.isClosingTag) {
        // Pop from stack when closing
        CompositeHelpers.popFromStack(this.family, stackConfig.needsCounter || false);
      } else {
        // Push to stack when opening
        CompositeHelpers.pushToStack(this.family, tagName, stackConfig.needsCounter || false);
      }
    }
    
    // Delegate to child strategy for actual parsing
    return strategy.parse(context);
  }

  /**
   * Returns all tag names supported by child strategies
   * 
   * @returns Array of supported tag names
   */
  public getTagNames(): string[] {
    const allTagNames: string[] = [];
    for (const strategy of this.childStrategies.values()) {
      allTagNames.push(...strategy.getTagNames());
    }
    return allTagNames;
  }

  /**
   * Delegates validation to the appropriate child strategy, or provides default validation
   * 
   * @param attributes - HTML attributes to validate
   * @param tagName - Optional tag name for strategy-specific validation
   * @returns Validation result
   */
  public validateAttributes(attributes: string, tagName?: string): { isValid: boolean; errors: string[] } {
    if (tagName) {
      const strategy = this.childStrategies.get(tagName.toLowerCase());
      if (strategy && strategy.validateAttributes) {
        return strategy.validateAttributes(attributes);
      }
    }
    
    // Default validation - most composites will override this
    return { isValid: true, errors: [] };
  }

  /**
   * Check if any child strategy creates line breaks
   * Default implementation returns true - override if needed for specific composite types
   * 
   * @returns true if the composite strategy creates line breaks
   */
  public isLineBreak(): boolean {
    return true;
  }

  /**
   * Add a new child strategy to the composite
   * Useful for extending composite behavior at runtime
   * 
   * @param tagName - Tag name to associate with the strategy
   * @param strategy - Strategy to handle the tag
   */
  protected addChildStrategy(tagName: string, strategy: TagStrategy): void {
    this.childStrategies.set(tagName.toLowerCase(), strategy);
  }

  /**
   * Remove a child strategy from the composite
   * 
   * @param tagName - Tag name to remove
   * @returns true if strategy was removed, false if it didn't exist
   */
  protected removeChildStrategy(tagName: string): boolean {
    return this.childStrategies.delete(tagName.toLowerCase());
  }

  /**
   * Get a specific child strategy
   * 
   * @param tagName - Tag name to look up
   * @returns Strategy for the tag, or undefined if not found
   */
  protected getChildStrategy(tagName: string): TagStrategy | undefined {
    return this.childStrategies.get(tagName.toLowerCase());
  }

  /**
   * Check if a tag is supported by this composite
   * 
   * @param tagName - Tag name to check
   * @returns true if the tag is supported
   */
  public isTagSupported(tagName: string): boolean {
    return this.childStrategies.has(tagName.toLowerCase());
  }

  /**
   * Handle closing tag for stack management - useful for testing
   * 
   * @param tagName - Tag name being closed
   */
  public handleClosingTag(tagName: string): void {
    const normalizedTagName = tagName.toLowerCase();
    const stackConfig = this.stackConfig.get(normalizedTagName);
    if (stackConfig?.manageStack) {
      CompositeHelpers.popFromStack(this.family, stackConfig.needsCounter || false);
    }
  }

  /**
   * Get the family identifier for this composite
   * 
   * @returns Family identifier string
   */
  public getFamily(): string {
    return this.family;
  }
}
