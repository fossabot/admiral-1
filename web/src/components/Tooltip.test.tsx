import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Tooltip from '@/components/Tooltip';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, themeMode: 'light' | 'dark' = 'light') => {
  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render child element', () => {
      renderWithTheme(
        <Tooltip title="Test tooltip">
          <button data-testid="trigger">Hover me</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Hover me');
    });

    it('should render with string title', () => {
      renderWithTheme(
        <Tooltip title="Simple tooltip text">
          <span data-testid="trigger">Trigger</span>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should render with ReactNode title', () => {
      const complexTitle = (
        <div>
          <strong>Bold text</strong>
          <br />
          <em>Italic text</em>
        </div>
      );

      renderWithTheme(
        <Tooltip title={complexTitle}>
          <button data-testid="trigger">Complex tooltip</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should not render tooltip content initially', () => {
      renderWithTheme(
        <Tooltip title="Hidden tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      expect(screen.queryByText('Hidden tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Hide Prop Tests', () => {
    it('should render only child when hide=true', () => {
      renderWithTheme(
        <Tooltip title="Should not show" hide={true}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should not show tooltip when hide=true even on hover', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Should not show" hide={true}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
      });
    });

    it('should show tooltip when hide=false', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Should show" hide={false}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Should show')).toBeInTheDocument();
      });
    });

    it('should default to hide=false', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Default behavior">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Default behavior')).toBeInTheDocument();
      });
    });
  });

  describe('Controlled Mode Tests', () => {
    it('should work in controlled mode', () => {
      const onOpenChange = vi.fn();

      renderWithTheme(
        <Tooltip title="Controlled tooltip" controlled={{ open: true, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByText('Controlled tooltip')).toBeInTheDocument();
    });

    it('should call onOpenChange when opened in controlled mode', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      renderWithTheme(
        <Tooltip title="Controlled tooltip" controlled={{ open: false, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });
    });

    it('should call onOpenChange when closed in controlled mode', async () => {
      const onOpenChange = vi.fn();

      renderWithTheme(
        <Tooltip title="Controlled tooltip" controlled={{ open: true, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseLeave(trigger);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should not show tooltip when controlled open=false', () => {
      const onOpenChange = vi.fn();

      renderWithTheme(
        <Tooltip title="Should not show" controlled={{ open: false, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    });

    it('should update controlled state correctly', () => {
      const onOpenChange = vi.fn();

      const { rerender } = renderWithTheme(
        <Tooltip title="Controlled tooltip" controlled={{ open: false, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      expect(screen.queryByText('Controlled tooltip')).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={createTheme()}>
          <Tooltip title="Controlled tooltip" controlled={{ open: true, onOpenChange }}>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>
        </ThemeProvider>,
      );

      expect(screen.getByText('Controlled tooltip')).toBeInTheDocument();
    });
  });

  describe('Uncontrolled Mode Tests', () => {
    it('should work in uncontrolled mode', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Uncontrolled tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');

      // Initially hidden
      expect(screen.queryByText('Uncontrolled tooltip')).not.toBeInTheDocument();

      // Show on hover
      await user.hover(trigger);
      await waitFor(() => {
        expect(screen.getByText('Uncontrolled tooltip')).toBeInTheDocument();
      });

      // Hide on unhover
      await user.unhover(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Uncontrolled tooltip')).not.toBeInTheDocument();
      });
    });

    it('should show tooltip on mouse enter', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Mouse enter tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Mouse enter tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Mouse leave tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.hover(trigger);
      await waitFor(() => {
        expect(screen.getByText('Mouse leave tooltip')).toBeInTheDocument();
      });

      await user.unhover(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Mouse leave tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Event Handling Tests', () => {
    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Keyboard tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.tab();
      expect(trigger).toHaveFocus();

      await waitFor(() => {
        expect(screen.getByText('Keyboard tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Material-UI Integration Tests', () => {
    it('should integrate with light theme', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Light theme tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
        'light',
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Light theme tooltip')).toBeInTheDocument();
      });
    });

    it('should integrate with dark theme', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Dark theme tooltip">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
        'dark',
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Dark theme tooltip')).toBeInTheDocument();
      });
    });

    it('should accept MUI Tooltip props', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Positioned tooltip" placement="bottom" arrow>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Positioned tooltip')).toBeInTheDocument();
      });
    });

    it('should work with different placements', async () => {
      const user = userEvent.setup();
      const placements = ['top', 'bottom', 'left', 'right'] as const;

      for (const placement of placements) {
        const { unmount } = renderWithTheme(
          <Tooltip title={`${placement} tooltip`} placement={placement}>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>,
        );

        const trigger = screen.getByTestId('trigger');
        await user.hover(trigger);

        await waitFor(() => {
          expect(screen.getByText(`${placement} tooltip`)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Memoization Tests', () => {
    it('should memoize component properly', () => {
      const onOpenChange = vi.fn();

      const { rerender } = renderWithTheme(
        <Tooltip title="Memo test" controlled={{ open: false, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Tooltip title="Memo test" controlled={{ open: false, onOpenChange }}>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('should handle memo with different children', () => {
      renderWithTheme(
        <Tooltip title="Different children">
          <div data-testid="div-child">Div child</div>
        </Tooltip>,
      );

      expect(screen.getByTestId('div-child')).toBeInTheDocument();
    });
  });

  describe('Callback Tests', () => {
    it('should update callbacks when dependencies change', () => {
      const onOpenChange1 = vi.fn();
      const onOpenChange2 = vi.fn();

      const { rerender } = renderWithTheme(
        <Tooltip title="Dependency test" controlled={{ open: false, onOpenChange: onOpenChange1 }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      // Change the callback
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Tooltip title="Dependency test" controlled={{ open: false, onOpenChange: onOpenChange2 }}>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });
  });

  describe('Props Validation Tests', () => {
    it('should handle missing title gracefully', () => {
      expect(() => {
        renderWithTheme(
          // @ts-expect-error - Testing runtime behavior with missing required prop
          <Tooltip>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>,
        );
      }).not.toThrow();
    });

    it('should handle empty string title', () => {
      renderWithTheme(
        <Tooltip title="">
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should handle undefined controlled prop', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <Tooltip title="Undefined controlled" controlled={undefined}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Undefined controlled')).toBeInTheDocument();
      });
    });

    it('should handle invalid children', () => {
      expect(() => {
        renderWithTheme(
          <Tooltip title="Invalid children">
            <button data-testid="trigger">Valid child</button>
          </Tooltip>,
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle controlled mode interactions', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      renderWithTheme(
        <Tooltip title="Controlled events" controlled={{ open: false, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');

      // Test hover interaction
      await user.hover(trigger);
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('should handle controlled state changes during animation', () => {
      const onOpenChange = vi.fn();

      const { rerender } = renderWithTheme(
        <Tooltip title="Animation test" controlled={{ open: false, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      // Rapidly change controlled state
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Tooltip title="Animation test" controlled={{ open: true, onOpenChange }}>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>
        </ThemeProvider>,
      );

      rerender(
        <ThemeProvider theme={createTheme()}>
          <Tooltip title="Animation test" controlled={{ open: false, onOpenChange }}>
            <button data-testid="trigger">Trigger</button>
          </Tooltip>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('should handle complex ReactNode titles', async () => {
      const user = userEvent.setup();

      const complexTitle = (
        <div>
          <h4>Complex Title</h4>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <p>Description text</p>
        </div>
      );

      renderWithTheme(
        <Tooltip title={complexTitle}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Complex Title')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Description text')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple tooltip instances', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <div>
          <Tooltip title="Tooltip 1">
            <button data-testid="trigger-1">Button 1</button>
          </Tooltip>
          <Tooltip title="Tooltip 2">
            <button data-testid="trigger-2">Button 2</button>
          </Tooltip>
          <Tooltip title="Tooltip 3">
            <button data-testid="trigger-3">Button 3</button>
          </Tooltip>
        </div>,
      );

      const triggers = [
        screen.getByTestId('trigger-1'),
        screen.getByTestId('trigger-2'),
        screen.getByTestId('trigger-3'),
      ];

      for (const trigger of triggers) {
        expect(trigger).toBeInTheDocument();
      }

      // Test hovering multiple tooltips
      await user.hover(triggers[0]);
      await waitFor(() => {
        expect(screen.getByText('Tooltip 1')).toBeInTheDocument();
      });

      await user.hover(triggers[1]);
      await waitFor(() => {
        expect(screen.getByText('Tooltip 2')).toBeInTheDocument();
      });
    });

    it('should not cause memory leaks on unmount', () => {
      const onOpenChange = vi.fn();

      const { unmount } = renderWithTheme(
        <Tooltip title="Memory test" controlled={{ open: true, onOpenChange }}>
          <button data-testid="trigger">Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByText('Memory test')).toBeInTheDocument();

      unmount();

      // Should clean up without errors
      expect(screen.queryByText('Memory test')).not.toBeInTheDocument();
    });
  });
});
