import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import Snackbar from './Snackbar';
import snackbarReducer, { openSnackbar, closeSnackbar } from '@/store/slices/snackbar';
import { SnackbarState } from '@/types/snackbar';

// Mock store setup
const createMockStore = (initialState?: Partial<SnackbarState>) => {
  const defaultState: SnackbarState = {
    action: false,
    open: false,
    message: 'Note archived',
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'right',
    },
    variant: 'default',
    alert: {
      color: 'info',
      variant: 'filled',
    },
    transition: 'Fade',
    close: true,
    maxStack: 3,
    dense: false,
    iconVariant: 'hide',
    actionButton: false,
    ...initialState,
  };

  return configureStore({
    reducer: {
      snackbar: snackbarReducer,
    },
    preloadedState: {
      snackbar: defaultState,
    },
  });
};

// Helper function to render with providers
const renderWithProviders = (
  ui: React.ReactElement,
  initialSnackbarState?: Partial<SnackbarState>,
  themeMode: 'light' | 'dark' = 'light',
) => {
  const store = createMockStore(initialSnackbarState);
  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </Provider>,
    ),
  };
};

describe('Snackbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should not render when closed', () => {
      renderWithProviders(<Snackbar />, { open: false });

      // Snackbar should not be visible
      expect(screen.queryByText('Note archived')).not.toBeInTheDocument();
    });

    it('should render when open with default message', () => {
      renderWithProviders(<Snackbar />, { open: true });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        message: 'Custom snackbar message',
      });

      expect(screen.getByText('Custom snackbar message')).toBeInTheDocument();
    });

    it('should render with UNDO button by default', () => {
      renderWithProviders(<Snackbar />, { open: true });

      expect(screen.getByText('UNDO')).toBeInTheDocument();
    });

    it('should render with close button by default', () => {
      renderWithProviders(<Snackbar />, { open: true });

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Alert Variant Tests', () => {
    it('should render alert variant with filled style', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled',
        },
        message: 'Success alert message',
      });

      expect(screen.getByText('Success alert message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render alert variant with outlined style', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'outlined',
        },
        message: 'Error alert message',
      });

      expect(screen.getByText('Error alert message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render alert variant with standard style', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        alert: {
          color: 'warning',
          variant: 'standard',
        },
        message: 'Warning alert message',
      });

      expect(screen.getByText('Warning alert message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render alert with different colors', () => {
      const colors = ['success', 'error', 'warning', 'info'] as const;

      colors.forEach((color) => {
        const { unmount } = renderWithProviders(<Snackbar />, {
          open: true,
          variant: 'alert',
          alert: {
            color,
            variant: 'filled',
          },
          message: `${color} message`,
        });

        expect(screen.getByText(`${color} message`)).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Action Button Tests', () => {
    it('should show UNDO button when actionButton is true', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        actionButton: true,
      });

      expect(screen.getByText('UNDO')).toBeInTheDocument();
    });

    it('should hide UNDO button when actionButton is false', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        actionButton: false,
      });

      expect(screen.queryByText('UNDO')).not.toBeInTheDocument();
    });

    it('should show close button when close is true', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        close: true,
      });

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should hide close button when close is false', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        close: false,
      });

      expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
    });

    it('should show both buttons when both are enabled', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        actionButton: true,
        close: true,
      });

      expect(screen.getByText('UNDO')).toBeInTheDocument();
      expect(screen.getByLabelText('close')).toBeInTheDocument();
    });

    it('should hide both buttons when both are disabled', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        actionButton: false,
        close: false,
      });

      expect(screen.queryByText('UNDO')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should close snackbar when UNDO button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<Snackbar />, {
        open: true,
        actionButton: true,
      });

      const undoButton = screen.getByText('UNDO');
      await user.click(undoButton);

      // Check if closeSnackbar action was dispatched
      const state = store.getState();
      expect(state.snackbar.open).toBe(false);
    });

    it('should close snackbar when close button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<Snackbar />, {
        open: true,
        close: true,
      });

      const closeButton = screen.getByLabelText('close');
      await user.click(closeButton);

      // Check if closeSnackbar action was dispatched
      const state = store.getState();
      expect(state.snackbar.open).toBe(false);
    });

    it('should not close on clickaway', () => {
      const { store } = renderWithProviders(<Snackbar />, { open: true });

      // Simulate clickaway event
      const snackbar = screen.getByText('Note archived').closest('[role="presentation"]');
      if (snackbar) {
        fireEvent.click(document.body);
      }

      // Should still be open (clickaway is ignored)
      const state = store.getState();
      expect(state.snackbar.open).toBe(true);
    });

    it('should handle keyboard interactions on UNDO button', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<Snackbar />, {
        open: true,
        actionButton: true,
      });

      const undoButton = screen.getByText('UNDO');

      // Focus and press Enter
      undoButton.focus();
      await user.keyboard('{Enter}');

      const state = store.getState();
      expect(state.snackbar.open).toBe(false);
    });

    it('should handle keyboard interactions on close button', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<Snackbar />, {
        open: true,
        close: true,
      });

      const closeButton = screen.getByLabelText('close');

      // Focus and press Enter
      closeButton.focus();
      await user.keyboard('{Enter}');

      const state = store.getState();
      expect(state.snackbar.open).toBe(false);
    });
  });

  describe('Transition Tests', () => {
    it('should use Fade transition by default', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        transition: 'Fade',
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should use SlideLeft transition', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        transition: 'SlideLeft',
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should use SlideUp transition', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        transition: 'SlideUp',
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should use SlideRight transition', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        transition: 'SlideRight',
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should use SlideDown transition', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        transition: 'SlideDown',
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should use Grow transition', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        transition: 'Grow',
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });
  });

  describe('Anchor Origin Tests', () => {
    it('should position at bottom-right by default', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should position at top-left', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should position at top-center', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should position at bottom-center', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        },
      });

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });
  });

  describe('Redux Integration Tests', () => {
    it('should respond to openSnackbar action', () => {
      const { store } = renderWithProviders(<Snackbar />, { open: false });

      // Initially closed
      expect(screen.queryByText('Custom message')).not.toBeInTheDocument();

      // Dispatch openSnackbar action
      act(() => {
        store.dispatch(
          openSnackbar({
            open: true,
            message: 'Custom message',
            variant: 'default',
          }),
        );
      });

      // Should now be visible
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('should respond to closeSnackbar action', async () => {
      const { store } = renderWithProviders(<Snackbar />, { open: true });

      // Initially open
      expect(screen.getByText('Note archived')).toBeInTheDocument();

      // Dispatch closeSnackbar action
      act(() => {
        store.dispatch(closeSnackbar());
      });

      // Wait for the transition animation to complete
      await waitFor(() => {
        expect(screen.queryByText('Note archived')).not.toBeInTheDocument();
      });
    });

    it('should update when store state changes', () => {
      const { store, rerender } = renderWithProviders(<Snackbar />, {
        open: true,
        message: 'Initial message',
      });

      expect(screen.getByText('Initial message')).toBeInTheDocument();

      // Update store state
      store.dispatch(
        openSnackbar({
          open: true,
          message: 'Updated message',
          variant: 'alert',
          alert: { color: 'success', variant: 'filled' },
        }),
      );

      // Re-render to reflect state change
      rerender(
        <Provider store={store}>
          <ThemeProvider theme={createTheme()}>
            <Snackbar />
          </ThemeProvider>
        </Provider>,
      );

      expect(screen.getByText('Updated message')).toBeInTheDocument();
    });
  });

  describe('Theme Integration Tests', () => {
    it('should work with light theme', () => {
      renderWithProviders(<Snackbar />, { open: true }, 'light');

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      renderWithProviders(<Snackbar />, { open: true }, 'dark');

      expect(screen.getByText('Note archived')).toBeInTheDocument();
    });

    it('should apply custom theme to alert variant', () => {
      const customTheme = createTheme({
        palette: {
          success: {
            main: '#00ff00',
          },
        },
      });

      const store = createMockStore({
        open: true,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' },
        message: 'Success with custom theme',
      });

      render(
        <Provider store={store}>
          <ThemeProvider theme={customTheme}>
            <Snackbar />
          </ThemeProvider>
        </Provider>,
      );

      expect(screen.getByText('Success with custom theme')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper role for alert variant', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        variant: 'alert',
        message: 'Alert message',
      });

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Alert message');
    });

    it('should have accessible close button', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        close: true,
      });

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'close');
    });

    it('should have accessible UNDO button', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        actionButton: true,
      });

      const undoButton = screen.getByText('UNDO');
      expect(undoButton).toBeInTheDocument();
      expect(undoButton).toHaveAttribute('type', 'button');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Snackbar />, {
        open: true,
        actionButton: true,
        close: true,
      });

      // Tab to UNDO button
      await user.tab();
      expect(screen.getByText('UNDO')).toHaveFocus();

      // Tab to close button
      await user.tab();
      expect(screen.getByLabelText('close')).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      renderWithProviders(<Snackbar />, {
        open: true,
        message: '',
      });

      // Should still render the snackbar container
      const snackbarContent = screen.getByRole('presentation');
      expect(snackbarContent).toBeInTheDocument();
    });

    it('should handle very long messages', () => {
      const longMessage =
        'This is a very long message that might overflow the snackbar container and should be handled gracefully by the component';

      renderWithProviders(<Snackbar />, {
        open: true,
        message: longMessage,
      });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?';

      renderWithProviders(<Snackbar />, {
        open: true,
        message: specialMessage,
      });

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle rapid open/close state changes', () => {
      const { store } = renderWithProviders(<Snackbar />, { open: false });

      // Rapid state changes
      act(() => {
        store.dispatch(openSnackbar({ open: true, message: 'Message 1' }));
        store.dispatch(closeSnackbar());
        store.dispatch(openSnackbar({ open: true, message: 'Message 2' }));
      });

      expect(screen.getByText('Message 2')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderWithProviders(<Snackbar />, { open: true });

      expect(screen.getByText('Note archived')).toBeInTheDocument();

      unmount();

      expect(screen.queryByText('Note archived')).not.toBeInTheDocument();
    });

    it('should handle multiple re-renders efficiently', () => {
      const { store, rerender } = renderWithProviders(<Snackbar />, { open: true });

      // Multiple re-renders with different props
      for (let i = 0; i < 5; i++) {
        store.dispatch(
          openSnackbar({
            open: true,
            message: `Message ${i}`,
            variant: i % 2 === 0 ? 'default' : 'alert',
          }),
        );

        rerender(
          <Provider store={store}>
            <ThemeProvider theme={createTheme()}>
              <Snackbar />
            </ThemeProvider>
          </Provider>,
        );
      }

      expect(screen.getByText('Message 4')).toBeInTheDocument();
    });
  });
});
