import {
  BoldTagStrategy,
  ItalicTagStrategy,
  UnderlineTagStrategy,
  SpanTagStrategy,
  HeadingTagStrategy,
  ParagraphTagStrategy,
  HyperlinkTagStrategy,
  LineBreakTagStrategy,
  CodeTagStrategy,
  SmallTextTagStrategy,
  HighlightTagStrategy,
  StrikethroughTagStrategy,
  ColorTagStrategy,
  ListTagStrategy,
  BaseTagStrategy,
  TagStrategyRegistry,
  createDefaultTagStrategyRegistry,
  createMinimalTagStrategyRegistry
} from '../src/strategies/index';

import { ListHelpers } from '../src/helpers/composite';
import { TextStyle } from '../src/types';

describe('Tag Strategies', () => {
  describe('BoldTagStrategy', () => {
    let strategy: BoldTagStrategy;

    beforeEach(() => {
      strategy = new BoldTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['b', 'strong']);
    });

    it('should apply bold font weight', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.fontWeight).toBe('bold');
      expect(newStyle.fontStyle).toBe('normal'); // Should preserve other properties
      expect(newStyle.color).toBe('#000000');
    });

    it('should validate attributes', () => {
      const validation = strategy.validateAttributes('');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('ItalicTagStrategy', () => {
    let strategy: ItalicTagStrategy;

    beforeEach(() => {
      strategy = new ItalicTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['i', 'em']);
    });

    it('should apply italic font style', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.fontStyle).toBe('italic');
      expect(newStyle.fontWeight).toBe('normal'); // Should preserve other properties
    });
  });

  describe('UnderlineTagStrategy', () => {
    let strategy: UnderlineTagStrategy;

    beforeEach(() => {
      strategy = new UnderlineTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['u']);
    });

    it('should apply underline text decoration', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.textDecoration).toBe('underline');
    });
  });

  describe('SpanTagStrategy', () => {
    let strategy: SpanTagStrategy;

    beforeEach(() => {
      strategy = new SpanTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['span']);
    });

    it('should parse color from style attribute', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'style="color: red"');
      expect(newStyle.color).toBe('red');
    });

    it('should parse font-weight from style attribute', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'style="font-weight: bold"');
      expect(newStyle.fontWeight).toBe('bold');
    });

    it('should parse font-style from style attribute', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'style="font-style: italic"');
      expect(newStyle.fontStyle).toBe('italic');
    });

    it('should parse text-decoration from style attribute', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'style="text-decoration: underline"');
      expect(newStyle.textDecoration).toBe('underline');
    });

    it('should parse multiple style properties', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'style="color: blue; font-weight: bold; font-style: italic"');
      expect(newStyle.color).toBe('blue');
      expect(newStyle.fontWeight).toBe('bold');
      expect(newStyle.fontStyle).toBe('italic');
    });

    it('should handle malformed style attributes gracefully', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'style="color: red; font-weight:"');
      expect(newStyle.color).toBe('red'); // Should still parse valid properties
    });
  });

  describe('HeadingTagStrategy', () => {
    let strategy: HeadingTagStrategy;

    beforeEach(() => {
      strategy = new HeadingTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    });

    it('should apply bold font weight for headings', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.fontWeight).toBe('bold');
    });

    it('should set correct fontSize for different heading levels', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      // Test H1
      const h1Style = strategy.applyStyle(currentStyle, '', 'h1');
      expect(h1Style.fontSize).toBe(32);
      expect(h1Style.fontWeight).toBe('bold');

      // Test H2
      const h2Style = strategy.applyStyle(currentStyle, '', 'h2');
      expect(h2Style.fontSize).toBe(24);
      expect(h2Style.fontWeight).toBe('bold');

      // Test H3
      const h3Style = strategy.applyStyle(currentStyle, '', 'h3');
      expect(h3Style.fontSize).toBe(18.72);
      expect(h3Style.fontWeight).toBe('bold');
    });
  });

  describe('HyperlinkTagStrategy', () => {
    let strategy: HyperlinkTagStrategy;

    beforeEach(() => {
      strategy = new HyperlinkTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['a']);
    });

    it('should apply link styling', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'href="https://example.com"');
      expect(newStyle.color).toBe('#0066CC');
      expect(newStyle.textDecoration).toBe('underline');
    });

    it('should validate href attribute', () => {
      const validation1 = strategy.validateAttributes('href="https://example.com"');
      expect(validation1.isValid).toBe(true);

      const validation2 = strategy.validateAttributes('href="invalid-url"');
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors).toContain('Invalid URL in href attribute');
    });
  });

  describe('CodeTagStrategy', () => {
    let strategy: CodeTagStrategy;

    beforeEach(() => {
      strategy = new CodeTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['code', 'pre', 'kbd', 'samp']);
    });

    it('should apply code styling', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.color).toBe('#d63384'); // Code color
    });
  });

  describe('HighlightTagStrategy', () => {
    let strategy: HighlightTagStrategy;

    beforeEach(() => {
      strategy = new HighlightTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['mark']);
    });

    it('should apply highlight styling', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.color).toBe('#212529'); // Highlight text color
    });
  });

  describe('SmallTextTagStrategy', () => {
    let strategy: SmallTextTagStrategy;

    beforeEach(() => {
      strategy = new SmallTextTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['small', 'sub', 'sup']);
    });

    it('should apply small text styling', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      // Test small tag
      const smallStyle = strategy.applyStyle(currentStyle, '', 'small');
      expect(smallStyle.color).toBe('#6c757d'); // Muted color for small text
      expect(smallStyle.fontSize).toBe(10.5); // 75% of 14px
      expect(smallStyle.verticalOffset).toBeUndefined(); // No offset for small text
      
      // Test subscript tag
      const subStyle = strategy.applyStyle(currentStyle, '', 'sub');
      expect(subStyle.color).toBe('#000000'); // Normal color for subscript
      expect(subStyle.fontSize).toBe(10.5); // 75% of 14px
      expect(subStyle.verticalOffset).toBeCloseTo(2.1); // Positive offset (down)
      
      // Test superscript tag
      const supStyle = strategy.applyStyle(currentStyle, '', 'sup');
      expect(supStyle.color).toBe('#000000'); // Normal color for superscript
      expect(supStyle.fontSize).toBe(10.5); // 75% of 14px
      expect(supStyle.verticalOffset).toBeCloseTo(-4.9); // Negative offset (up)
    });
  });

  describe('ColorTagStrategy', () => {
    let strategy: ColorTagStrategy;

    beforeEach(() => {
      strategy = new ColorTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'black']);
    });

    it('should apply red color', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, '', 'red');
      expect(newStyle.color).toBe('#FF0000');
    });

    it('should apply green color', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, '', 'green');
      expect(newStyle.color).toBe('#00FF00');
    });

    it('should handle unknown colors', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };

      const newStyle = strategy.applyStyle(currentStyle, 'unknown');
      expect(newStyle.color).toBe('#000000'); // Should preserve original color
    });
  });

  describe('StrikethroughTagStrategy', () => {
    let strategy: StrikethroughTagStrategy;

    beforeEach(() => {
      strategy = new StrikethroughTagStrategy();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['s', 'strike', 'del']);
    });

    it('should apply strikethrough styling', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none'
      };

      const newStyle = strategy.applyStyle(currentStyle, '');
      expect(newStyle.textDecoration).toBe('line-through');
      expect(newStyle.color).toBe('#6c757d'); // Muted color
    });
  });

  describe('ListTagStrategy', () => {
    let strategy: ListTagStrategy;

    beforeEach(() => {
      strategy = new ListTagStrategy();
      ListTagStrategy.resetListState();
    });

    afterEach(() => {
      ListTagStrategy.resetListState();
    });

    it('should return correct tag names', () => {
      const tagNames = strategy.getTagNames();
      expect(tagNames).toEqual(['ul', 'ol', 'li']);
    });

    it('should indicate line break for all list tags', () => {
      expect(strategy.isLineBreak()).toBe(true);
    });

    it('should preserve current style for list container tags', () => {
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#ff0000',
        textDecoration: 'underline'
      };

      const ulStyle = strategy.applyStyle(currentStyle, '', 'ul');
      expect(ulStyle).toEqual(currentStyle);

      const olStyle = strategy.applyStyle(currentStyle, '', 'ol');
      expect(olStyle).toEqual(currentStyle);
    });

    it('should track list context correctly', () => {
      strategy.applyStyle({} as TextStyle, '', 'ul');
      let context = ListHelpers.getListContext();
      expect(context.stack).toEqual(['ul']);

      strategy.applyStyle({} as TextStyle, '', 'ol');
      context = ListHelpers.getListContext();
      expect(context.stack).toEqual(['ul', 'ol']);
    });

    it('should generate correct prefixes', () => {
      // Unordered list
      strategy.applyStyle({} as TextStyle, '', 'ul');
      expect(ListHelpers.getListItemPrefix('li')).toBe('• ');

      // Reset and test ordered list
      ListTagStrategy.resetListState();
      strategy.applyStyle({} as TextStyle, '', 'ol');
      expect(ListHelpers.getListItemPrefix('li')).toBe('1. ');
    });

    it('should validate attributes correctly', () => {
      const validAttrs = strategy.validateAttributes('class="list-class"');
      expect(validAttrs.isValid).toBe(true);

      const invalidAttrs = strategy.validateAttributes('invalid syntax');
      expect(invalidAttrs.isValid).toBe(false);
    });
  });
});

describe('TagStrategyRegistry', () => {
  let registry: TagStrategyRegistry;

  beforeEach(() => {
    registry = new TagStrategyRegistry();
  });

  describe('registerStrategy', () => {
    it('should register a strategy', () => {
      const strategy = new BoldTagStrategy();
      registry.registerStrategy(strategy);

      expect(registry.isSupported('b')).toBe(true);
      expect(registry.isSupported('strong')).toBe(true);
    });

    it('should register multiple strategies', () => {
      const boldStrategy = new BoldTagStrategy();
      const italicStrategy = new ItalicTagStrategy();
      
      registry.registerStrategy(boldStrategy);
      registry.registerStrategy(italicStrategy);

      expect(registry.isSupported('b')).toBe(true);
      expect(registry.isSupported('i')).toBe(true);
      expect(registry.isSupported('em')).toBe(true);
    });
  });

  describe('getStrategy', () => {
    it('should retrieve registered strategy', () => {
      const strategy = new BoldTagStrategy();
      registry.registerStrategy(strategy);

      const retrieved = registry.getStrategy('b');
      expect(retrieved).toBe(strategy);
    });

    it('should return undefined for unregistered tag', () => {
      const retrieved = registry.getStrategy('unknown');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('isSupported', () => {
    it('should return true for supported tags', () => {
      const strategy = new BoldTagStrategy();
      registry.registerStrategy(strategy);

      expect(registry.isSupported('b')).toBe(true);
      expect(registry.isSupported('strong')).toBe(true);
    });

    it('should return false for unsupported tags', () => {
      expect(registry.isSupported('unknown')).toBe(false);
    });
  });

  describe('getSupportedTags', () => {
    it('should return all supported tags', () => {
      const boldStrategy = new BoldTagStrategy();
      const italicStrategy = new ItalicTagStrategy();
      
      registry.registerStrategy(boldStrategy);
      registry.registerStrategy(italicStrategy);

      const supportedTags = registry.getSupportedTags();
      expect(supportedTags).toContain('b');
      expect(supportedTags).toContain('strong');
      expect(supportedTags).toContain('i');
      expect(supportedTags).toContain('em');
    });

    it('should return empty array when no strategies registered', () => {
      const supportedTags = registry.getSupportedTags();
      expect(supportedTags).toEqual([]);
    });
  });

  describe('removeStrategy', () => {
    it('should remove strategy by tag name', () => {
      const strategy = new BoldTagStrategy();
      registry.registerStrategy(strategy);

      expect(registry.isSupported('b')).toBe(true);
      
      const removed = registry.removeStrategy('b');
      expect(removed).toBe(true);
      expect(registry.isSupported('b')).toBe(false);
      expect(registry.isSupported('strong')).toBe(false); // Should remove all tags for the strategy
    });

    it('should return false when removing non-existent strategy', () => {
      const removed = registry.removeStrategy('unknown');
      expect(removed).toBe(false);
    });
  });
});

describe('Factory Functions', () => {
  describe('createDefaultTagStrategyRegistry', () => {
    it('should create registry with all default strategies', () => {
      const registry = createDefaultTagStrategyRegistry();

      // Test core formatting strategies
      expect(registry.isSupported('b')).toBe(true);
      expect(registry.isSupported('strong')).toBe(true);
      expect(registry.isSupported('i')).toBe(true);
      expect(registry.isSupported('em')).toBe(true);
      expect(registry.isSupported('u')).toBe(true);
      expect(registry.isSupported('span')).toBe(true);

      // Test HTML structure strategies
      expect(registry.isSupported('h1')).toBe(true);
      expect(registry.isSupported('h2')).toBe(true);
      expect(registry.isSupported('h3')).toBe(true);
      expect(registry.isSupported('h4')).toBe(true);
      expect(registry.isSupported('h5')).toBe(true);
      expect(registry.isSupported('h6')).toBe(true);
      expect(registry.isSupported('p')).toBe(true);
      expect(registry.isSupported('a')).toBe(true);
      expect(registry.isSupported('br')).toBe(true);

      // Test technical content strategies
      expect(registry.isSupported('code')).toBe(true);
      expect(registry.isSupported('pre')).toBe(true);
      expect(registry.isSupported('kbd')).toBe(true);
      expect(registry.isSupported('samp')).toBe(true);
      expect(registry.isSupported('small')).toBe(true);
      expect(registry.isSupported('sub')).toBe(true);
      expect(registry.isSupported('sup')).toBe(true);
      expect(registry.isSupported('mark')).toBe(true);

      // Test list strategies
      expect(registry.isSupported('ul')).toBe(true);
      expect(registry.isSupported('ol')).toBe(true);
      expect(registry.isSupported('li')).toBe(true);
    });

    it('should return functioning strategies', () => {
      const registry = createDefaultTagStrategyRegistry();
      
      const boldStrategy = registry.getStrategy('b');
      expect(boldStrategy).toBeDefined();
      
      const currentStyle: TextStyle = {
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000'
      };
      
      const newStyle = boldStrategy!.applyStyle(currentStyle, '');
      expect(newStyle.fontWeight).toBe('bold');
    });
  });

  describe('createMinimalTagStrategyRegistry', () => {
    it('should create registry with minimal strategies', () => {
      const registry = createMinimalTagStrategyRegistry();

      // Should only have basic formatting
      expect(registry.isSupported('b')).toBe(true);
      expect(registry.isSupported('strong')).toBe(true);
      expect(registry.isSupported('i')).toBe(true);
      expect(registry.isSupported('em')).toBe(true);
      expect(registry.isSupported('u')).toBe(true);
      expect(registry.isSupported('span')).toBe(true);

      // Should not have advanced strategies
      expect(registry.isSupported('h1')).toBe(false);
      expect(registry.isSupported('code')).toBe(false);
      expect(registry.isSupported('mark')).toBe(false);
    });

    it('should have fewer strategies than default registry', () => {
      const defaultRegistry = createDefaultTagStrategyRegistry();
      const minimalRegistry = createMinimalTagStrategyRegistry();

      const defaultTags = defaultRegistry.getSupportedTags();
      const minimalTags = minimalRegistry.getSupportedTags();

      expect(minimalTags.length).toBeLessThan(defaultTags.length);
    });
  });
});
