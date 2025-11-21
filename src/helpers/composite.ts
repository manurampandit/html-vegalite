import { TextStyle } from '../types';
import { LIST_TAGS, LIST_PREFIXES } from '../constants';

/**
 * Generic helper functions for composite tag strategies (tag families like lists, tables, backquotes, etc.)
 * 
 * This class provides generic state management and context tracking for composite tag families.
 * It handles:
 * - Nesting and counter management for any tag family
 * - Context tracking and state cleanup
 * - Generic stack operations for composite structures
 */
export class CompositeHelpers {
  /** Static counters for any composite family that needs numbering */
  private static counters: Map<string, Map<string, number>> = new Map();
  
  /** Static stacks to track current context for each composite family */
  private static stacks: Map<string, string[]> = new Map();

  /**
   * Reset all state for a specific composite family (or all families if no family specified)
   * 
   * @param family - Optional family identifier (e.g., 'list', 'table', 'backquote')
   */
  static resetCompositeState(family?: string): void {
    if (family) {
      CompositeHelpers.counters.delete(family);
      CompositeHelpers.stacks.delete(family);
    } else {
      // Reset all families
      CompositeHelpers.counters.clear();
      CompositeHelpers.stacks.clear();
    }
  }

  /**
   * Generate a unique counter key for any composite family based on type and nesting level
   * 
   * @param family - Family identifier (e.g., 'list', 'table')
   * @param tagType - Type of tag within family (e.g., 'ol', 'ul' for lists)
   * @param nestingLevel - Current nesting level
   * @returns Unique counter key string
   */
  static generateCounterKey(family: string, tagType: string, nestingLevel: number): string {
    return `${family}-${tagType}-${nestingLevel}`;
  }

  /**
   * Push tag type to stack when entering a composite container
   * 
   * @param family - Family identifier
   * @param tagType - Type of tag within family
   * @param needsCounter - Whether this tag type needs a counter
   */
  static pushToStack(family: string, tagType: string, needsCounter = false): void {
    // Ensure family stack exists
    if (!CompositeHelpers.stacks.has(family)) {
      CompositeHelpers.stacks.set(family, []);
    }
    
    const stack = CompositeHelpers.stacks.get(family)!;
    stack.push(tagType);
    
    if (needsCounter) {
      // Ensure family counters exist
      if (!CompositeHelpers.counters.has(family)) {
        CompositeHelpers.counters.set(family, new Map());
      }
      
      const familyCounters = CompositeHelpers.counters.get(family)!;
      const key = CompositeHelpers.generateCounterKey(family, tagType, stack.length);
      familyCounters.set(key, 0);
    }
  }

  /**
   * Pop tag type from stack when exiting a composite container
   * Also cleans up any associated counters
   * 
   * @param family - Family identifier
   * @param shouldCleanupCounters - Whether to cleanup counters for this family
   * @returns The tag type that was popped, or undefined if stack was empty
   */
  static popFromStack(family: string, shouldCleanupCounters = false): string | undefined {
    const stack = CompositeHelpers.stacks.get(family);
    if (!stack || stack.length === 0) {
      return undefined;
    }
    
    const poppedType = stack.pop()!;
    
    if (shouldCleanupCounters) {
      const familyCounters = CompositeHelpers.counters.get(family);
      if (familyCounters) {
        const key = CompositeHelpers.generateCounterKey(family, poppedType, stack.length + 1);
        familyCounters.delete(key);
      }
    }
    
    return poppedType;
  }

  /**
   * Get current nesting level for a composite family
   * 
   * @param family - Family identifier
   * @returns Current nesting level
   */
  static getCurrentNestingLevel(family: string): number {
    const stack = CompositeHelpers.stacks.get(family);
    return stack ? stack.length : 0;
  }

  /**
   * Get the parent tag type for current context in a family
   * 
   * @param family - Family identifier
   * @returns Parent tag type or undefined if not in context
   */
  static getParentType(family: string): string | undefined {
    const stack = CompositeHelpers.stacks.get(family);
    return stack && stack.length > 0 ? stack[stack.length - 1] : undefined;
  }

  /**
   * Get current context for a composite family (for testing/debugging)
   * 
   * @param family - Family identifier
   * @returns Current context with stack and counters for the family
   */
  static getCompositeContext(family: string): { stack: string[], counters: Map<string, number> } {
    const stack = CompositeHelpers.stacks.get(family) || [];
    const counters = CompositeHelpers.counters.get(family) || new Map();
    
    return {
      stack: [...stack],
      counters: new Map(counters)
    };
  }

  /**
   * Check if currently inside a composite family context
   * 
   * @param family - Family identifier
   * @returns true if currently parsing within the family
   */
  static isInCompositeContext(family: string): boolean {
    const stack = CompositeHelpers.stacks.get(family);
    return stack ? stack.length > 0 : false;
  }

  /**
   * Get the current stack for a composite family (for debugging/logging)
   * 
   * @param family - Family identifier  
   * @returns Array of tag types in the current stack
   */
  static getCompositeStack(family: string): readonly string[] {
    const stack = CompositeHelpers.stacks.get(family);
    return stack ? [...stack] : [];
  }

  /**
   * Increment and get counter value for a composite tag that needs numbering
   * 
   * @param family - Family identifier
   * @param tagType - Tag type that needs numbering
   * @param nestingLevel - Current nesting level
   * @returns Current counter value after increment
   */
  static incrementAndGetCounter(family: string, tagType: string, nestingLevel: number): number {
    const familyCounters = CompositeHelpers.counters.get(family);
    if (!familyCounters) {
      return 1;
    }
    
    const key = CompositeHelpers.generateCounterKey(family, tagType, nestingLevel);
    const currentCount = (familyCounters.get(key) || 0) + 1;
    familyCounters.set(key, currentCount);
    
    return currentCount;
  }
}

/**
 * List-specific helper functions that use the generic CompositeHelpers
 * 
 * This class provides list-specific functionality while leveraging the generic
 * composite state management system.
 */
export class ListHelpers {
  private static readonly FAMILY = 'list';

  /**
   * Reset all list state (useful for starting fresh parsing)
   */
  static resetListState(): void {
    CompositeHelpers.resetCompositeState(ListHelpers.FAMILY);
  }

  /**
   * Generate a unique counter key for ordered lists based on type and nesting level
   * 
   * @param listType - Type of list (ul, ol)
   * @param nestingLevel - Current nesting level
   * @returns Unique counter key string
   */
  static generateCounterKey(listType: string, nestingLevel: number): string {
    return CompositeHelpers.generateCounterKey(ListHelpers.FAMILY, listType, nestingLevel);
  }

  /**
   * Push list type to stack when entering a list container
   * 
   * @param listType - Type of list (ul or ol)
   */
  static pushListToStack(listType: string): void {
    const needsCounter = listType === LIST_TAGS.ORDERED_LIST;
    CompositeHelpers.pushToStack(ListHelpers.FAMILY, listType, needsCounter);
  }

  /**
   * Pop list type from stack when exiting a list container
   * Also cleans up any associated counters for ordered lists
   * 
   * @returns The list type that was popped, or undefined if stack was empty
   */
  static popListFromStack(): string | undefined {
    return CompositeHelpers.popFromStack(ListHelpers.FAMILY, true);
  }

  /**
   * Get current list stack depth
   * 
   * @returns Current nesting level
   */
  static getCurrentNestingLevel(): number {
    return CompositeHelpers.getCurrentNestingLevel(ListHelpers.FAMILY);
  }

  /**
   * Get the parent list type for current context
   * 
   * @returns Parent list type or undefined if not in a list
   */
  static getParentListType(): string | undefined {
    return CompositeHelpers.getParentType(ListHelpers.FAMILY);
  }

  /**
   * Generate list item prefix based on current list context
   * 
   * @param listItemTag - The list item tag (should be 'li')
   * @returns Prefix string (e.g., '• ' or '1. ') or empty string if not applicable
   */
  static getListItemPrefix(listItemTag: string): string {
    if (listItemTag !== LIST_TAGS.LIST_ITEM) {
      return '';
    }

    const parentListType = ListHelpers.getParentListType();
    
    if (parentListType === LIST_TAGS.UNORDERED_LIST) {
      return LIST_PREFIXES.BULLET;
    } else if (parentListType === LIST_TAGS.ORDERED_LIST) {
      // Increment counter and return numbered prefix
      const nestingLevel = ListHelpers.getCurrentNestingLevel();
      const currentCount = CompositeHelpers.incrementAndGetCounter(
        ListHelpers.FAMILY, 
        LIST_TAGS.ORDERED_LIST, 
        nestingLevel
      );
      return currentCount + LIST_PREFIXES.NUMBER_SUFFIX;
    }

    return '';
  }

  /**
   * Apply list-specific styling properties to a text style
   * 
   * @param style - Text style to modify
   * @param tagName - HTML tag name
   * @returns Modified text style with list properties
   */
  static applyListStyling(style: TextStyle, tagName: string): TextStyle {
    const normalizedTagName = tagName.toLowerCase();
    
    if (normalizedTagName === LIST_TAGS.LIST_ITEM) {
      const parentListType = ListHelpers.getParentListType();
      return {
        ...style,
        isListItem: true,
        listNestingLevel: ListHelpers.getCurrentNestingLevel(),
        listType: parentListType as 'ul' | 'ol'
      };
    }
    
    return style;
  }

  /**
   * Get current list context for testing
   * 
   * @returns Current list context with stack and counters
   */
  static getListContext(): { stack: string[], counters: Map<string, number> } {
    return CompositeHelpers.getCompositeContext(ListHelpers.FAMILY);
  }

  /**
   * Check if a given tag is a list-related tag
   * 
   * @param tagName - HTML tag name to check
   * @returns true if the tag is list-related (ul, ol, li)
   */
  static isListTag(tagName: string): boolean {
    const normalizedTag = tagName.toLowerCase();
    return normalizedTag === LIST_TAGS.UNORDERED_LIST || 
           normalizedTag === LIST_TAGS.ORDERED_LIST || 
           normalizedTag === LIST_TAGS.LIST_ITEM;
  }

  /**
   * Check if currently inside a list context
   * 
   * @returns true if currently parsing within a list
   */
  static isInListContext(): boolean {
    return CompositeHelpers.isInCompositeContext(ListHelpers.FAMILY);
  }

  /**
   * Get the depth of list nesting for debugging/logging
   * 
   * @returns Array of list types in the current stack
   */
  static getListStack(): readonly string[] {
    return CompositeHelpers.getCompositeStack(ListHelpers.FAMILY);
  }

  /**
   * Calculate list item indentation based on nesting level
   * This is list-specific layout logic that belongs with list helpers
   * 
   * @param nestingLevel - List nesting level (1-based)
   * @returns Indentation value in pixels
   */
  static calculateListIndentation(nestingLevel: number): number {
    if (nestingLevel <= 0) {
      return 0;
    }
    
    // Base padding for first-level lists: 20px
    // Additional indentation for nested lists: 20px per level
    return 20 + ((nestingLevel - 1) * 20);
  }
}

/**
 * Example helper class for other composite tag families
 * This demonstrates how to use CompositeHelpers for other tag families
 */
export class BackquoteHelpers {
  private static readonly FAMILY = 'backquote';

  /**
   * Reset all backquote state
   */
  static resetBackquoteState(): void {
    CompositeHelpers.resetCompositeState(BackquoteHelpers.FAMILY);
  }

  /**
   * Push backquote type to stack (e.g., 'code', 'pre', 'kbd')
   */
  static pushBackquoteToStack(tagType: string): void {
    CompositeHelpers.pushToStack(BackquoteHelpers.FAMILY, tagType);
  }

  /**
   * Pop backquote type from stack
   */
  static popBackquoteFromStack(): string | undefined {
    return CompositeHelpers.popFromStack(BackquoteHelpers.FAMILY);
  }

  /**
   * Check if currently inside a backquote context
   */
  static isInBackquoteContext(): boolean {
    return CompositeHelpers.isInCompositeContext(BackquoteHelpers.FAMILY);
  }

  /**
   * Get current backquote context for testing
   */
  static getBackquoteContext(): { stack: string[], counters: Map<string, number> } {
    return CompositeHelpers.getCompositeContext(BackquoteHelpers.FAMILY);
  }
}
