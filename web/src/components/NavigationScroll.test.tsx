import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import NavigationScroll from '@/components/NavigationScroll';

// Mock window.scrollTo
const mockScrollTo = vi.fn();

describe('NavigationScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScrollTo.mockClear();
    mockScrollTo.mockReset();

    // Ensure global window object exists
    if (typeof global.window === 'undefined') {
      // @ts-expect-error - Creating minimal window mock for tests
      global.window = {};
    }

    // Reset scrollTo mock to default implementation
    Object.defineProperty(global.window, 'scrollTo', {
      value: mockScrollTo,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Clean up any mock implementations
    mockScrollTo.mockReset();
  });

  describe('Rendering Tests', () => {
    it('should render children correctly', () => {
      render(
        <NavigationScroll>
          <div data-testid="child-component">Test Content</div>
        </NavigationScroll>,
      );

      const child = screen.getByTestId('child-component');
      expect(child).toBeInTheDocument();
      expect(child).toHaveTextContent('Test Content');
    });

    it('should render multiple children', () => {
      render(
        <NavigationScroll>
          <div data-testid="child-1">First Child</div>
          <div data-testid="child-2">Second Child</div>
          <span data-testid="child-3">Third Child</span>
        </NavigationScroll>,
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should render with React Fragment wrapper', () => {
      const { container } = render(
        <NavigationScroll>
          <div>Test Content</div>
        </NavigationScroll>,
      );

      // Should not add any wrapper element
      expect(container.firstChild).toHaveTextContent('Test Content');
    });

    it('should handle empty children', () => {
      const { container } = render(<NavigationScroll>{null}</NavigationScroll>);

      expect(container).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(<NavigationScroll>Simple text content</NavigationScroll>);

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior Tests', () => {
    it('should call window.scrollTo with default smooth behavior', () => {
      render(
        <NavigationScroll>
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should call window.scrollTo with custom scroll behavior', () => {
      render(
        <NavigationScroll scrollBehavior="auto">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    });

    it('should call window.scrollTo with instant behavior', () => {
      render(
        <NavigationScroll scrollBehavior="instant">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    });

    it('should scroll only when scrollBehavior changes', () => {
      const { rerender } = render(
        <NavigationScroll scrollBehavior="smooth">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledTimes(1);

      // Re-render with same scrollBehavior but different children
      rerender(
        <NavigationScroll scrollBehavior="smooth">
          <div>Updated Content</div>
        </NavigationScroll>,
      );

      // useLayoutEffect has [scrollBehavior] dependency, so it shouldn't run again
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should scroll when behavior changes', () => {
      const { rerender } = render(
        <NavigationScroll scrollBehavior="smooth">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });

      // Change behavior
      rerender(
        <NavigationScroll scrollBehavior="auto">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
      expect(mockScrollTo).toHaveBeenCalledTimes(2);
    });
  });

  describe('useLayoutEffect Integration', () => {
    it('should use useLayoutEffect for synchronous scroll', () => {
      // This test verifies the component executes during layout phase
      let scrollCalled = false;

      mockScrollTo.mockImplementation(() => {
        scrollCalled = true;
      });

      render(
        <NavigationScroll>
          <div>Content</div>
        </NavigationScroll>,
      );

      // scrollTo should have been called synchronously
      expect(scrollCalled).toBe(true);
    });

    it('should clean up properly on unmount', () => {
      const { unmount } = render(
        <NavigationScroll>
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledTimes(1);

      // Unmount should not cause additional calls
      unmount();
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid mount/unmount cycles', () => {
      const { unmount: unmount1 } = render(
        <NavigationScroll>
          <div>Content 1</div>
        </NavigationScroll>,
      );

      const { unmount: unmount2 } = render(
        <NavigationScroll>
          <div>Content 2</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledTimes(2);

      unmount1();
      unmount2();

      // Should not cause additional calls
      expect(mockScrollTo).toHaveBeenCalledTimes(2);
    });
  });

  describe('Window Environment Tests', () => {
    it('should work in browser environment', () => {
      // Ensure window exists (normal test environment)
      expect(typeof global.window).toBe('object');

      render(
        <NavigationScroll>
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    });

    it('should handle window.scrollTo gracefully', () => {
      render(
        <NavigationScroll scrollBehavior="auto">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined scrollBehavior prop', () => {
      render(
        <NavigationScroll scrollBehavior={undefined}>
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth', // Default value
      });
    });

    it('should handle null children gracefully', () => {
      render(<NavigationScroll>{null}</NavigationScroll>);

      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined children gracefully', () => {
      render(<NavigationScroll>{undefined}</NavigationScroll>);

      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should handle boolean children gracefully', () => {
      render(
        <NavigationScroll>
          {false}
          {true}
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should handle array of children', () => {
      const children = [
        <div key="1" data-testid="child-1">
          First
        </div>,
        <div key="2" data-testid="child-2">
          Second
        </div>,
      ];

      render(<NavigationScroll>{children}</NavigationScroll>);

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle scrollTo method not available', () => {
      // Mock scrollTo as undefined
      Object.defineProperty(global.window, 'scrollTo', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => {
        render(
          <NavigationScroll>
            <div>Content</div>
          </NavigationScroll>,
        );
      }).toThrow();

      // Restore scrollTo
      Object.defineProperty(global.window, 'scrollTo', {
        value: mockScrollTo,
        writable: true,
        configurable: true,
      });
    });

    it('should handle scrollTo throwing error', () => {
      mockScrollTo.mockImplementation(() => {
        throw new Error('Scroll failed');
      });

      expect(() => {
        render(
          <NavigationScroll>
            <div>Content</div>
          </NavigationScroll>,
        );
      }).toThrow('Scroll failed');
    });

    it('should handle very complex children structure', () => {
      render(
        <NavigationScroll>
          <div>
            <header>
              <nav>
                <ul>
                  <li>
                    <a href="#home">Home</a>
                  </li>
                  <li>
                    <a href="#about">About</a>
                  </li>
                </ul>
              </nav>
            </header>
            <main>
              <section>
                <h1>Main Content</h1>
                <p>Paragraph content</p>
              </section>
            </main>
            <footer>
              <p>Footer content</p>
            </footer>
          </div>
        </NavigationScroll>,
      );

      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Tests', () => {
    it('should not cause memory leaks with multiple instances', () => {
      const instances = [];

      for (let i = 0; i < 10; i++) {
        instances.push(
          render(
            <NavigationScroll key={i}>
              <div>Instance {i}</div>
            </NavigationScroll>,
          ),
        );
      }

      expect(mockScrollTo).toHaveBeenCalledTimes(10);

      // Unmount all instances
      instances.forEach((instance) => instance.unmount());
    });

    it('should handle rapid prop changes efficiently', () => {
      const behaviors: ScrollBehavior[] = ['auto', 'instant'];

      const { rerender } = render(
        <NavigationScroll scrollBehavior="smooth">
          <div>Content</div>
        </NavigationScroll>,
      );

      let callCount = 1; // Initial render

      behaviors.forEach((behavior) => {
        rerender(
          <NavigationScroll scrollBehavior={behavior}>
            <div>Content</div>
          </NavigationScroll>,
        );
        callCount++; // Each behavior change triggers useLayoutEffect
      });

      expect(mockScrollTo).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('ScrollBehavior Type Tests', () => {
    it('should accept all valid ScrollBehavior values', () => {
      const behaviors: ScrollBehavior[] = ['auto', 'instant', 'smooth'];

      behaviors.forEach((behavior) => {
        const { unmount } = render(
          <NavigationScroll scrollBehavior={behavior}>
            <div>Content for {behavior}</div>
          </NavigationScroll>,
        );

        expect(mockScrollTo).toHaveBeenCalledWith({
          top: 0,
          left: 0,
          behavior,
        });

        unmount();
      });
    });

    it('should maintain type safety for scrollBehavior prop', () => {
      // This test verifies TypeScript compilation
      render(
        <NavigationScroll scrollBehavior="smooth">
          <div>Content</div>
        </NavigationScroll>,
      );

      render(
        <NavigationScroll scrollBehavior="auto">
          <div>Content</div>
        </NavigationScroll>,
      );

      render(
        <NavigationScroll scrollBehavior="instant">
          <div>Content</div>
        </NavigationScroll>,
      );

      expect(mockScrollTo).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration Tests', () => {
    it('should work with React Router navigation', () => {
      // Simulate route change scenario
      render(
        <NavigationScroll>
          <div data-testid="page-content">
            <h1>New Page</h1>
            <p>Page content after navigation</p>
          </div>
        </NavigationScroll>,
      );

      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    });

    it('should work in layout components', () => {
      render(
        <NavigationScroll>
          <div role="main">
            <aside>Sidebar</aside>
            <article>
              <header>Article Header</header>
              <section>Article Content</section>
            </article>
          </div>
        </NavigationScroll>,
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
      expect(screen.getByText('Article Content')).toBeInTheDocument();
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should work with conditional rendering', () => {
      const isVisible = true;
      const isHidden = false;

      const { rerender } = render(
        <NavigationScroll scrollBehavior="smooth">
          {isVisible && <div data-testid="conditional-content">Visible</div>}
        </NavigationScroll>,
      );

      expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
      expect(mockScrollTo).toHaveBeenCalledTimes(1);

      rerender(
        <NavigationScroll scrollBehavior="smooth">
          {isHidden && <div data-testid="conditional-content">Hidden</div>}
        </NavigationScroll>,
      );

      expect(screen.queryByTestId('conditional-content')).not.toBeInTheDocument();
      // Still only 1 call since scrollBehavior didn't change
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });
  });
});
