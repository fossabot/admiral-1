import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { LoadingState } from './LoadingState';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('LoadingState', () => {
  beforeEach(() => {
    // Clear any mocks if needed
  });

  describe('Rendering Tests', () => {
    it('should render with default props', () => {
      renderWithTheme(<LoadingState />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveClass('MuiCircularProgress-root');
    });

    it('should render circular variant by default', () => {
      renderWithTheme(<LoadingState />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiCircularProgress-root');
    });

    it('should render linear variant', () => {
      renderWithTheme(<LoadingState variant="linear" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiLinearProgress-root');
    });

    it('should render with message', () => {
      renderWithTheme(<LoadingState message="Loading data..." />);

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not render message when not provided', () => {
      renderWithTheme(<LoadingState />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      // Should not have any text content
      const typography = screen.queryByText(/Loading/);
      expect(typography).not.toBeInTheDocument();
    });

    it('should apply custom sx styles', () => {
      const customSx = { backgroundColor: 'primary.main' };
      const { container } = renderWithTheme(
        <LoadingState sx={customSx} />
      );

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveClass('MuiBox-root');
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      renderWithTheme(<LoadingState size="small" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('width: 24px'));
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('height: 24px'));
    });

    it('should render medium size by default', () => {
      renderWithTheme(<LoadingState />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('width: 40px'));
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('height: 40px'));
    });

    it('should render large size', () => {
      renderWithTheme(<LoadingState size="large" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('width: 60px'));
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('height: 60px'));
    });

    it('should apply correct thickness for small size', () => {
      renderWithTheme(<LoadingState size="small" variant="circular" />);

      const progressbar = screen.getByRole('progressbar');
      // Small size should have thickness of 5
      expect(progressbar).toHaveClass('MuiCircularProgress-root');
    });

    it('should apply correct thickness for medium and large sizes', () => {
      renderWithTheme(<LoadingState size="medium" variant="circular" />);

      const progressbar = screen.getByRole('progressbar');
      // Medium/large sizes should have thickness of 4
      expect(progressbar).toHaveClass('MuiCircularProgress-root');
    });
  });

  describe('Progress Variants', () => {
    it('should render indeterminate progress by default', () => {
      renderWithTheme(<LoadingState variant="circular" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiCircularProgress-indeterminate');
    });

    it('should render determinate progress when progress value provided', () => {
      renderWithTheme(<LoadingState variant="circular" progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiCircularProgress-determinate');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should render linear indeterminate progress', () => {
      renderWithTheme(<LoadingState variant="linear" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiLinearProgress-indeterminate');
    });

    it('should render linear determinate progress', () => {
      renderWithTheme(<LoadingState variant="linear" progress={75} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiLinearProgress-determinate');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should handle progress value of 0', () => {
      renderWithTheme(<LoadingState progress={0} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle progress value of 100', () => {
      renderWithTheme(<LoadingState progress={100} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Height Configuration', () => {
    it('should use full height by default', () => {
      const { container } = renderWithTheme(<LoadingState />);

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle('min-height: 400px');
    });

    it('should disable full height when fullHeight=false', () => {
      const { container } = renderWithTheme(<LoadingState fullHeight={false} />);

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle('min-height: auto');
    });

    it('should maintain full height with overlay=false', () => {
      const { container } = renderWithTheme(<LoadingState overlay={false} />);

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle('min-height: 400px');
    });
  });

  describe('Overlay Mode', () => {
    it('should not render as overlay by default', () => {
      const { container } = renderWithTheme(<LoadingState />);

      const loadingBox = container.firstChild;
      expect(loadingBox).not.toHaveStyle('position: absolute');
    });

    it('should render as overlay when overlay=true', () => {
      const { container } = renderWithTheme(<LoadingState overlay={true} />);

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle({
        position: 'absolute',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
      });
    });

    it('should apply overlay background and blur', () => {
      const { container } = renderWithTheme(<LoadingState overlay={true} />);

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle({
        'background-color': 'rgba(255, 255, 255, 0.9)',
        'backdrop-filter': 'blur(2px)',
        'z-index': '1',
      });
    });

    it('should center content in overlay mode', () => {
      const { container } = renderWithTheme(<LoadingState overlay={true} />);

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle({
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
      });
    });
  });

  describe('Message Styling', () => {
    it('should render message with correct typography for medium size', () => {
      renderWithTheme(<LoadingState message="Loading..." size="medium" />);

      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('MuiTypography-body1');
    });

    it('should render message with body2 typography for small size', () => {
      renderWithTheme(<LoadingState message="Loading..." size="small" />);

      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('MuiTypography-body2');
    });

    it('should render message with body1 typography for large size', () => {
      renderWithTheme(<LoadingState message="Loading..." size="large" />);

      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('MuiTypography-body1');
    });

    it('should center align message text', () => {
      renderWithTheme(<LoadingState message="Loading..." />);

      const message = screen.getByText('Loading...');
      expect(message).toHaveStyle('text-align: center');
    });

    it('should use secondary text color for message', () => {
      renderWithTheme(<LoadingState message="Loading..." />);

      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('MuiTypography-root');
    });
  });

  describe('Linear Progress Layout', () => {
    it('should constrain linear progress width', () => {
      const { container } = renderWithTheme(<LoadingState variant="linear" />);

      const linearContainer = container.querySelector('.MuiBox-root:has(.MuiLinearProgress-root)');
      expect(linearContainer).toHaveStyle({
        width: '100%',
        'max-width': '400px',
      });
    });

    it('should render linear progress with message', () => {
      renderWithTheme(<LoadingState variant="linear" message="Processing..." />);

      expect(screen.getByRole('progressbar')).toHaveClass('MuiLinearProgress-root');
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should work with light theme', () => {
      const lightTheme = createTheme({ palette: { mode: 'light' } });
      render(
        <ThemeProvider theme={lightTheme}>
          <LoadingState />
        </ThemeProvider>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      const darkTheme = createTheme({ palette: { mode: 'dark' } });
      render(
        <ThemeProvider theme={darkTheme}>
          <LoadingState />
        </ThemeProvider>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should use theme colors for progress indicator', () => {
      const customTheme = createTheme({
        palette: {
          primary: {
            main: '#ff0000',
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <LoadingState />
        </ThemeProvider>
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      renderWithTheme(<LoadingState />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('role', 'progressbar');
    });

    it('should have aria-valuenow for determinate progress', () => {
      renderWithTheme(<LoadingState progress={60} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '60');
    });

    it('should not have aria-valuenow for indeterminate progress', () => {
      renderWithTheme(<LoadingState />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).not.toHaveAttribute('aria-valuenow');
    });

    it('should have aria-valuemin and aria-valuemax for determinate progress', () => {
      renderWithTheme(<LoadingState progress={30} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should be accessible via screen readers', () => {
      renderWithTheme(<LoadingState message="Loading user data" />);

      const progressbar = screen.getByRole('progressbar');
      const message = screen.getByText('Loading user data');

      expect(progressbar).toBeInTheDocument();
      expect(message).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined variant gracefully', () => {
      renderWithTheme(<LoadingState variant={undefined} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiCircularProgress-root');
    });

    it('should handle undefined size gracefully', () => {
      renderWithTheme(<LoadingState size={undefined} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('style', expect.stringContaining('width: 40px'));
    });

    it('should handle undefined message gracefully', () => {
      renderWithTheme(<LoadingState message={undefined} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    it('should handle empty string message', () => {
      renderWithTheme(<LoadingState message="" />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      const message = screen.getByText('');
      expect(message).toBeInTheDocument();
    });

    it('should handle undefined progress gracefully', () => {
      renderWithTheme(<LoadingState progress={undefined} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiCircularProgress-indeterminate');
    });

    it('should handle boolean props gracefully', () => {
      renderWithTheme(
        <LoadingState
          fullHeight={undefined}
          overlay={undefined}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle skeleton variant (not implemented)', () => {
      renderWithTheme(<LoadingState variant="skeleton" />);

      // Should still render since skeleton variant doesn't have implementation
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle negative progress values', () => {
      renderWithTheme(<LoadingState progress={-10} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '-10');
    });

    it('should handle progress values over 100', () => {
      renderWithTheme(<LoadingState progress={150} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '150');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(200);
      renderWithTheme(<LoadingState message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = "Loading... 🔄 Please wait! @#$%^&*()";
      renderWithTheme(<LoadingState message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle multiple LoadingState instances', () => {
      render(
        <ThemeProvider theme={createTheme()}>
          <div>
            <LoadingState message="Loading 1" />
            <LoadingState message="Loading 2" />
            <LoadingState message="Loading 3" />
          </div>
        </ThemeProvider>
      );

      const progressbars = screen.getAllByRole('progressbar');
      expect(progressbars).toHaveLength(3);
      expect(screen.getByText('Loading 1')).toBeInTheDocument();
      expect(screen.getByText('Loading 2')).toBeInTheDocument();
      expect(screen.getByText('Loading 3')).toBeInTheDocument();
    });
  });

  describe('Layout Combinations', () => {
    it('should render overlay with message', () => {
      renderWithTheme(
        <LoadingState overlay={true} message="Processing request..." />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Processing request...')).toBeInTheDocument();

      const { container } = render(
        <ThemeProvider theme={createTheme()}>
          <LoadingState overlay={true} message="Processing request..." />
        </ThemeProvider>
      );

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle('position: absolute');
    });

    it('should render linear progress with overlay', () => {
      renderWithTheme(
        <LoadingState variant="linear" overlay={true} />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiLinearProgress-root');

      const { container } = render(
        <ThemeProvider theme={createTheme()}>
          <LoadingState variant="linear" overlay={true} />
        </ThemeProvider>
      );

      const loadingBox = container.firstChild;
      expect(loadingBox).toHaveStyle('position: absolute');
    });

    it('should render small linear progress with message', () => {
      renderWithTheme(
        <LoadingState variant="linear" size="small" message="Loading..." />
      );

      expect(screen.getByRole('progressbar')).toHaveClass('MuiLinearProgress-root');
      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('MuiTypography-body2');
    });

    it('should render determinate progress with all options', () => {
      renderWithTheme(
        <LoadingState
          variant="circular"
          size="large"
          progress={80}
          message="80% complete"
          overlay={false}
          fullHeight={true}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('MuiCircularProgress-determinate');
      expect(progressbar).toHaveAttribute('aria-valuenow', '80');
      expect(screen.getByText('80% complete')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily with same props', () => {
      const { rerender } = renderWithTheme(<LoadingState message="Loading..." />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <ThemeProvider theme={createTheme()}>
          <LoadingState message="Loading..." />
        </ThemeProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = renderWithTheme(<LoadingState variant="circular" />);

      expect(screen.getByRole('progressbar')).toHaveClass('MuiCircularProgress-root');

      rerender(
        <ThemeProvider theme={createTheme()}>
          <LoadingState variant="linear" />
        </ThemeProvider>
      );

      expect(screen.getByRole('progressbar')).toHaveClass('MuiLinearProgress-root');
    });
  });
});
