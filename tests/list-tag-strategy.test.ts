import { ListTagStrategy } from '../src/strategies/implementations/list-tag-strategy';
import { ListHelpers } from '../src/helpers/composite';
import { TextStyle } from '../src/types';
import { HTMLParser } from '../src/parser';
import { HTMLToVegaLite } from '../src/index';

describe('ListTagStrategy', () => {
  let strategy: ListTagStrategy;

  beforeEach(() => {
    strategy = new ListTagStrategy();
    // Reset list state before each test
    ListTagStrategy.resetListState();
  });

  afterEach(() => {
    // Clean up list state after each test
    ListTagStrategy.resetListState();
  });

  describe('Basic Strategy Methods', () => {
    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['ul', 'ol', 'li']);
    });

    it('should indicate that all list tags create line breaks', () => {
      expect(strategy.isLineBreak()).toBe(true);
    });

    it('should preserve text style for list container tags and add context for list items', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      // Test ul - should preserve style
      const ulStyle = strategy.applyStyle(currentStyle, '', 'ul');
      expect(ulStyle).toEqual(currentStyle);

      // Test ol - should preserve style
      const olStyle = strategy.applyStyle(currentStyle, '', 'ol');
      expect(olStyle).toEqual(currentStyle);

      // Test li - should preserve style but add list context
      const liStyle = strategy.applyStyle(currentStyle, '', 'li');
      expect(liStyle.fontWeight).toBe(currentStyle.fontWeight);
      expect(liStyle.fontStyle).toBe(currentStyle.fontStyle);
      expect(liStyle.color).toBe(currentStyle.color);
      expect(liStyle.textDecoration).toBe(currentStyle.textDecoration);
      // Should add list context properties
      expect(liStyle.isListItem).toBe(true);
      expect(liStyle.listNestingLevel).toBeGreaterThan(0);
      expect(liStyle.listType).toBeDefined();
    });
  });

  describe('List Context Management', () => {
    it('should track unordered list context', () => {
      strategy.applyStyle({} as TextStyle, '', 'ul');
      const context = ListHelpers.getListContext();
      expect(context.stack).toEqual(['ul']);
      expect(context.counters.size).toBe(0);
    });

    it('should track ordered list context with counter', () => {
      strategy.applyStyle({} as TextStyle, '', 'ol');
      const context = ListHelpers.getListContext();
      expect(context.stack).toEqual(['ol']);
      expect(context.counters.size).toBe(1);
      expect(context.counters.get('list-ol-1')).toBe(0);
    });

    it('should handle nested lists', () => {
      strategy.applyStyle({} as TextStyle, '', 'ul');
      strategy.applyStyle({} as TextStyle, '', 'ol');
      
      const context = ListHelpers.getListContext();
      expect(context.stack).toEqual(['ul', 'ol']);
      expect(context.counters.size).toBe(1);
      expect(context.counters.get('list-ol-2')).toBe(0);
    });

    it('should clean up context when closing lists', () => {
      strategy.applyStyle({} as TextStyle, '', 'ul');
      strategy.applyStyle({} as TextStyle, '', 'ol');
      
      strategy.handleClosingTag('ol');
      let context = ListHelpers.getListContext();
      expect(context.stack).toEqual(['ul']);
      expect(context.counters.size).toBe(0);

      strategy.handleClosingTag('ul');
      context = ListHelpers.getListContext();
      expect(context.stack).toEqual([]);
    });

    it('should reset all list state', () => {
      strategy.applyStyle({} as TextStyle, '', 'ul');
      strategy.applyStyle({} as TextStyle, '', 'ol');
      
      ListTagStrategy.resetListState();
      const context = ListHelpers.getListContext();
      expect(context.stack).toEqual([]);
      expect(context.counters.size).toBe(0);
    });
  });

  describe('List Item Prefixes', () => {
    it('should return bullet prefix for unordered list items', () => {
      strategy.applyStyle({} as TextStyle, '', 'ul');
      const prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('• ');
    });

    it('should return numbered prefix for ordered list items', () => {
      strategy.applyStyle({} as TextStyle, '', 'ol');
      
      // Simulate processing multiple list items
      strategy.applyStyle({} as TextStyle, '', 'li');
      let prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('1. ');

      strategy.applyStyle({} as TextStyle, '', 'li');
      prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('2. ');

      strategy.applyStyle({} as TextStyle, '', 'li');
      prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('3. ');
    });

    it('should return empty prefix when not in a list', () => {
      const prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('');
    });

    it('should handle nested list prefixes correctly', () => {
      // Outer unordered list
      strategy.applyStyle({} as TextStyle, '', 'ul');
      let prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('• ');

      // Inner ordered list
      strategy.applyStyle({} as TextStyle, '', 'ol');
      prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('1. ');

      // Close inner list, back to outer
      strategy.handleClosingTag('ol');
      prefix = ListHelpers.getListItemPrefix('li');
      expect(prefix).toBe('• ');
    });
  });

  describe('Attribute Validation', () => {
    it('should accept empty attributes', () => {
      const validation = strategy.validateAttributes('');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should accept valid common attributes', () => {
      const validations = [
        strategy.validateAttributes('class="my-list"'),
        strategy.validateAttributes('id="list1"'),
        strategy.validateAttributes('style="color: red"'),
        strategy.validateAttributes('type="disc"'),
        strategy.validateAttributes('start="5"'),
      ];

      validations.forEach(validation => {
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should accept multiple valid attributes', () => {
      const validation = strategy.validateAttributes('class="my-list" id="list1"');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid attribute syntax', () => {
      const validation = strategy.validateAttributes('invalid-attr-without-value class');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid or unsupported attributes for list tag');
    });
  });
});

describe('ListTagStrategy Layout Tests', () => {
  let converter: HTMLToVegaLite;

  beforeEach(() => {
    converter = new HTMLToVegaLite();
  });

  describe('List Item Indentation', () => {
    it('should apply proper indentation for first-level list items', () => {
      const html = '<ul><li>Item 1</li></ul>';
      const spec = converter.convert(html);
      
      // Find the list item data (prefix or content segment, both should have proper indentation)
      const listItemData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text === '•' || item.text === 'Item 1')
      )[0];
      
      expect(listItemData).toBeDefined();
      expect(listItemData.x).toBeGreaterThan(25); // Should have base padding (20px) + startX (10px)
    });

    it('should apply progressive indentation for nested lists', () => {
      const html = `
        <ul>
          <li>Outer item
            <ul>
              <li>Inner item</li>
            </ul>
          </li>
        </ul>
      `;
      const spec = converter.convert(html);
      
      // Find outer and inner list items (text content, not prefixes)
      const outerItemData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text === 'Outer item')
      )[0];
      
      const innerItemData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text === 'Inner item')
      )[0];
      
      expect(outerItemData).toBeDefined();
      expect(innerItemData).toBeDefined();
      
      // Inner item should be indented more than outer item
      expect(innerItemData.x).toBeGreaterThan(outerItemData.x);
      // Should have about 20px additional indentation for nesting
      expect(innerItemData.x - outerItemData.x).toBeGreaterThanOrEqual(15);
    });

    it('should handle mixed ordered and unordered nested lists', () => {
      const html = `
        <ul>
          <li>Bullet item
            <ol>
              <li>Numbered item</li>
            </ol>
          </li>
        </ul>
      `;
      const spec = converter.convert(html);
      
      const bulletItemData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text === 'Bullet item')
      )[0];
      
      const numberedItemData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text === 'Numbered item')
      )[0];
      
      expect(bulletItemData).toBeDefined();
      expect(numberedItemData).toBeDefined();
      expect(numberedItemData.x).toBeGreaterThan(bulletItemData.x);
    });
  });

  describe('Vertical Spacing', () => {
    it('should have proper spacing between heading and list', () => {
      const html = '<h1>Title</h1><ul><li>Item</li></ul>';
      const spec = converter.convert(html);
      
      const titleData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text.includes('Title'))
      )[0];
      
      const listItemData = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text === 'Item')
      )[0];
      
      expect(titleData).toBeDefined();
      expect(listItemData).toBeDefined();
      
      // List item should be positioned below the title with reasonable spacing
      expect(listItemData.y).toBeGreaterThan(titleData.y);
      // But not excessive spacing (should be less than 80px difference)
      expect(listItemData.y - titleData.y).toBeLessThan(80);
    });

    it('should minimize excessive vertical spacing between list items', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      const spec = converter.convert(html);
      
      const listItems = spec.layer.flatMap(layer => 
        layer.data.values.filter(item => item.text.startsWith('Item ') && item.text.match(/Item \d/))
      ).sort((a, b) => a.y - b.y); // Sort by y position
      
      expect(listItems.length).toBe(3);
      
      // Check spacing between consecutive items is reasonable (around line height)
      if (listItems.length >= 2) {
        const spacing = listItems[1].y - listItems[0].y;
        expect(spacing).toBeLessThan(25); // Should be around normal line height (14*1.4 ≈ 20px)
        expect(spacing).toBeGreaterThan(15);
      }
    });
  });
});

describe('ListTagStrategy Integration Tests', () => {
  let parser: HTMLParser;
  let converter: HTMLToVegaLite;

  beforeEach(() => {
    parser = new HTMLParser();
    converter = new HTMLToVegaLite();
  });

  describe('Parser Integration', () => {
    it('should parse simple unordered list', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = parser.parseHTML(html);

      // Verify we have the expected number of segments  
      expect(result.segments.length).toBeGreaterThan(0);
      
      // Check that list items have bullet prefixes (now separated into prefix and content segments)
      const textSegments = result.segments.filter(s => s.text.trim() && !s.text.startsWith('\n'));
      expect(textSegments).toHaveLength(4); // 2 prefixes + 2 content segments
      expect(textSegments[0].text).toBe('•');
      expect(textSegments[1].text).toBe('Item 1');
      expect(textSegments[2].text).toBe('•');
      expect(textSegments[3].text).toBe('Item 2');
    });

    it('should parse simple ordered list', () => {
      const html = '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
      const result = parser.parseHTML(html);

      // Check that list items have numbered prefixes (now separated into prefix and content segments)
      const textSegments = result.segments.filter(s => s.text.trim() && !s.text.startsWith('\n'));
      expect(textSegments[0].text).toBe('1.');
      expect(textSegments[1].text).toBe('First item');
      expect(textSegments[2].text).toBe('2.');
      expect(textSegments[3].text).toBe('Second item');
      expect(textSegments[4].text).toBe('3.');
      expect(textSegments[5].text).toBe('Third item');
    });

    it('should parse nested lists correctly', () => {
      const html = `
        <ul>
          <li>Outer item 1</li>
          <li>Outer item 2
            <ol>
              <li>Inner item 1</li>
              <li>Inner item 2</li>
            </ol>
          </li>
          <li>Outer item 3</li>
        </ul>
      `;
      const result = parser.parseHTML(html);

      const textSegments = result.segments.filter(s => s.text.trim() && !s.text.startsWith('\n') && s.text !== ' ');
      
      // Should have outer bullets and inner numbers (prefixes and content are now separate)
      expect(textSegments.some(s => s.text === '•')).toBe(true); // Bullet prefixes
      expect(textSegments.some(s => s.text === '1.')).toBe(true); // Number prefixes
      expect(textSegments.some(s => s.text === '2.')).toBe(true);
      expect(textSegments.some(s => s.text === 'Outer item 1')).toBe(true);
      expect(textSegments.some(s => s.text === 'Outer item 2')).toBe(true);
      expect(textSegments.some(s => s.text === 'Inner item 1')).toBe(true);
      expect(textSegments.some(s => s.text === 'Inner item 2')).toBe(true);
      expect(textSegments.some(s => s.text === 'Outer item 3')).toBe(true);
    });

    it('should handle list items with styled content', () => {
      const html = '<ul><li><b>Bold item</b></li><li><i>Italic item</i></li></ul>';
      const result = parser.parseHTML(html);

      // Find styled content segments (prefixes are separate now)
      const boldSegment = result.segments.find(s => s.text === 'Bold item');
      expect(boldSegment).toBeDefined();
      expect(boldSegment?.fontWeight).toBe('bold');

      const italicSegment = result.segments.find(s => s.text === 'Italic item');
      expect(italicSegment).toBeDefined();
      expect(italicSegment?.fontStyle).toBe('italic');
      
      // Check that prefixes don't inherit styling
      const bulletPrefixes = result.segments.filter(s => s.text === '•');
      expect(bulletPrefixes.length).toBeGreaterThan(0);
      bulletPrefixes.forEach(prefix => {
        expect(prefix.fontWeight).toBe('normal'); // Prefix should not be bold
        expect(prefix.fontStyle).toBe('normal'); // Prefix should not be italic
      });
    });

    it('should handle empty list items', () => {
      const html = '<ul><li></li><li>Non-empty</li></ul>';
      const result = parser.parseHTML(html);

      // Should still have prefixes for empty items (prefixes and content are separate)
      const textSegments = result.segments.filter(s => s.text.trim() && !s.text.startsWith('\n'));
      expect(textSegments.some(s => s.text === '•')).toBe(true); // Should have bullet prefix
      expect(textSegments.some(s => s.text === 'Non-empty')).toBe(true); // Should have content
    });
  });

  describe('Full Pipeline Integration', () => {
    it('should generate Vega-Lite spec for simple list', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const spec = converter.convert(html);

      expect(spec).toBeDefined();
      expect(spec.layer).toBeDefined();
      expect(spec.layer.length).toBeGreaterThan(0);

      // Check that text data includes separated prefix and content
      const textValues = spec.layer.flatMap(layer => 
        layer.data.values.map(item => item.text)
      );
      const hasBulletPrefix = textValues.some(text => text === '•');
      const hasListContent = textValues.some(text => text === 'Item 1') && textValues.some(text => text === 'Item 2');
      expect(hasBulletPrefix).toBe(true);
      expect(hasListContent).toBe(true);
    });

    it('should generate Vega-Lite spec for ordered list', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const spec = converter.convert(html);

      // Check that text data includes separated numbered prefix and content
      const textValues = spec.layer.flatMap(layer => 
        layer.data.values.map(item => item.text)
      );
      const hasNumberPrefix = textValues.some(text => text === '1.') && textValues.some(text => text === '2.');
      const hasOrderedContent = textValues.some(text => text === 'First') && textValues.some(text => text === 'Second');
      expect(hasNumberPrefix).toBe(true);
      expect(hasOrderedContent).toBe(true);
    });

    it('should handle mixed content with lists', () => {
      const html = `
        <h1>Shopping List</h1>
        <p>Here are the items:</p>
        <ul>
          <li>Apples</li>
          <li>Bananas</li>
        </ul>
        <p>End of list.</p>
      `;
      const spec = converter.convert(html);

      // Should have heading, paragraph, and list content
      const textValues = spec.layer.flatMap(layer => 
        layer.data.values.map(item => item.text)
      );

      expect(textValues.some(text => text.includes('Shopping List'))).toBe(true);
      expect(textValues.some(text => text.includes('Here are the items:'))).toBe(true);
      // Check for separated prefix and content
      expect(textValues.some(text => text === '•')).toBe(true);
      expect(textValues.some(text => text === 'Apples')).toBe(true);
      expect(textValues.some(text => text === 'Bananas')).toBe(true);
      expect(textValues.some(text => text.includes('End of list.'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed list HTML gracefully', () => {
      const html = '<ul><li>Item 1<li>Item 2</ul>'; // Missing closing tag
      const result = parser.parseHTML(html);

      expect(result.errors).toBeDefined();
      expect(result.segments).toBeDefined();
    });

    it('should handle lists with invalid attributes', () => {
      const html = '<ul invalid-attr><li>Item</li></ul>';
      const result = parser.parseHTML(html);

      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.some(error => 
        error.includes('Invalid or unsupported attributes')
      )).toBe(true);
    });
  });
});
