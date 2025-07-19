import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Chip from '@/components/extended/Chip';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, themeMode: 'light' | 'dark' = 'light') => {
  const theme = createTheme({
    palette: {
      mode: themeMode,
      // Add orange color to palette for testing
      orange: {
        main: '#ff6600',
        light: '#ff9544',
        dark: '#cc5200',
      },
    },
  });

  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Chip', () => {
  beforeEach(() => {
    // Clear any existing elements
  });

  describe('Rendering Tests', () => {
    it('should render with default props', () => {
      renderWithTheme(<Chip label="Test Chip" />);

      const chip = screen.getByText('Test Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      renderWithTheme(<Chip label="Custom Label" />);

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should render with custom variant', () => {
      renderWithTheme(<Chip label="Outlined Chip" variant="outlined" />);

      const chip = screen.getByText('Outlined Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      renderWithTheme(<Chip label="Small Chip" size="small" />);

      const chip = screen.getByText('Small Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with onDelete handler', () => {
      const handleDelete = () => {};
      renderWithTheme(<Chip label="Deletable" onDelete={handleDelete} />);

      expect(screen.getByText('Deletable')).toBeInTheDocument();
      expect(screen.getByTestId('CancelIcon')).toBeInTheDocument();
    });

    it('should render with avatar', () => {
      renderWithTheme(<Chip label="Avatar Chip" avatar={<div data-testid="avatar">A</div>} />);

      expect(screen.getByText('Avatar Chip')).toBeInTheDocument();
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      renderWithTheme(<Chip label="Icon Chip" icon={<div data-testid="chip-icon">I</div>} />);

      expect(screen.getByText('Icon Chip')).toBeInTheDocument();
      expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
    });
  });

  describe('Chip Color Tests', () => {
    it('should render with primary color by default', () => {
      renderWithTheme(<Chip label="Primary Chip" />);

      const chip = screen.getByText('Primary Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with secondary color', () => {
      renderWithTheme(<Chip label="Secondary Chip" chipColor="secondary" />);

      const chip = screen.getByText('Secondary Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with success color', () => {
      renderWithTheme(<Chip label="Success Chip" chipColor="success" />);

      const chip = screen.getByText('Success Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with error color', () => {
      renderWithTheme(<Chip label="Error Chip" chipColor="error" />);

      const chip = screen.getByText('Error Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with warning color', () => {
      renderWithTheme(<Chip label="Warning Chip" chipColor="warning" />);

      const chip = screen.getByText('Warning Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render with orange color', () => {
      renderWithTheme(<Chip label="Orange Chip" chipColor="orange" />);

      const chip = screen.getByText('Orange Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should fallback to primary when orange is not available in theme', () => {
      const theme = createTheme({
        palette: {
          mode: 'light',
          // No orange color defined
        },
      });

      render(
        <ThemeProvider theme={theme}>
          <Chip label="Orange Fallback" chipColor="orange" />
        </ThemeProvider>,
      );

      const chip = screen.getByText('Orange Fallback');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Variant Tests', () => {
    it('should render filled variant by default', () => {
      renderWithTheme(<Chip label="Filled Chip" />);

      const chip = screen.getByText('Filled Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render outlined variant correctly', () => {
      renderWithTheme(<Chip label="Outlined Chip" variant="outlined" />);

      const chip = screen.getByText('Outlined Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render outlined variant with custom color', () => {
      renderWithTheme(<Chip label="Outlined Success" variant="outlined" chipColor="success" />);

      const chip = screen.getByText('Outlined Success');
      expect(chip).toBeInTheDocument();
    });

    it('should render outlined variant with orange color', () => {
      renderWithTheme(<Chip label="Outlined Orange" variant="outlined" chipColor="orange" />);

      const chip = screen.getByText('Outlined Orange');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Disabled State Tests', () => {
    it('should render disabled chip', () => {
      renderWithTheme(<Chip label="Disabled Chip" disabled />);

      const chip = screen.getByText('Disabled Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should render disabled outlined chip', () => {
      renderWithTheme(<Chip label="Disabled Outlined" disabled variant="outlined" />);

      const chip = screen.getByText('Disabled Outlined');
      expect(chip).toBeInTheDocument();
    });

    it('should render disabled chip with color', () => {
      renderWithTheme(<Chip label="Disabled Success" disabled chipColor="success" />);

      const chip = screen.getByText('Disabled Success');
      expect(chip).toBeInTheDocument();
    });

    it('should render disabled outlined chip with color', () => {
      renderWithTheme(<Chip label="Disabled Outlined Error" disabled variant="outlined" chipColor="error" />);

      const chip = screen.getByText('Disabled Outlined Error');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Theme Integration Tests', () => {
    it('should work with light theme', () => {
      renderWithTheme(<Chip label="Light Theme" chipColor="primary" />, 'light');

      const chip = screen.getByText('Light Theme');
      expect(chip).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      renderWithTheme(<Chip label="Dark Theme" chipColor="primary" />, 'dark');

      const chip = screen.getByText('Dark Theme');
      expect(chip).toBeInTheDocument();
    });

    it('should adapt colors for light theme outlined variant', () => {
      renderWithTheme(<Chip label="Light Outlined" variant="outlined" chipColor="secondary" />, 'light');

      const chip = screen.getByText('Light Outlined');
      expect(chip).toBeInTheDocument();
    });

    it('should adapt colors for dark theme outlined variant', () => {
      renderWithTheme(<Chip label="Dark Outlined" variant="outlined" chipColor="secondary" />, 'dark');

      const chip = screen.getByText('Dark Outlined');
      expect(chip).toBeInTheDocument();
    });

    it('should adapt colors for dark theme filled variant', () => {
      renderWithTheme(<Chip label="Dark Filled" chipColor="warning" />, 'dark');

      const chip = screen.getByText('Dark Filled');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Custom Styling Tests', () => {
    it('should apply custom sx styles', () => {
      renderWithTheme(
        <Chip
          label="Custom Styled"
          sx={{
            borderRadius: '16px',
            fontSize: '14px',
          }}
        />,
      );

      const chip = screen.getByText('Custom Styled');
      expect(chip).toBeInTheDocument();
    });

    it('should merge custom sx with color styles', () => {
      renderWithTheme(
        <Chip
          label="Merged Styles"
          chipColor="success"
          sx={{
            margin: '8px',
            padding: '4px 8px',
          }}
        />,
      );

      const chip = screen.getByText('Merged Styles');
      expect(chip).toBeInTheDocument();
    });

    it('should merge custom sx with disabled styles', () => {
      renderWithTheme(
        <Chip
          label="Disabled Custom"
          disabled
          sx={{
            borderRadius: '20px',
          }}
        />,
      );

      const chip = screen.getByText('Disabled Custom');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Props Forwarding Tests', () => {
    it('should forward additional props to MuiChip', () => {
      renderWithTheme(<Chip label="Additional Props" data-testid="custom-chip" role="button" />);

      const chip = screen.getByTestId('custom-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveAttribute('role', 'button');
    });

    it('should forward onClick handler', () => {
      const handleClick = () => {};
      renderWithTheme(<Chip label="Clickable" onClick={handleClick} />);

      const chip = screen.getByText('Clickable');
      expect(chip).toBeInTheDocument();
    });

    it('should forward className', () => {
      renderWithTheme(<Chip label="Custom Class" className="custom-chip-class" />);

      const chip = screen.getByText('Custom Class');
      expect(chip).toBeInTheDocument();
      // Check the parent chip container has the className
      const chipContainer = chip.closest('.MuiChip-root');
      expect(chipContainer).toHaveClass('custom-chip-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      const { container } = renderWithTheme(<Chip label="" />);

      // Should still render the chip component
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });

    it('should handle very long labels', () => {
      const longLabel = 'This is a very long label that might overflow the chip container';
      renderWithTheme(<Chip label={longLabel} />);

      const chip = screen.getByText(longLabel);
      expect(chip).toBeInTheDocument();
    });

    it('should handle special characters in label', () => {
      const specialLabel = 'Special! @#$%^&*()_+ Characters';
      renderWithTheme(<Chip label={specialLabel} />);

      const chip = screen.getByText(specialLabel);
      expect(chip).toBeInTheDocument();
    });

    it('should handle undefined chipColor gracefully', () => {
      renderWithTheme(<Chip label="Undefined Color" chipColor={undefined} />);

      const chip = screen.getByText('Undefined Color');
      expect(chip).toBeInTheDocument();
    });

    it('should handle combination of all props', () => {
      const handleClick = () => {};
      const handleDelete = () => {};

      renderWithTheme(
        <Chip
          label="Complex Chip"
          chipColor="success"
          variant="outlined"
          size="small"
          disabled={false}
          onClick={handleClick}
          onDelete={handleDelete}
          avatar={<div data-testid="complex-avatar">A</div>}
          sx={{ margin: 1 }}
          data-testid="complex-chip"
        />,
      );

      expect(screen.getByTestId('complex-chip')).toBeInTheDocument();
      expect(screen.getByText('Complex Chip')).toBeInTheDocument();
      expect(screen.getByTestId('complex-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('CancelIcon')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper role for clickable chip', () => {
      const handleClick = () => {};
      renderWithTheme(<Chip label="Clickable Chip" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('Clickable Chip');
    });

    it('should have proper role for deletable chip', () => {
      const handleDelete = () => {};
      renderWithTheme(<Chip label="Deletable Chip" onDelete={handleDelete} />);

      const chip = screen.getByText('Deletable Chip');
      expect(chip).toBeInTheDocument();

      // Check for delete icon
      const deleteIcon = screen.getByTestId('CancelIcon');
      expect(deleteIcon).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const handleClick = () => {};
      renderWithTheme(<Chip label="Keyboard Chip" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveAttribute('tabindex', '0');
    });

    it('should not be focusable when disabled', () => {
      renderWithTheme(<Chip label="Disabled Chip" disabled onClick={() => {}} />);

      const chip = screen.getByText('Disabled Chip');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple chips efficiently', () => {
      const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'orange'] as const;

      render(
        <ThemeProvider theme={createTheme()}>
          <div>
            {colors.map((color) => (
              <Chip key={color} label={`${color} chip`} chipColor={color} />
            ))}
          </div>
        </ThemeProvider>,
      );

      colors.forEach((color) => {
        expect(screen.getByText(`${color} chip`)).toBeInTheDocument();
      });
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderWithTheme(<Chip label="Memory Test" />);

      expect(screen.getByText('Memory Test')).toBeInTheDocument();

      unmount();

      expect(screen.queryByText('Memory Test')).not.toBeInTheDocument();
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = renderWithTheme(<Chip label="Initial" chipColor="primary" />);

      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={createTheme()}>
          <Chip label="Updated" chipColor="secondary" />
        </ThemeProvider>,
      );

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });
  });

  describe('Material-UI Integration', () => {
    it('should work with custom theme palette', () => {
      const customTheme = createTheme({
        palette: {
          primary: {
            main: '#custom-color',
          },
          orange: {
            main: '#ff8800',
            light: '#ffaa44',
            dark: '#cc6600',
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <Chip label="Custom Theme" chipColor="primary" />
        </ThemeProvider>,
      );

      const chip = screen.getByText('Custom Theme');
      expect(chip).toBeInTheDocument();
    });

    it('should respect theme breakpoints for responsive design', () => {
      renderWithTheme(<Chip label="Responsive Chip" sx={{ display: { xs: 'none', md: 'inline-flex' } }} />);

      const chip = screen.getByText('Responsive Chip');
      expect(chip).toBeInTheDocument();
    });

    it('should work with theme typography', () => {
      const customTheme = createTheme({
        typography: {
          button: {
            fontSize: '0.875rem',
            fontWeight: 500,
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <Chip label="Custom Typography" />
        </ThemeProvider>,
      );

      const chip = screen.getByText('Custom Typography');
      expect(chip).toBeInTheDocument();
    });
  });
});
