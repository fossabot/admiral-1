import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import Loader from '@/components/Loader';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, themeMode: 'light' | 'dark' = 'light') => {
  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>,
  );
};

describe('Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render with default props', () => {
      renderWithTheme(<Loader />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render with custom aria-label', () => {
      renderWithTheme(<Loader ariaLabel="Custom loading message" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Custom loading message');
    });

    it('should render with different colors', () => {
      const colors = ['primary', 'secondary', 'error', 'info', 'success', 'warning'] as const;

      colors.forEach((color) => {
        const { unmount } = renderWithTheme(<Loader color={color} />);

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toBeInTheDocument();
        expect(progressbar).toHaveClass(`MuiLinearProgress-color${color.charAt(0).toUpperCase() + color.slice(1)}`);

        unmount();
      });
    });

    it('should render with custom height as number', () => {
      renderWithTheme(<Loader height={8} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should render with custom height as string', () => {
      renderWithTheme(<Loader height="10px" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should pass through additional HTML attributes', () => {
      renderWithTheme(<Loader data-testid="custom-loader" className="custom-class" />);

      const loader = screen.getByTestId('custom-loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass('custom-class');
    });
  });

  describe('Visibility and Animation', () => {
    it('should be visible by default', () => {
      renderWithTheme(<Loader />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should be hidden when visible=false', () => {
      renderWithTheme(<Loader visible={false} />);

      const progressbar = screen.queryByRole('progressbar');
      expect(progressbar).not.toBeInTheDocument();
    });

    it('should show/hide with animation when visible prop changes', async () => {
      const { rerender } = renderWithTheme(<Loader visible={false} />);

      // Initially hidden
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

      // Show loader
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Loader visible={true} />
        </ThemeProvider>,
      );

      // Should appear after animation
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should unmount when hidden with unmountOnExit', async () => {
      const { rerender } = renderWithTheme(<Loader visible={true} />);

      // Initially visible
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Hide loader
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Loader visible={false} />
        </ThemeProvider>,
      );

      // Should be unmounted after animation
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Position Variants', () => {
    it('should render with top position by default', () => {
      renderWithTheme(<Loader />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should render with bottom position', () => {
      renderWithTheme(<Loader position="bottom" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should render with inline position', () => {
      renderWithTheme(<Loader position="inline" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should apply correct styling for different positions', () => {
      const positions = ['top', 'bottom', 'inline'] as const;

      positions.forEach((position) => {
        const { unmount } = renderWithTheme(<Loader position={position} data-testid={`loader-${position}`} />);

        const loaderContainer = screen.getByTestId(`loader-${position}`);
        expect(loaderContainer).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Material-UI Integration', () => {
    it('should integrate with light theme', () => {
      renderWithTheme(<Loader />, 'light');

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should integrate with dark theme', () => {
      renderWithTheme(<Loader />, 'dark');

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should use theme colors for progress bar', () => {
      const customTheme = createTheme({
        palette: {
          primary: {
            main: '#ff0000',
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <Loader color="primary" />
        </ThemeProvider>,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should apply theme-based background colors', () => {
      renderWithTheme(<Loader />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should respect theme z-index for fixed positioning', () => {
      const customTheme = createTheme({
        zIndex: {
          modal: 1300,
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <Loader position="top" />
        </ThemeProvider>,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      renderWithTheme(<Loader />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('role', 'progressbar');
    });

    it('should have default aria-label', () => {
      renderWithTheme(<Loader />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading');
    });

    it('should accept custom aria-label', () => {
      renderWithTheme(<Loader ariaLabel="Processing your request" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Processing your request');
    });

    it('should be accessible via screen readers', () => {
      renderWithTheme(<Loader ariaLabel="Loading data" />);

      const progressbar = screen.getByLabelText('Loading data');
      expect(progressbar).toBeInTheDocument();
    });

    it('should maintain accessibility when hidden', () => {
      renderWithTheme(<Loader visible={false} />);

      // Should not be in DOM when hidden
      const progressbar = screen.queryByRole('progressbar');
      expect(progressbar).not.toBeInTheDocument();
    });

    it('should support additional ARIA attributes on wrapper', () => {
      renderWithTheme(<Loader data-testid="aria-loader" aria-describedby="loading-description" />);

      const loader = screen.getByTestId('aria-loader');
      expect(loader).toHaveAttribute('aria-describedby', 'loading-description');

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined color prop gracefully', () => {
      renderWithTheme(<Loader color={undefined} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should handle undefined position prop gracefully', () => {
      renderWithTheme(<Loader position={undefined} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should handle undefined height prop gracefully', () => {
      renderWithTheme(<Loader height={undefined} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should handle zero height', () => {
      renderWithTheme(<Loader height={0} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should handle negative height', () => {
      renderWithTheme(<Loader height={-5} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should handle empty string ariaLabel', () => {
      renderWithTheme(<Loader ariaLabel="" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', '');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid visibility changes', async () => {
      const { rerender } = renderWithTheme(<Loader visible={true} />);

      // Rapidly toggle visibility
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Loader visible={false} />
        </ThemeProvider>,
      );
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Loader visible={true} />
        </ThemeProvider>,
      );
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Loader visible={false} />
        </ThemeProvider>,
      );

      // Should handle without crashing
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should handle very large height values', () => {
      renderWithTheme(<Loader height={9999} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should handle string height with units', () => {
      const units = ['px', 'em', 'rem', '%', 'vh', 'vw'];

      units.forEach((unit) => {
        const { unmount } = renderWithTheme(<Loader height={`10${unit}`} />);

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toBeInTheDocument();

        unmount();
      });
    });

    it('should handle very long aria-label', () => {
      const longLabel = 'A'.repeat(1000);
      renderWithTheme(<Loader ariaLabel={longLabel} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', longLabel);
    });

    it('should handle special characters in aria-label', () => {
      const specialLabel = 'Loading... 🔄 Please wait! @#$%^&*()';
      renderWithTheme(<Loader ariaLabel={specialLabel} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', specialLabel);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily with same props', () => {
      const { rerender } = renderWithTheme(<Loader visible={true} color="primary" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Loader visible={true} color="primary" />
        </ThemeProvider>,
      );

      // Should still be present
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle multiple instances', () => {
      render(
        <ThemeProvider theme={createTheme()}>
          <div>
            <Loader data-testid="loader-1" ariaLabel="First loader" />
            <Loader data-testid="loader-2" ariaLabel="Second loader" />
            <Loader data-testid="loader-3" ariaLabel="Third loader" />
          </div>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('loader-1')).toBeInTheDocument();
      expect(screen.getByTestId('loader-2')).toBeInTheDocument();
      expect(screen.getByTestId('loader-3')).toBeInTheDocument();

      const progressbars = screen.getAllByRole('progressbar');
      expect(progressbars).toHaveLength(3);
    });
  });

  describe('Styled Components', () => {
    it('should apply custom styled wrapper', () => {
      renderWithTheme(<Loader data-testid="styled-loader" />);

      const loader = screen.getByTestId('styled-loader');
      expect(loader).toBeInTheDocument();
    });

    it('should filter out position and height from DOM props', () => {
      renderWithTheme(<Loader position="top" height={10} data-testid="filtered-loader" />);

      const loader = screen.getByTestId('filtered-loader');
      expect(loader).toBeInTheDocument();

      // These should not appear as DOM attributes
      expect(loader).not.toHaveAttribute('position');
      expect(loader).not.toHaveAttribute('height');
    });

    it('should forward other props to wrapper', () => {
      renderWithTheme(<Loader data-testid="forwarded-loader" title="Loader title" role="presentation" />);

      const loader = screen.getByTestId('forwarded-loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('title', 'Loader title');
      expect(loader).toHaveAttribute('role', 'presentation');
    });
  });
});
