// Interfaces
export * from './interfaces/index';

// Implementations
export * from './implementations/index';

// Registry
export * from './registry/index';

// Convenience factory for creating a registry with default strategies
import { TagStrategyRegistry } from './registry/index';
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
  ListTagStrategy
} from './implementations/index';

/**
 * Creates a registry with default strategies pre-registered
 */
export function createDefaultTagStrategyRegistry(): TagStrategyRegistry {
  const registry = new TagStrategyRegistry();
  
  // Register core text formatting strategies
  registry.registerStrategy(new BoldTagStrategy());
  registry.registerStrategy(new ItalicTagStrategy());
  registry.registerStrategy(new UnderlineTagStrategy());
  registry.registerStrategy(new SpanTagStrategy());
  
  // Register HTML structure strategies
  registry.registerStrategy(new HeadingTagStrategy());
  registry.registerStrategy(new ParagraphTagStrategy());
  registry.registerStrategy(new HyperlinkTagStrategy());
  registry.registerStrategy(new LineBreakTagStrategy());
  
  // Register additional text formatting strategies
  registry.registerStrategy(new CodeTagStrategy());
  registry.registerStrategy(new SmallTextTagStrategy());
  registry.registerStrategy(new HighlightTagStrategy());
  registry.registerStrategy(new StrikethroughTagStrategy());
  registry.registerStrategy(new ListTagStrategy());
  
  return registry;
}

/**
 * Creates a minimal registry with only basic text formatting strategies
 */
export function createMinimalTagStrategyRegistry(): TagStrategyRegistry {
  const registry = new TagStrategyRegistry();
  
  // Register only basic strategies
  registry.registerStrategy(new BoldTagStrategy());
  registry.registerStrategy(new ItalicTagStrategy());
  registry.registerStrategy(new UnderlineTagStrategy());
  registry.registerStrategy(new SpanTagStrategy()); // Add span support
  
  return registry;
}
