import { TextStyle, ParseContext, ParsedOutput } from '../../types';
import { BaseTagStrategy } from '../interfaces/base-tag-strategy';
import { TagStrategy } from '../interfaces/tag-strategy.interface';
import { CompositeParseStrategy } from '../interfaces/composite-parse-strategy';
import { 
  LIST_TAGS, 
  LIST_PREFIXES, 
  DEFAULT_COLORS,
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_DECORATION 
} from '../../constants';
import { ListHelpers } from '../../helpers/composite';

/**
 * Strategy for unordered list containers: <ul>
 * Handles opening/closing of unordered list tags
 */
class UnorderedListStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Stack management is handled by parent CompositeParseStrategy
    return { ...currentStyle };
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, attributes, currentStyle, segments, remainingParts, currentIndex } = context;
    const errors: string[] = [];
    const newSegments: typeof context.segments = [];
    
    // Validate attributes
    if (this.validateAttributes && !isClosingTag) {
      const validation = this.validateAttributes(attributes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    if (isClosingTag) {
      // Handle closing ul tag
      // Stack management is handled by parent CompositeParseStrategy
      
      // Add line break after list if there's more content
      if (this.hasMoreContent(remainingParts, currentIndex)) {
        newSegments.push({
          text: '\n',
          ...currentStyle
        });
      }
      
      return {
        newSegments,
        updatedStyle: currentStyle,
        pushStyleToStack: false,
        popFromStyleStack: true,
        errors
      };
    } else {
      // Handle opening ul tag
      // Add line break before list container if needed
      if (this.needsLineBreak(segments)) {
        newSegments.push({
          text: '\n',
          ...currentStyle
        });
      }
      
      const newStyle = this.applyStyle(currentStyle, attributes, context.tagName);
      
      return {
        newSegments,
        updatedStyle: newStyle,
        pushStyleToStack: true,
        popFromStyleStack: false,
        errors
      };
    }
  }

  public getTagNames(): string[] {
    return [LIST_TAGS.UNORDERED_LIST];
  }

  public isLineBreak(): boolean {
    return true;
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    return this.validateCommonListAttributes(attributes);
  }

  private validateCommonListAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (attributes.trim()) {
      const validAttributePattern = /^(\s*(class|id|style|type|start)\s*=\s*["'][^"']*["']\s*)*$/i;
      if (!validAttributePattern.test(attributes.trim())) {
        errors.push('Invalid or unsupported attributes for list tag');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Strategy for ordered list containers: <ol>
 * Handles opening/closing of ordered list tags
 */
class OrderedListStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Stack management is handled by parent CompositeParseStrategy
    return { ...currentStyle };
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, attributes, currentStyle, segments, remainingParts, currentIndex } = context;
    const errors: string[] = [];
    const newSegments: typeof context.segments = [];
    
    // Validate attributes
    if (this.validateAttributes && !isClosingTag) {
      const validation = this.validateAttributes(attributes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    if (isClosingTag) {
      // Handle closing ol tag
      // Stack management is handled by parent CompositeParseStrategy
      
      // Add line break after list if there's more content
      if (this.hasMoreContent(remainingParts, currentIndex)) {
        newSegments.push({
          text: '\n',
          ...currentStyle
        });
      }
      
      return {
        newSegments,
        updatedStyle: currentStyle,
        pushStyleToStack: false,
        popFromStyleStack: true,
        errors
      };
    } else {
      // Handle opening ol tag
      // Add line break before list container if needed
      if (this.needsLineBreak(segments)) {
        newSegments.push({
          text: '\n',
          ...currentStyle
        });
      }
      
      const newStyle = this.applyStyle(currentStyle, attributes, context.tagName);
      
      return {
        newSegments,
        updatedStyle: newStyle,
        pushStyleToStack: true,
        popFromStyleStack: false,
        errors
      };
    }
  }

  public getTagNames(): string[] {
    return [LIST_TAGS.ORDERED_LIST];
  }

  public isLineBreak(): boolean {
    return true;
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    return this.validateCommonListAttributes(attributes);
  }

  private validateCommonListAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (attributes.trim()) {
      const validAttributePattern = /^(\s*(class|id|style|type|start)\s*=\s*["'][^"']*["']\s*)*$/i;
      if (!validAttributePattern.test(attributes.trim())) {
        errors.push('Invalid or unsupported attributes for list tag');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Strategy for list items: <li>
 * Handles list item content and prefix generation
 */
class ListItemStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string, tagName?: string): TextStyle {
    // Apply list styling using helper
    return ListHelpers.applyListStyling({ ...currentStyle }, LIST_TAGS.LIST_ITEM);
  }

  public parse(context: ParseContext): ParsedOutput {
    const { isClosingTag, attributes, currentStyle, segments } = context;
    const errors: string[] = [];
    const newSegments: typeof context.segments = [];
    
    if (isClosingTag) {
      // List items don't need special handling on close
      return {
        newSegments,
        updatedStyle: currentStyle,
        pushStyleToStack: false,
        popFromStyleStack: true,
        errors
      };
    }
    
    // Validate attributes
    if (this.validateAttributes) {
      const validation = this.validateAttributes(attributes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    // Add line break before list item if needed
    if (this.needsLineBreak(segments)) {
      newSegments.push({
        text: '\n',
        ...currentStyle
      });
    }
    
    const newStyle = this.applyStyle(currentStyle, attributes, context.tagName);
    
    // Add list item prefix
    const prefix = ListHelpers.getListItemPrefix(LIST_TAGS.LIST_ITEM);
    if (prefix) {
      // Create separate segment for prefix with clean list item style (no inherited decorations)
      // BUT inherit the list properties from newStyle for proper indentation
      const prefixStyle = { ...newStyle };
      prefixStyle.textDecoration = TEXT_DECORATION.NONE; // No text decoration for prefix
      prefixStyle.fontWeight = FONT_WEIGHT.NORMAL; // No bold/font weight inheritance
      prefixStyle.fontStyle = FONT_STYLE.NORMAL; // No italic inheritance
      prefixStyle.color = DEFAULT_COLORS.BLACK; // Reset color to default black
      
      newSegments.push({
        text: prefix,
        ...prefixStyle,
        hasSpaceAfter: true, // Always add consistent space after prefix
        spacingContext: 'list-prefix' // Special context for consistent spacing
      });
    }
    
    return {
      newSegments,
      updatedStyle: newStyle,
      pushStyleToStack: true,
      popFromStyleStack: false,
      errors
    };
  }

  public getTagNames(): string[] {
    return [LIST_TAGS.LIST_ITEM];
  }

  public isLineBreak(): boolean {
    return true;
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    return this.validateCommonListAttributes(attributes);
  }

  private validateCommonListAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (attributes.trim()) {
      const validAttributePattern = /^(\s*(class|id|style|type|start)\s*=\s*["'][^"']*["']\s*)*$/i;
      if (!validAttributePattern.test(attributes.trim())) {
        errors.push('Invalid or unsupported attributes for list tag');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}



/**
 * Main strategy for HTML list tags: <ul>, <ol>, <li>
 * Uses CompositeParseStrategy to delegate to specific tag strategies
 * 
 * This strategy handles:
 * - `<ul>`: Unordered list container with bullet points
 * - `<ol>`: Ordered list container with numbered items
 * - `<li>`: List item with appropriate prefix based on parent list type
 * 
 * Uses the generic composite pattern to delegate to specialized strategies while maintaining
 * backward compatibility and providing centralized list state management.
 */
export class ListTagStrategy extends CompositeParseStrategy {
  
  constructor() {
    // Pass child strategies and stack configuration to the generic composite
    super({
      family: 'list',
      strategies: {
        [LIST_TAGS.UNORDERED_LIST]: new UnorderedListStrategy(),
        [LIST_TAGS.ORDERED_LIST]: new OrderedListStrategy(),
        [LIST_TAGS.LIST_ITEM]: new ListItemStrategy()
      },
      stackConfig: {
        // ul and ol need stack management (containers)
        [LIST_TAGS.UNORDERED_LIST]: { manageStack: true, needsCounter: false },
        [LIST_TAGS.ORDERED_LIST]: { manageStack: true, needsCounter: true },
        // li doesn't need stack management (items, not containers)
        [LIST_TAGS.LIST_ITEM]: { manageStack: false }
      }
    });
  }

  /**
   * Provide list-specific validation for all list tags
   * Override the generic composite's validation method
   */
  public validateAttributes(attributes: string, tagName?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation - list tags generally don't require specific attributes
    // but we should allow common HTML attributes like class, id, style
    if (attributes.trim()) {
      // Allow common attributes, just validate basic structure
      const validAttributePattern = /^(\s*(class|id|style|type|start)\s*=\s*["'][^"']*["']\s*)*$/i;
      if (!validAttributePattern.test(attributes.trim())) {
        errors.push('Invalid or unsupported attributes for list tag');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Reset all list state - useful for testing or clean processing
   * Delegates to ListHelpers for backward compatibility
   */
  public static resetListState(): void {
    ListHelpers.resetListState();
  }
}
