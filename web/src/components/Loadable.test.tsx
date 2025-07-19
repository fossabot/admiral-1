import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, render } from '@testing-library/react';

import Loadable from '@/components/Loadable';

// Test components
const TestComponent = ({ title, required }: { title: string; required: string }) => (
  <div data-testid="test-component">
    <h1>{title}</h1>
    <p>{required}</p>
  </div>
);

const AsyncComponent = ({ delay = 100 }: { delay?: number }) => {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!loaded) {
    throw new Promise((resolve) => setTimeout(resolve, delay));
  }

  return <div data-testid="async-component">Async Content</div>;
};

const ErrorComponent = ({ shouldError = false }: { shouldError?: boolean }) => {
  if (shouldError) {
    throw new Error('Test error');
  }
  return <div data-testid="error-component">No Error</div>;
};

const ComponentWithDisplayName = () => <div data-testid="display-name-component">Component</div>;
ComponentWithDisplayName.displayName = 'CustomDisplayName';

describe('Loadable', () => {
  beforeEach(() => {
    // Clear any mocks if needed
  });

  describe('Rendering Tests', () => {
    it('should render wrapped component with default props', () => {
      const LoadableTestComponent = Loadable(TestComponent);

      render(<LoadableTestComponent title="Test Title" required="Test Required" />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Required')).toBeInTheDocument();
    });

    it('should render with custom fallback', () => {
      const LoadableAsyncComponent = Loadable(AsyncComponent);
      const customFallback = <div data-testid="custom-fallback">Custom Loading...</div>;

      render(<LoadableAsyncComponent fallback={customFallback} delay={1000} />);

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('should return a React component', () => {
      const LoadableTestComponent = Loadable(TestComponent);
      expect(LoadableTestComponent).toBeDefined();
      expect(typeof LoadableTestComponent).toBe('object'); // memo() returns an object
    });

    it('should handle components with different names', () => {
      const LoadableTestComponent = Loadable(TestComponent);
      const LoadableDisplayNameComponent = Loadable(ComponentWithDisplayName);

      // Both should be valid React components
      expect(LoadableTestComponent).toBeDefined();
      expect(LoadableDisplayNameComponent).toBeDefined();
    });
  });

  describe('Props Validation', () => {
    it('should throw error for missing required props', () => {
      const LoadableTestComponent = Loadable(TestComponent);

      expect(() => {
        render(<LoadableTestComponent title="Test Title" required={undefined as unknown as string} />);
      }).toThrow('Missing required props for TestComponent: required');
    });

    it('should throw error for multiple missing required props', () => {
      const LoadableTestComponent = Loadable(TestComponent);

      expect(() => {
        render(
          <LoadableTestComponent title={undefined as unknown as string} required={undefined as unknown as string} />,
        );
      }).toThrow('Missing required props for TestComponent: title, required');
    });

    it('should pass through valid props correctly', () => {
      const LoadableTestComponent = Loadable(TestComponent);

      render(<LoadableTestComponent title="Valid Title" required="Valid Required" />);

      expect(screen.getByText('Valid Title')).toBeInTheDocument();
      expect(screen.getByText('Valid Required')).toBeInTheDocument();
    });

    it('should filter out fallback prop from component props', () => {
      const PropsTestComponent = ({ fallback, ...props }: { fallback?: React.ReactNode; otherProp?: string }) => (
        <div data-testid="props-test">
          <span>fallback: {fallback ? 'present' : 'not present'}</span>
          <span>otherProp: {props.otherProp}</span>
        </div>
      );

      const LoadablePropsTestComponent = Loadable(PropsTestComponent);

      render(<LoadablePropsTestComponent fallback={<div>Custom fallback</div>} otherProp="test value" />);

      expect(screen.getByText('fallback: not present')).toBeInTheDocument();
      expect(screen.getByText('otherProp: test value')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error boundary fallback when component throws error', () => {
      const LoadableErrorComponent = Loadable(ErrorComponent);

      render(<LoadableErrorComponent shouldError={true} />);

      expect(screen.getByText('Error loading component.')).toBeInTheDocument();
      expect(screen.queryByTestId('error-component')).not.toBeInTheDocument();
    });

    it('should render normally when component does not throw error', () => {
      const LoadableErrorComponent = Loadable(ErrorComponent);

      render(<LoadableErrorComponent shouldError={false} />);

      expect(screen.getByTestId('error-component')).toBeInTheDocument();
      expect(screen.queryByText('Error loading component.')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const originalError = console.error;
      let errorCalled = false;
      console.error = () => {
        errorCalled = true;
      };

      const LoadableErrorComponent = Loadable(ErrorComponent);

      render(<LoadableErrorComponent shouldError={true} />);

      expect(errorCalled).toBe(true);
      console.error = originalError;
    });
  });

  describe('Memoization', () => {
    it('should memoize component and avoid re-renders with same props', () => {
      let renderCount = 0;
      const CountingComponent = ({ value }: { value: string }) => {
        renderCount++;
        return <div data-testid="counting-component">{value}</div>;
      };

      const LoadableCountingComponent = Loadable(CountingComponent);

      const { rerender } = render(<LoadableCountingComponent value="test" />);

      expect(renderCount).toBe(1);

      // Re-render with same props
      rerender(<LoadableCountingComponent value="test" />);
      expect(renderCount).toBe(1); // Should not re-render

      // Re-render with different props
      rerender(<LoadableCountingComponent value="different" />);
      expect(renderCount).toBe(2); // Should re-render
    });
  });

  describe('Edge Cases', () => {
    it('should handle components with no props', () => {
      const NoPropsComponent = () => <div data-testid="no-props">No props needed</div>;
      const LoadableNoPropsComponent = Loadable(NoPropsComponent);

      render(<LoadableNoPropsComponent />);

      expect(screen.getByTestId('no-props')).toBeInTheDocument();
    });

    it('should handle components with optional props', () => {
      const OptionalPropsComponent = ({ optional }: { optional?: string }) => (
        <div data-testid="optional-props">{optional || 'No optional prop'}</div>
      );

      const LoadableOptionalPropsComponent = Loadable(OptionalPropsComponent);

      render(<LoadableOptionalPropsComponent />);
      expect(screen.getByText('No optional prop')).toBeInTheDocument();

      render(<LoadableOptionalPropsComponent optional="Has optional" />);
      expect(screen.getByText('Has optional')).toBeInTheDocument();
    });

    it('should handle components that throw synchronous errors', () => {
      const SyncErrorComponent = () => {
        throw new Error('Synchronous error');
      };

      const LoadableSyncErrorComponent = Loadable(SyncErrorComponent);

      render(<LoadableSyncErrorComponent />);

      expect(screen.getByText('Error loading component.')).toBeInTheDocument();
    });
  });
});
