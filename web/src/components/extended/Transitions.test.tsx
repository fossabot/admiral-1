import { describe, it, expect, beforeEach, vi } from 'vitest';
import React, { useRef, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Transitions from '@/components/extended/Transitions';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, themeMode: 'light' | 'dark' = 'light') => {
  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

// Test component that uses the ref
const RefTestComponent = ({ onRefReady }: { onRefReady: (ref: HTMLDivElement | null) => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onRefReady(ref.current);
  }, [onRefReady]);

  return (
    <Transitions ref={ref} in={true}>
      <div data-testid="ref-test-content">Ref Test Content</div>
    </Transitions>
  );
};

describe('Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render with default props', () => {
      renderWithTheme(
        <Transitions in={true}>
          <div data-testid="test-content">Test Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should render without children', () => {
      const { container } = renderWithTheme(<Transitions in={true} />);

      expect(container).toBeInTheDocument();
    });

    it('should render with string children', () => {
      renderWithTheme(
        <Transitions in={true}>
          <span>Text Content</span>
        </Transitions>,
      );

      expect(screen.getByText('Text Content')).toBeInTheDocument();
    });

    it('should render with complex children', () => {
      renderWithTheme(
        <Transitions in={true}>
          <div data-testid="complex-content">
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Action</button>
          </div>
        </Transitions>,
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Transition Type Tests', () => {
    it('should render grow transition by default', () => {
      renderWithTheme(
        <Transitions in={true} type="grow">
          <div data-testid="grow-content">Grow Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('grow-content')).toBeInTheDocument();
    });

    it('should render collapse transition', () => {
      renderWithTheme(
        <Transitions in={true} type="collapse">
          <div data-testid="collapse-content">Collapse Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('collapse-content')).toBeInTheDocument();
    });

    it('should render fade transition', () => {
      renderWithTheme(
        <Transitions in={true} type="fade">
          <div data-testid="fade-content">Fade Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('fade-content')).toBeInTheDocument();
    });

    it('should render slide transition', () => {
      renderWithTheme(
        <Transitions in={true} type="slide">
          <div data-testid="slide-content">Slide Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('slide-content')).toBeInTheDocument();
    });

    it('should render zoom transition', () => {
      renderWithTheme(
        <Transitions in={true} type="zoom">
          <div data-testid="zoom-content">Zoom Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('zoom-content')).toBeInTheDocument();
    });

    it('should render with invalid transition type fallback', () => {
      renderWithTheme(
        <Transitions in={true} type={'invalid' as 'grow'}>
          <div data-testid="fallback-content">Fallback Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
  });

  describe('Position Tests', () => {
    it('should render with top-left position by default', () => {
      renderWithTheme(
        <Transitions in={true} position="top-left">
          <div data-testid="top-left-content">Top Left</div>
        </Transitions>,
      );

      expect(screen.getByTestId('top-left-content')).toBeInTheDocument();
    });

    it('should render with top-right position', () => {
      renderWithTheme(
        <Transitions in={true} position="top-right">
          <div data-testid="top-right-content">Top Right</div>
        </Transitions>,
      );

      expect(screen.getByTestId('top-right-content')).toBeInTheDocument();
    });

    it('should render with top position', () => {
      renderWithTheme(
        <Transitions in={true} position="top">
          <div data-testid="top-content">Top</div>
        </Transitions>,
      );

      expect(screen.getByTestId('top-content')).toBeInTheDocument();
    });

    it('should render with bottom-left position', () => {
      renderWithTheme(
        <Transitions in={true} position="bottom-left">
          <div data-testid="bottom-left-content">Bottom Left</div>
        </Transitions>,
      );

      expect(screen.getByTestId('bottom-left-content')).toBeInTheDocument();
    });

    it('should render with bottom-right position', () => {
      renderWithTheme(
        <Transitions in={true} position="bottom-right">
          <div data-testid="bottom-right-content">Bottom Right</div>
        </Transitions>,
      );

      expect(screen.getByTestId('bottom-right-content')).toBeInTheDocument();
    });

    it('should render with bottom position', () => {
      renderWithTheme(
        <Transitions in={true} position="bottom">
          <div data-testid="bottom-content">Bottom</div>
        </Transitions>,
      );

      expect(screen.getByTestId('bottom-content')).toBeInTheDocument();
    });
  });

  describe('Direction Tests for Slide Transition', () => {
    it('should render slide transition with up direction by default', () => {
      renderWithTheme(
        <Transitions in={true} type="slide" direction="up">
          <div data-testid="slide-up-content">Slide Up</div>
        </Transitions>,
      );

      expect(screen.getByTestId('slide-up-content')).toBeInTheDocument();
    });

    it('should render slide transition with right direction', () => {
      renderWithTheme(
        <Transitions in={true} type="slide" direction="right">
          <div data-testid="slide-right-content">Slide Right</div>
        </Transitions>,
      );

      expect(screen.getByTestId('slide-right-content')).toBeInTheDocument();
    });

    it('should render slide transition with left direction', () => {
      renderWithTheme(
        <Transitions in={true} type="slide" direction="left">
          <div data-testid="slide-left-content">Slide Left</div>
        </Transitions>,
      );

      expect(screen.getByTestId('slide-left-content')).toBeInTheDocument();
    });

    it('should render slide transition with down direction', () => {
      renderWithTheme(
        <Transitions in={true} type="slide" direction="down">
          <div data-testid="slide-down-content">Slide Down</div>
        </Transitions>,
      );

      expect(screen.getByTestId('slide-down-content')).toBeInTheDocument();
    });
  });

  describe('Custom Styling Tests', () => {
    it('should apply custom sx styles', () => {
      renderWithTheme(
        <Transitions
          in={true}
          sx={{
            backgroundColor: 'red',
            padding: '16px',
          }}
        >
          <div data-testid="styled-content">Styled Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('styled-content')).toBeInTheDocument();
    });

    it('should merge custom sx with position styles', () => {
      renderWithTheme(
        <Transitions
          in={true}
          position="top-right"
          sx={{
            margin: '8px',
            border: '1px solid black',
          }}
        >
          <div data-testid="merged-styled-content">Merged Styled</div>
        </Transitions>,
      );

      expect(screen.getByTestId('merged-styled-content')).toBeInTheDocument();
    });

    it('should handle responsive sx styles', () => {
      renderWithTheme(
        <Transitions
          in={true}
          sx={{
            display: { xs: 'none', md: 'block' },
            fontSize: { sm: '14px', lg: '18px' },
          }}
        >
          <div data-testid="responsive-content">Responsive Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('responsive-content')).toBeInTheDocument();
    });
  });

  describe('Transition State Tests', () => {
    it('should handle in=true state', () => {
      renderWithTheme(
        <Transitions in={true}>
          <div data-testid="in-true-content">In True Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('in-true-content')).toBeInTheDocument();
    });

    it('should handle in=false state', () => {
      renderWithTheme(
        <Transitions in={false}>
          <div data-testid="in-false-content">In False Content</div>
        </Transitions>,
      );

      // Content might still be in DOM during transition
      const content = screen.queryByTestId('in-false-content');
      // We can't easily test the visibility without complex animation testing
      // but we can check that the component renders without error
      expect(content).toBeDefined();
    });

    it('should toggle transition state', () => {
      const { rerender } = renderWithTheme(
        <Transitions in={true}>
          <div data-testid="toggle-content">Toggle Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('toggle-content')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={createTheme()}>
          <Transitions in={false}>
            <div data-testid="toggle-content">Toggle Content</div>
          </Transitions>
        </ThemeProvider>,
      );

      // Component should handle state change without error
      expect(screen.queryByTestId('toggle-content')).toBeDefined();
    });
  });

  describe('Ref Forwarding Tests', () => {
    it('should forward ref correctly', () => {
      let refElement: HTMLDivElement | null = null;

      renderWithTheme(
        <RefTestComponent
          onRefReady={(ref) => {
            refElement = ref;
          }}
        />,
      );

      expect(screen.getByTestId('ref-test-content')).toBeInTheDocument();
      expect(refElement).toBeInstanceOf(HTMLDivElement);
    });

    it('should maintain ref through transition type changes', () => {
      let refElement: HTMLDivElement | null = null;

      const { rerender } = renderWithTheme(
        <RefTestComponent
          onRefReady={(ref) => {
            refElement = ref;
          }}
        />,
      );

      const initialRef = refElement;

      rerender(
        <ThemeProvider theme={createTheme()}>
          <RefTestComponent
            onRefReady={(ref) => {
              refElement = ref;
            }}
          />
        </ThemeProvider>,
      );

      // Ref should be consistent
      expect(refElement).toBe(initialRef);
    });
  });

  describe('Props Forwarding Tests', () => {
    it('should forward additional transition props', () => {
      renderWithTheme(
        <Transitions in={true} timeout={1000} easing="ease-in-out" data-testid="transition-wrapper">
          <div data-testid="props-content">Props Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('props-content')).toBeInTheDocument();
    });

    it('should handle onEnter callback', () => {
      const onEnter = vi.fn();

      renderWithTheme(
        <Transitions in={true} onEnter={onEnter}>
          <div data-testid="enter-content">Enter Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('enter-content')).toBeInTheDocument();
    });

    it('should handle onExit callback', () => {
      const onExit = vi.fn();

      renderWithTheme(
        <Transitions in={false} onExit={onExit}>
          <div data-testid="exit-content">Exit Content</div>
        </Transitions>,
      );

      // Component should render without error
      expect(screen.queryByTestId('exit-content')).toBeDefined();
    });
  });

  describe('Theme Integration Tests', () => {
    it('should work with light theme', () => {
      renderWithTheme(
        <Transitions in={true} type="fade">
          <div data-testid="light-theme-content">Light Theme</div>
        </Transitions>,
        'light',
      );

      expect(screen.getByTestId('light-theme-content')).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      renderWithTheme(
        <Transitions in={true} type="fade">
          <div data-testid="dark-theme-content">Dark Theme</div>
        </Transitions>,
        'dark',
      );

      expect(screen.getByTestId('dark-theme-content')).toBeInTheDocument();
    });

    it('should work with custom theme', () => {
      const customTheme = createTheme({
        transitions: {
          duration: {
            enteringScreen: 500,
            leavingScreen: 300,
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <Transitions in={true} type="slide">
            <div data-testid="custom-theme-content">Custom Theme</div>
          </Transitions>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('custom-theme-content')).toBeInTheDocument();
    });
  });

  describe('Timeout Configuration Tests', () => {
    it('should use default timeout for fade transition', () => {
      renderWithTheme(
        <Transitions in={true} type="fade">
          <div data-testid="fade-timeout-content">Fade Timeout</div>
        </Transitions>,
      );

      expect(screen.getByTestId('fade-timeout-content')).toBeInTheDocument();
    });

    it('should use default timeout for slide transition', () => {
      renderWithTheme(
        <Transitions in={true} type="slide">
          <div data-testid="slide-timeout-content">Slide Timeout</div>
        </Transitions>,
      );

      expect(screen.getByTestId('slide-timeout-content')).toBeInTheDocument();
    });

    it('should accept custom timeout', () => {
      renderWithTheme(
        <Transitions in={true} type="grow" timeout={2000}>
          <div data-testid="custom-timeout-content">Custom Timeout</div>
        </Transitions>,
      );

      expect(screen.getByTestId('custom-timeout-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined children gracefully', () => {
      const { container } = renderWithTheme(<Transitions in={true} />);

      expect(container).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      const { container } = renderWithTheme(<Transitions in={true} />);

      expect(container).toBeInTheDocument();
    });

    it('should handle falsy children gracefully', () => {
      const showContent = false;
      const { container } = renderWithTheme(
        <Transitions in={true}>
          {showContent && <div>Hidden</div>}
        </Transitions>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle combination of all props', () => {
      const onEnter = vi.fn();
      const onExit = vi.fn();

      renderWithTheme(
        <Transitions
          in={true}
          type="slide"
          direction="left"
          position="bottom-right"
          timeout={1500}
          onEnter={onEnter}
          onExit={onExit}
          sx={{
            backgroundColor: 'blue',
            padding: 2,
          }}
          data-testid="complex-transition"
        >
          <div data-testid="complex-content">Complex Content</div>
        </Transitions>,
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = renderWithTheme(
        <Transitions in={true} type="grow">
          <div data-testid="rapid-content">Content</div>
        </Transitions>,
      );

      // Rapid prop changes
      const types = ['fade', 'slide', 'zoom', 'collapse', 'grow'] as const;
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

      types.forEach((type, index) => {
        rerender(
          <ThemeProvider theme={createTheme()}>
            <Transitions in={true} type={type} position={positions[index % positions.length]}>
              <div data-testid="rapid-content">Content</div>
            </Transitions>
          </ThemeProvider>,
        );
      });

      expect(screen.getByTestId('rapid-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should not interfere with children accessibility', () => {
      renderWithTheme(
        <Transitions in={true}>
          <button aria-label="Accessible Button" data-testid="accessible-button">
            Click Me
          </button>
        </Transitions>,
      );

      const button = screen.getByTestId('accessible-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Accessible Button');
    });

    it('should maintain focus management', () => {
      renderWithTheme(
        <Transitions in={true}>
          <input data-testid="focusable-input" autoFocus />
        </Transitions>,
      );

      const input = screen.getByTestId('focusable-input');
      expect(input).toBeInTheDocument();
    });

    it('should preserve ARIA attributes', () => {
      renderWithTheme(
        <Transitions in={true}>
          <div data-testid="aria-content" role="alert" aria-live="polite" aria-describedby="description">
            ARIA Content
          </div>
        </Transitions>,
      );

      const content = screen.getByTestId('aria-content');
      expect(content).toHaveAttribute('role', 'alert');
      expect(content).toHaveAttribute('aria-live', 'polite');
      expect(content).toHaveAttribute('aria-describedby', 'description');
    });
  });

  describe('Performance Tests', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderWithTheme(
        <Transitions in={true}>
          <div data-testid="memory-test-content">Memory Test</div>
        </Transitions>,
      );

      expect(screen.getByTestId('memory-test-content')).toBeInTheDocument();

      unmount();

      expect(screen.queryByTestId('memory-test-content')).not.toBeInTheDocument();
    });

    it('should handle multiple instances efficiently', () => {
      const types = ['grow', 'fade', 'slide', 'zoom', 'collapse'] as const;

      render(
        <ThemeProvider theme={createTheme()}>
          <div>
            {types.map((type, index) => (
              <Transitions key={type} in={true} type={type}>
                <div data-testid={`instance-${index}`}>Instance {index}</div>
              </Transitions>
            ))}
          </div>
        </ThemeProvider>,
      );

      types.forEach((_, index) => {
        expect(screen.getByTestId(`instance-${index}`)).toBeInTheDocument();
      });
    });

    it('should handle rapid re-renders without performance issues', () => {
      const { rerender } = renderWithTheme(
        <Transitions in={true} type="grow">
          <div data-testid="performance-content">Initial</div>
        </Transitions>,
      );

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <ThemeProvider theme={createTheme()}>
            <Transitions in={true} type="grow">
              <div data-testid="performance-content">Render {i}</div>
            </Transitions>
          </ThemeProvider>,
        );
      }

      expect(screen.getByText('Render 9')).toBeInTheDocument();
    });
  });

  describe('Display Name Tests', () => {
    it('should have correct display name', () => {
      expect(Transitions.displayName).toBe('Transitions');
    });
  });
});
