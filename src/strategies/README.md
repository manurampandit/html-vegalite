# Tag Strategies Documentation

## Overview

The tag strategies system provides an extensible way to handle HTML tag parsing and styling. The system uses the Strategy Pattern to allow for flexible and modular tag handling.

## Directory Structure

```
src/strategies/
├── index.ts                    # Main export file
├── interfaces/                 # Interfaces and base classes
│   ├── index.ts
│   ├── tag-strategy.interface.ts
│   └── base-tag-strategy.ts
├── implementations/            # Strategy implementations
│   ├── index.ts
│   ├── bold-tag-strategy.ts
│   ├── italic-tag-strategy.ts
│   ├── underline-tag-strategy.ts
│   ├── span-tag-strategy.ts
│   ├── heading-tag-strategy.ts
│   ├── paragraph-tag-strategy.ts
│   ├── hyperlink-tag-strategy.ts
│   ├── line-break-tag-strategy.ts
│   ├── code-tag-strategy.ts
│   ├── small-text-tag-strategy.ts
│   ├── highlight-tag-strategy.ts
│   ├── strikethrough-tag-strategy.ts
│   ├── color-tag-strategy.ts
│   └── list-tag-strategy.ts
└── registry/                   # Strategy registry
    ├── index.ts
    └── tag-strategy-registry.ts
```

## Core Interfaces

### TagStrategy Interface

All tag strategies must implement the `TagStrategy` interface:

```typescript
interface TagStrategy {
  applyStyle(currentStyle: TextStyle, attributes: string): TextStyle;
  getTagNames(): string[];
  validateAttributes?(attributes: string): { isValid: boolean; errors: string[] };
}
```

### BaseTagStrategy Class

The `BaseTagStrategy` abstract class provides a default implementation of `validateAttributes`:

```typescript
abstract class BaseTagStrategy implements TagStrategy {
  abstract applyStyle(currentStyle: TextStyle, attributes: string): TextStyle;
  abstract getTagNames(): string[];
  
  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }
}
```

## Available Strategies

### Core Text Formatting
- **BoldTagStrategy**: Handles `<b>`, `<strong>` tags
- **ItalicTagStrategy**: Handles `<i>`, `<em>` tags
- **UnderlineTagStrategy**: Handles `<u>` tags
- **SpanTagStrategy**: Handles `<span>` tags with style attributes

### HTML Structure
- **HeadingTagStrategy**: Handles `<h1>` through `<h6>` tags
- **ParagraphTagStrategy**: Handles `<p>` tags
- **HyperlinkTagStrategy**: Handles `<a>` tags with href validation
- **LineBreakTagStrategy**: Handles `<br>` tags

### Additional Text Formatting
- **CodeTagStrategy**: Handles `<code>`, `<pre>`, `<kbd>`, `<samp>` tags
- **SmallTextTagStrategy**: Handles `<small>`, `<sub>`, `<sup>` tags
- **HighlightTagStrategy**: Handles `<mark>` tags

### Custom/Example Strategies
- **StrikethroughTagStrategy**: Handles `<s>`, `<strike>`, `<del>` tags
- **ColorTagStrategy**: Handles custom color shortcut tags (`<red>`, `<blue>`, etc.)
- **ListTagStrategy**: Handles HTML list tags (`<ul>`, `<ol>`, `<li>`) with bullet points and numbering

## Usage

### Basic Usage

```typescript
import { createDefaultTagStrategyRegistry, HTMLParser } from './strategies';

// Create parser with default strategies
const parser = new HTMLParser();

// Parse HTML
const result = parser.parseHTML('<b>Bold text</b> and <i>italic text</i>');
```

### Custom Strategy Registration

```typescript
import { 
  HTMLParser, 
  createMinimalTagStrategyRegistry,
  StrikethroughTagStrategy 
} from './strategies';

// Create parser with minimal strategies
const registry = createMinimalTagStrategyRegistry();
registry.registerStrategy(new StrikethroughTagStrategy());

const parser = new HTMLParser();
parser.getStrategyRegistry().registerStrategy(new StrikethroughTagStrategy());
```

### Creating Custom Strategies

```typescript
import { BaseTagStrategy, TextStyle } from './strategies';

class CustomTagStrategy extends BaseTagStrategy {
  public applyStyle(currentStyle: TextStyle, attributes: string): TextStyle {
    return {
      ...currentStyle,
      color: '#custom-color'
    };
  }

  public getTagNames(): string[] {
    return ['custom'];
  }

  public validateAttributes(attributes: string): { isValid: boolean; errors: string[] } {
    // Custom validation logic
    return { isValid: true, errors: [] };
  }
}
```

## Registry Management

### TagStrategyRegistry

The registry manages all tag strategies:

```typescript
import { TagStrategyRegistry, BoldTagStrategy } from './strategies';

const registry = new TagStrategyRegistry();

// Register a strategy
registry.registerStrategy(new BoldTagStrategy());

// Check if a tag is supported
const isSupported = registry.isSupported('b'); // true

// Get a strategy
const strategy = registry.getStrategy('b');

// Get all supported tags
const supportedTags = registry.getSupportedTags();

// Remove a strategy
registry.removeStrategy('b');

// Clear all strategies
registry.clearStrategies();
```

### Factory Functions

Two factory functions are provided for convenience:

```typescript
import { 
  createDefaultTagStrategyRegistry, 
  createMinimalTagStrategyRegistry 
} from './strategies';

// Full registry with all default strategies
const fullRegistry = createDefaultTagStrategyRegistry();

// Minimal registry with only basic formatting
const minimalRegistry = createMinimalTagStrategyRegistry();
```

## Extending the System

### Adding New Properties to TextStyle

If you need additional styling properties, extend the `TextStyle` interface in `types.ts`:

```typescript
interface TextStyle {
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  textDecoration?: 'none' | 'underline';
  fontSize?: number;        // New property
  fontFamily?: string;      // New property
  backgroundColor?: string; // New property
}
```

### Creating Strategy Collections

You can create collections of related strategies:

```typescript
// semantic-strategies.ts
export function createSemanticStrategies(): TagStrategy[] {
  return [
    new BoldTagStrategy(),
    new ItalicTagStrategy(),
    new CodeTagStrategy(),
    new HighlightTagStrategy()
  ];
}
```

## Testing

Each strategy should be tested independently:

```typescript
import { BoldTagStrategy } from './strategies';

const strategy = new BoldTagStrategy();
const result = strategy.applyStyle(
  { fontWeight: 'normal', fontStyle: 'normal', color: '#000' },
  ''
);

expect(result.fontWeight).toBe('bold');
```

## Featured Strategy: ListTagStrategy

The `ListTagStrategy` provides comprehensive support for HTML list elements and demonstrates advanced strategy features including multi-tag handling and state management.

### Supported Tags
- `<ul>` - Unordered list container
- `<ol>` - Ordered list container  
- `<li>` - List item

### Features
- **Bullet Points**: Unordered lists (`<ul>`) render list items with bullet prefixes (`• `)
- **Numbering**: Ordered lists (`<ol>`) render list items with sequential numbers (`1. `, `2. `, `3. `)
- **Nesting**: Supports nested lists with proper context tracking
- **Line Breaks**: All list elements create appropriate line breaks for formatting
- **Style Preservation**: Works seamlessly with other formatting strategies
- **Attribute Validation**: Validates common list attributes (class, id, style, type, start)

### Usage Examples

```typescript
// Simple unordered list
const html1 = '<ul><li>Item 1</li><li>Item 2</li></ul>';
// Output: "• Item 1" and "• Item 2"

// Simple ordered list  
const html2 = '<ol><li>First</li><li>Second</li></ol>';
// Output: "1. First" and "2. Second"

// Nested lists
const html3 = `
<ul>
  <li>Outer item
    <ol>
      <li>Inner item 1</li>
      <li>Inner item 2</li>
    </ol>
  </li>
</ul>`;
// Output: "• Outer item", "1. Inner item 1", "2. Inner item 2"

// Lists with styled content
const html4 = '<ul><li><b>Bold item</b></li><li><i>Italic item</i></li></ul>';
// Output: Preserves bold/italic formatting within list items
```

### Implementation Details

The ListTagStrategy uses static state management to track:
- **List Stack**: Current nesting context (ul/ol hierarchy)
- **Counters**: Sequential numbering for ordered lists at each nesting level
- **Context Management**: Automatic cleanup when lists are closed

Key static methods:
- `getListItemPrefix(tagName)`: Returns appropriate prefix for list items
- `handleClosingTag(tagName)`: Cleans up list state when closing ul/ol tags
- `resetListState()`: Resets all list state for clean parsing
- `getListContext()`: Returns current list context for debugging

### Integration Notes

The ListTagStrategy requires special parser support for:
1. **Closing Tag Handling**: The parser calls `handleClosingTag()` when ul/ol tags are closed
2. **Text Prefixing**: The parser adds list item prefixes to text content within li tags
3. **State Management**: The parser resets list state at the beginning of each parse operation

This makes ListTagStrategy a good reference for implementing complex strategies that need parser integration.
