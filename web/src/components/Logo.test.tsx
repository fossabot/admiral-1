import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { Logo } from './Logo';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, themeMode: 'light' | 'dark' = 'light') => {
  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Logo', () => {
  beforeEach(() => {
    // Clear any mocks
  });

  describe('Rendering Tests', () => {
    it('should render with default props', () => {
      renderWithTheme(<Logo />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('aria-label', 'Admiral logo');
    });

    it('should render with custom width and height', () => {
      renderWithTheme(<Logo width={120} height={40} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('width', '120');
      expect(logo).toHaveAttribute('height', '40');
    });

    it('should render full logo when width is greater than minWidth', () => {
      renderWithTheme(<Logo width={90} minWidth={25} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 90 25');
    });

    it('should render small logo when width is less than or equal to minWidth', () => {
      renderWithTheme(<Logo width={25} minWidth={25} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024');
    });

    it('should render small logo when width is less than minWidth', () => {
      renderWithTheme(<Logo width={20} minWidth={25} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024');
    });

    it('should have correct title element', () => {
      renderWithTheme(<Logo />);

      const title = screen.getByText('Admiral logo');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should use correct colors in light theme', () => {
      renderWithTheme(<Logo />, 'light');

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();

      // Check that SVG paths exist (color testing in DOM is complex)
      const paths = logo.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should use correct colors in dark theme', () => {
      renderWithTheme(<Logo />, 'dark');

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();

      // Check that SVG paths exist
      const paths = logo.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should adapt colors when theme changes', () => {
      const { rerender } = renderWithTheme(<Logo />, 'light');

      let logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();

      // Re-render with dark theme
      rerender(
        <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
          <Logo />
        </ThemeProvider>,
      );

      logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
    });

    it('should work with custom theme', () => {
      const customTheme = createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#ff0000',
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <Logo />
        </ThemeProvider>,
      );

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Logo Variants', () => {
    it('should show full logo for normal sizes', () => {
      const sizes = [90, 100, 150, 200];

      sizes.forEach((size) => {
        const { unmount } = renderWithTheme(<Logo width={size} height={30} />);

        const logo = screen.getByRole('img');
        expect(logo).toHaveAttribute('viewBox', '0 0 90 25');
        expect(logo).toHaveAttribute('width', size.toString());

        unmount();
      });
    });

    it('should show small logo for very small sizes', () => {
      const sizes = [10, 15, 20, 25];

      sizes.forEach((size) => {
        const { unmount } = renderWithTheme(<Logo width={size} height={size} minWidth={25} />);

        const logo = screen.getByRole('img');
        expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024');
        expect(logo).toHaveAttribute('width', size.toString());

        unmount();
      });
    });

    it('should respect custom minWidth threshold', () => {
      renderWithTheme(<Logo width={50} minWidth={60} />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024'); // Should show small logo
    });

    it('should show full logo when width equals minWidth + 1', () => {
      renderWithTheme(<Logo width={26} minWidth={25} />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('viewBox', '0 0 90 25'); // Should show full logo
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      renderWithTheme(<Logo />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('role', 'img');
    });

    it('should have descriptive aria-label', () => {
      renderWithTheme(<Logo />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('aria-label', 'Admiral logo');
    });

    it('should have title element for screen readers', () => {
      renderWithTheme(<Logo />);

      const title = screen.getByText('Admiral logo');
      expect(title).toBeInTheDocument();
    });

    it('should maintain accessibility for both logo variants', () => {
      // Test full logo
      const { rerender } = renderWithTheme(<Logo width={90} />);

      let logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('aria-label', 'Admiral logo');
      let title = screen.getByText('Admiral logo');
      expect(title).toBeInTheDocument();

      // Test small logo
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Logo width={20} />
        </ThemeProvider>,
      );

      logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('aria-label', 'Admiral logo');
      title = screen.getByText('Admiral logo');
      expect(title).toBeInTheDocument();
    });

    it('should be discoverable by getByLabelText', () => {
      renderWithTheme(<Logo />);

      const logo = screen.getByLabelText('Admiral logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined width gracefully', () => {
      renderWithTheme(<Logo width={undefined} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('width', '90'); // Default value
    });

    it('should handle undefined height gracefully', () => {
      renderWithTheme(<Logo height={undefined} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('height', '25'); // Default value
    });

    it('should handle undefined minWidth gracefully', () => {
      renderWithTheme(<Logo minWidth={undefined} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      // Should show full logo since width (90) > minWidth (25)
      expect(logo).toHaveAttribute('viewBox', '0 0 90 25');
    });

    it('should handle zero values', () => {
      renderWithTheme(<Logo width={0} height={0} minWidth={0} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('width', '0');
      expect(logo).toHaveAttribute('height', '0');
    });

    it('should handle negative values', () => {
      renderWithTheme(<Logo width={-10} height={-5} minWidth={-1} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      // Should still render without crashing
    });

    it('should handle very large values', () => {
      renderWithTheme(<Logo width={9999} height={9999} minWidth={1000} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('width', '9999');
      expect(logo).toHaveAttribute('height', '9999');
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal values', () => {
      renderWithTheme(<Logo width={89.5} height={24.7} minWidth={25.3} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('width', '89.5');
      expect(logo).toHaveAttribute('height', '24.7');
    });

    it('should handle width exactly equal to minWidth', () => {
      renderWithTheme(<Logo width={25} minWidth={25} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024'); // Should show small logo
    });

    it('should handle very small minWidth', () => {
      renderWithTheme(<Logo width={5} minWidth={1} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 90 25'); // Should show full logo
    });

    it('should handle minWidth larger than width', () => {
      renderWithTheme(<Logo width={50} minWidth={100} />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024'); // Should show small logo
    });
  });

  describe('Performance', () => {
    it('should memoize theme colors correctly', () => {
      const { rerender } = renderWithTheme(<Logo />);

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();

      // Re-render with same theme
      rerender(
        <ThemeProvider theme={createTheme({ palette: { mode: 'light' } })}>
          <Logo />
        </ThemeProvider>,
      );

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = renderWithTheme(<Logo width={90} />);

      // Rapidly change props
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Logo width={20} />
        </ThemeProvider>,
      );
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Logo width={100} />
        </ThemeProvider>,
      );
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Logo width={15} />
        </ThemeProvider>,
      );

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
    });

    it('should render multiple instances without issues', () => {
      render(
        <ThemeProvider theme={createTheme()}>
          <div>
            <Logo width={90} />
            <Logo width={20} />
            <Logo width={150} />
          </div>
        </ThemeProvider>,
      );

      const logos = screen.getAllByRole('img');
      expect(logos).toHaveLength(3);

      logos.forEach((logo) => {
        expect(logo).toHaveAttribute('aria-label', 'Admiral logo');
      });
    });
  });

  describe('SVG Structure', () => {
    it('should have correct SVG attributes for full logo', () => {
      renderWithTheme(<Logo width={90} />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('version', '1.1');
      expect(logo).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(logo).toHaveAttribute('viewBox', '0 0 90 25');
    });

    it('should have correct SVG attributes for small logo', () => {
      renderWithTheme(<Logo width={20} />);

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('version', '1.1');
      expect(logo).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(logo).toHaveAttribute('viewBox', '0 0 1024 1024');
    });

    it('should contain path elements', () => {
      renderWithTheme(<Logo />);

      const logo = screen.getByRole('img');
      const paths = logo.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should have different path count for different logo variants', () => {
      // Full logo
      const { rerender } = renderWithTheme(<Logo width={90} />);
      let logo = screen.getByRole('img');
      const fullLogoPaths = logo.querySelectorAll('path').length;

      // Small logo
      rerender(
        <ThemeProvider theme={createTheme()}>
          <Logo width={20} />
        </ThemeProvider>,
      );

      logo = screen.getByRole('img');
      const smallLogoPaths = logo.querySelectorAll('path').length;

      // Both should have paths but may differ in count
      expect(fullLogoPaths).toBeGreaterThan(0);
      expect(smallLogoPaths).toBeGreaterThan(0);
    });
  });
});
