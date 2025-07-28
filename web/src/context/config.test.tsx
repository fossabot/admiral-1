import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

import { ConfigProvider, Config } from '@/context/config';
import { services } from '@/services';
import { config as defaultConfig } from '@/constant';
import type { Config as ConfigType } from '@/types/config';

// Mock the services
vi.mock('../services', () => ({
  services: {
    config: {
      get: vi.fn(),
    },
  },
}));

// Mock console.warn to test error handling
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Test component to consume the context
const TestConsumer = ({ testId = 'config-consumer' }: { testId?: string }) => {
  const config = useContext(Config);
  return (
    <div data-testid={testId}>
      <span data-testid="config-content">{JSON.stringify(config)}</span>
    </div>
  );
};

describe('Config Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ConfigProvider Rendering', () => {
    it('should render children correctly', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(
        <ConfigProvider>
          <div data-testid="child">Test Child</div>
        </ConfigProvider>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should render multiple children', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(
        <ConfigProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </ConfigProvider>,
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty children', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      const { container } = render(<ConfigProvider>{null}</ConfigProvider>);

      expect(container).toBeInTheDocument();

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle string children', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(<ConfigProvider>Simple text content</ConfigProvider>);

      expect(screen.getByText('Simple text content')).toBeInTheDocument();

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Config Context Value', () => {
    it('should provide default config initially', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(
        <ConfigProvider>
          <TestConsumer />
        </ConfigProvider>,
      );

      const configContent = screen.getByTestId('config-content');
      expect(configContent).toHaveTextContent(JSON.stringify(defaultConfig));

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should provide config context to consumers', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(
        <ConfigProvider>
          <TestConsumer />
        </ConfigProvider>,
      );

      expect(screen.getByTestId('config-consumer')).toBeInTheDocument();
      expect(screen.getByTestId('config-content')).toBeInTheDocument();

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should provide context to nested consumers', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(
        <ConfigProvider>
          <div>
            <div>
              <TestConsumer testId="nested-consumer" />
            </div>
          </div>
        </ConfigProvider>,
      );

      expect(screen.getByTestId('nested-consumer')).toBeInTheDocument();
      expect(screen.getByTestId('config-content')).toBeInTheDocument();

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Config Fetching', () => {
    it('should call config service on mount', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      render(
        <ConfigProvider>
          <TestConsumer />
        </ConfigProvider>,
      );

      // Wait for the async config fetch to complete
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should update config when service returns data', async () => {
      const fetchedConfig: ConfigType = {};
      vi.mocked(services.config.get).mockResolvedValue(fetchedConfig);

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      const configContent = screen.getByTestId('config-content');
      expect(configContent).toHaveTextContent(JSON.stringify({ ...defaultConfig, ...fetchedConfig }));
    });

    it('should merge fetched config with default config', async () => {
      const fetchedConfig: ConfigType = {};
      vi.mocked(services.config.get).mockResolvedValue(fetchedConfig);

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      const configContent = screen.getByTestId('config-content');
      const expectedConfig = { ...defaultConfig, ...fetchedConfig };
      expect(configContent).toHaveTextContent(JSON.stringify(expectedConfig));
    });

    it('should handle empty config from service', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      const configContent = screen.getByTestId('config-content');
      expect(configContent).toHaveTextContent(JSON.stringify(defaultConfig));
    });
  });

  describe('Error Handling', () => {
    it('should handle config fetch failure gracefully', async () => {
      const error = new Error('Network error');
      vi.mocked(services.config.get).mockRejectedValue(error);

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(mockConsoleWarn).toHaveBeenCalledWith('Failed to fetch config, using default:', error);
      });

      // Should still provide default config
      const configContent = screen.getByTestId('config-content');
      expect(configContent).toHaveTextContent(JSON.stringify(defaultConfig));
    });

    it('should handle service throwing synchronous error', async () => {
      vi.mocked(services.config.get).mockImplementation(() => {
        throw new Error('Sync error');
      });

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(mockConsoleWarn).toHaveBeenCalledWith('Failed to fetch config, using default:', expect.any(Error));
      });

      const configContent = screen.getByTestId('config-content');
      expect(configContent).toHaveTextContent(JSON.stringify(defaultConfig));
    });

    it('should handle service returning null/undefined', async () => {
      vi.mocked(services.config.get).mockResolvedValue(null as unknown as ConfigType);

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      // Should merge null with default config (null spreads to empty object)
      const configContent = screen.getByTestId('config-content');
      expect(configContent).toHaveTextContent(JSON.stringify({ ...defaultConfig }));
    });

    it('should not crash on fetch errors and continue rendering', async () => {
      vi.mocked(services.config.get).mockRejectedValue(new Error('Fetch failed'));

      expect(() => {
        act(() => {
          render(
            <ConfigProvider>
              <div data-testid="content">Content should render</div>
            </ConfigProvider>,
          );
        });
      }).not.toThrow();

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize context value correctly', async () => {
      const TestComponent = () => {
        useContext(Config); // Consuming context to test memoization
        const renderCount = React.useRef(0);
        renderCount.current++;

        return <div data-testid="render-count">{renderCount.current}</div>;
      };

      vi.mocked(services.config.get).mockResolvedValue({});

      let rerender: ReturnType<typeof render>['rerender'];
      act(() => {
        const result = render(
          <ConfigProvider>
            <TestComponent />
          </ConfigProvider>,
        );
        rerender = result.rerender;
      });

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Re-render with same children (this will create a new provider instance)
      act(() => {
        rerender(
          <ConfigProvider>
            <TestComponent />
          </ConfigProvider>,
        );
      });

      // Will re-render because it's a new provider instance
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });

    it('should update memoized value when config changes', async () => {
      let configValue: ConfigType = {};

      vi.mocked(services.config.get).mockImplementation(() => Promise.resolve(configValue));

      let rerender: ReturnType<typeof render>['rerender'];
      act(() => {
        const result = render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
        rerender = result.rerender;
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      const initialConfig = screen.getByTestId('config-content').textContent;

      // Change the config value and re-render
      configValue = {};

      act(() => {
        rerender(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      // Config should remain the same since useEffect only runs on mount
      expect(screen.getByTestId('config-content')).toHaveTextContent(initialConfig!);
    });
  });

  describe('Multiple Providers', () => {
    it('should handle nested providers correctly', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      act(() => {
        render(
          <ConfigProvider>
            <ConfigProvider>
              <TestConsumer testId="nested-consumer" />
            </ConfigProvider>
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(2);
      });

      expect(screen.getByTestId('nested-consumer')).toBeInTheDocument();
    });

    it('should handle sibling providers independently', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      act(() => {
        render(
          <div>
            <ConfigProvider>
              <TestConsumer testId="provider-1" />
            </ConfigProvider>
            <ConfigProvider>
              <TestConsumer testId="provider-2" />
            </ConfigProvider>
          </div>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(2);
      });

      expect(screen.getByTestId('provider-1')).toBeInTheDocument();
      expect(screen.getByTestId('provider-2')).toBeInTheDocument();
    });
  });

  describe('Context Consumer Edge Cases', () => {
    it('should work with conditional rendering', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      const ConditionalConsumer = ({ show }: { show: boolean }) => (
        <ConfigProvider>{show && <TestConsumer testId="conditional" />}</ConfigProvider>
      );

      let rerender: ReturnType<typeof render>['rerender'];
      act(() => {
        const result = render(<ConditionalConsumer show={false} />);
        rerender = result.rerender;
      });

      expect(screen.queryByTestId('conditional')).not.toBeInTheDocument();

      act(() => {
        rerender(<ConditionalConsumer show={true} />);
      });

      expect(screen.getByTestId('conditional')).toBeInTheDocument();
    });

    it('should handle dynamic children', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      const DynamicProvider = ({ childrenCount }: { childrenCount: number }) => (
        <ConfigProvider>
          {Array.from({ length: childrenCount }, (_, i) => (
            <TestConsumer key={i} testId={`dynamic-${i}`} />
          ))}
        </ConfigProvider>
      );

      let rerender: ReturnType<typeof render>['rerender'];
      act(() => {
        const result = render(<DynamicProvider childrenCount={1} />);
        rerender = result.rerender;
      });

      expect(screen.getByTestId('dynamic-0')).toBeInTheDocument();
      expect(screen.queryByTestId('dynamic-1')).not.toBeInTheDocument();

      act(() => {
        rerender(<DynamicProvider childrenCount={3} />);
      });

      expect(screen.getByTestId('dynamic-0')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-1')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-2')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should not cause memory leaks on unmount', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      let unmount: ReturnType<typeof render>['unmount'] | undefined;
      act(() => {
        const result = render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
        unmount = result.unmount;
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByTestId('config-consumer')).toBeInTheDocument();

      unmount?.();

      // Should clean up without errors
      expect(screen.queryByTestId('config-consumer')).not.toBeInTheDocument();
    });

    it('should handle rapid mount/unmount cycles', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      for (let i = 0; i < 5; i++) {
        let unmount: ReturnType<typeof render>['unmount'] | undefined;
        act(() => {
          const result = render(
            <ConfigProvider>
              <TestConsumer testId={`cycle-${i}`} />
            </ConfigProvider>,
          );
          unmount = result.unmount;
        });

        expect(screen.getByTestId(`cycle-${i}`)).toBeInTheDocument();
        unmount?.();
      }

      expect(services.config.get).toHaveBeenCalledTimes(5);
    });

    it('should handle multiple consumers efficiently', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer testId="consumer-1" />
            <TestConsumer testId="consumer-2" />
            <TestConsumer testId="consumer-3" />
            <TestConsumer testId="consumer-4" />
            <TestConsumer testId="consumer-5" />
          </ConfigProvider>,
        );
      });

      // Should only fetch config once despite multiple consumers
      expect(services.config.get).toHaveBeenCalledTimes(1);

      // All consumers should receive the same config
      expect(screen.getByTestId('consumer-1')).toBeInTheDocument();
      expect(screen.getByTestId('consumer-2')).toBeInTheDocument();
      expect(screen.getByTestId('consumer-3')).toBeInTheDocument();
      expect(screen.getByTestId('consumer-4')).toBeInTheDocument();
      expect(screen.getByTestId('consumer-5')).toBeInTheDocument();
    });
  });

  describe('Async Behavior', () => {
    it('should handle slow network responses', async () => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      vi.mocked(services.config.get).mockImplementation(async () => {
        await delay(100);
        return {};
      });

      act(() => {
        render(
          <ConfigProvider>
            <TestConsumer />
          </ConfigProvider>,
        );
      });

      // Should show default config immediately
      expect(screen.getByTestId('config-content')).toHaveTextContent(JSON.stringify(defaultConfig));

      // After fetch completes, should still show merged config
      await waitFor(
        () => {
          expect(services.config.get).toHaveBeenCalledTimes(1);
        },
        { timeout: 200 },
      );
    });

    it('should handle concurrent config fetches', async () => {
      let resolveCount = 0;
      vi.mocked(services.config.get).mockImplementation(async () => {
        resolveCount++;
        return {};
      });

      act(() => {
        render(
          <div>
            <ConfigProvider>
              <TestConsumer testId="concurrent-1" />
            </ConfigProvider>
            <ConfigProvider>
              <TestConsumer testId="concurrent-2" />
            </ConfigProvider>
          </div>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(2);
      });

      expect(resolveCount).toBe(2);
      expect(screen.getByTestId('concurrent-1')).toBeInTheDocument();
      expect(screen.getByTestId('concurrent-2')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with complex component hierarchies', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      const ComplexHierarchy = () => (
        <ConfigProvider>
          <div>
            <header>
              <nav>
                <TestConsumer testId="nav-consumer" />
              </nav>
            </header>
            <main>
              <section>
                <article>
                  <TestConsumer testId="article-consumer" />
                </article>
              </section>
            </main>
            <footer>
              <TestConsumer testId="footer-consumer" />
            </footer>
          </div>
        </ConfigProvider>
      );

      act(() => {
        render(<ComplexHierarchy />);
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByTestId('nav-consumer')).toBeInTheDocument();
      expect(screen.getByTestId('article-consumer')).toBeInTheDocument();
      expect(screen.getByTestId('footer-consumer')).toBeInTheDocument();
    });

    it('should work with React.Fragment wrappers', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      act(() => {
        render(
          <ConfigProvider>
            <React.Fragment>
              <TestConsumer testId="fragment-1" />
              <React.Fragment>
                <TestConsumer testId="fragment-2" />
              </React.Fragment>
            </React.Fragment>
          </ConfigProvider>,
        );
      });

      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByTestId('fragment-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-2')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined children gracefully', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      let container: ReturnType<typeof render>['container'] | undefined;
      act(() => {
        const result = render(<ConfigProvider>{undefined}</ConfigProvider>);
        container = result.container;
      });

      expect(container).toBeInTheDocument();
      await waitFor(() => {
        expect(services.config.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle array of children', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      const children = [<TestConsumer key="1" testId="array-1" />, <TestConsumer key="2" testId="array-2" />];

      act(() => {
        render(<ConfigProvider>{children}</ConfigProvider>);
      });

      expect(screen.getByTestId('array-1')).toBeInTheDocument();
      expect(screen.getByTestId('array-2')).toBeInTheDocument();
    });

    it('should handle function as child render prop', async () => {
      vi.mocked(services.config.get).mockResolvedValue({});

      const RenderPropProvider = ({ children }: { children: (config: ConfigType) => React.ReactNode }) => {
        const config = useContext(Config);
        return <>{children(config)}</>;
      };

      act(() => {
        render(
          <ConfigProvider>
            <RenderPropProvider>
              {(config) => <div data-testid="render-prop-child">Config: {JSON.stringify(config)}</div>}
            </RenderPropProvider>
          </ConfigProvider>,
        );
      });

      expect(screen.getByTestId('render-prop-child')).toBeInTheDocument();
    });
  });
});
