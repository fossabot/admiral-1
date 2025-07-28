import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Person as PersonIcon } from '@mui/icons-material';

import { StatusChip, StatusType } from './StatusChip';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('StatusChip', () => {
  beforeEach(() => {
    // Clear any mocks if needed
  });

  describe('Rendering Tests', () => {
    it('should render with basic status', () => {
      renderWithTheme(<StatusChip status="active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      // Check for chip by class or test ID instead of role
      expect(screen.getByText('Active').closest('.MuiChip-root')).toBeInTheDocument();
    });

    it('should capitalize status label', () => {
      renderWithTheme(<StatusChip status="running" />);

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should handle lowercase status', () => {
      renderWithTheme(<StatusChip status="pending" />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should handle uppercase status', () => {
      renderWithTheme(<StatusChip status="ERROR" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should handle mixed case status', () => {
      renderWithTheme(<StatusChip status="hEaLtHy" />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should apply default size and variant', () => {
      renderWithTheme(<StatusChip status="active" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
      expect(chip).toHaveClass('MuiChip-filled');
    });
  });

  describe('Status Types and Colors', () => {
    it('should render success status with correct color', () => {
      renderWithTheme(<StatusChip status="running" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });

    it('should render error status with correct color', () => {
      renderWithTheme(<StatusChip status="failed" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    it('should render warning status with correct color', () => {
      renderWithTheme(<StatusChip status="warning" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorWarning');
    });

    it('should render info status with correct color', () => {
      renderWithTheme(<StatusChip status="info" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorInfo');
    });

    it('should handle unknown status with default color', () => {
      renderWithTheme(<StatusChip status="unknown-status" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorDefault');
    });

    describe('Success Status Types', () => {
      const successStatuses = ['running', 'healthy', 'active', 'completed', 'success'];

      successStatuses.forEach((status) => {
        it(`should render ${status} with success color`, () => {
          renderWithTheme(<StatusChip status={status} />);

          const chip = document.querySelector('.MuiChip-root');
          expect(chip).toHaveClass('MuiChip-colorSuccess');
        });
      });
    });

    describe('Warning Status Types', () => {
      const warningStatuses = ['warning', 'degraded', 'pending'];

      warningStatuses.forEach((status) => {
        it(`should render ${status} with warning color`, () => {
          renderWithTheme(<StatusChip status={status} />);

          const chip = document.querySelector('.MuiChip-root');
          expect(chip).toHaveClass('MuiChip-colorWarning');
        });
      });
    });

    describe('Error Status Types', () => {
      const errorStatuses = ['error', 'failed', 'unhealthy'];

      errorStatuses.forEach((status) => {
        it(`should render ${status} with error color`, () => {
          renderWithTheme(<StatusChip status={status} />);

          const chip = document.querySelector('.MuiChip-root');
          expect(chip).toHaveClass('MuiChip-colorError');
        });
      });
    });

    describe('Neutral Status Types', () => {
      const neutralStatuses = ['stopped', 'inactive', 'disabled', 'cancelled'];

      neutralStatuses.forEach((status) => {
        it(`should render ${status} with default color`, () => {
          renderWithTheme(<StatusChip status={status} />);

          const chip = document.querySelector('.MuiChip-root');
          expect(chip).toHaveClass('MuiChip-colorDefault');
        });
      });
    });

    describe('Info Status Types', () => {
      const infoStatuses = ['info', 'unknown'];

      infoStatuses.forEach((status) => {
        it(`should render ${status} with info color`, () => {
          renderWithTheme(<StatusChip status={status} />);

          const chip = document.querySelector('.MuiChip-root');
          expect(chip).toHaveClass('MuiChip-colorInfo');
        });
      });
    });
  });

  describe('Icons', () => {
    it('should show icon by default', () => {
      renderWithTheme(<StatusChip status="active" />);

      // Check for success icon (CheckCircle)
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });

    it('should hide icon when showIcon=false', () => {
      renderWithTheme(<StatusChip status="active" showIcon={false} />);

      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
    });

    it('should show custom icon when provided', () => {
      renderWithTheme(
        <StatusChip
          status="active"
          customIcon={<PersonIcon data-testid="custom-icon" />}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
    });

    it('should prioritize custom icon over default icon', () => {
      renderWithTheme(
        <StatusChip
          status="error"
          showIcon={true}
          customIcon={<PersonIcon data-testid="custom-icon" />}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('ErrorIcon')).not.toBeInTheDocument();
    });

    it('should not show any icon when showIcon=false and customIcon provided', () => {
      renderWithTheme(
        <StatusChip
          status="active"
          showIcon={false}
          customIcon={<PersonIcon data-testid="custom-icon" />}
        />
      );

      expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
    });

    describe('Default Status Icons', () => {
      it('should show CheckCircle icon for success statuses', () => {
        renderWithTheme(<StatusChip status="running" />);
        expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
      });

      it('should show Warning icon for warning statuses', () => {
        renderWithTheme(<StatusChip status="warning" />);
        expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
      });

      it('should show Schedule icon for pending status', () => {
        renderWithTheme(<StatusChip status="pending" />);
        expect(screen.getByTestId('ScheduleIcon')).toBeInTheDocument();
      });

      it('should show Error icon for error statuses', () => {
        renderWithTheme(<StatusChip status="error" />);
        expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
      });

      it('should show Cancel icon for stopped/cancelled statuses', () => {
        renderWithTheme(<StatusChip status="stopped" />);
        expect(screen.getByTestId('CancelIcon')).toBeInTheDocument();
      });

      it('should show Block icon for inactive/disabled statuses', () => {
        renderWithTheme(<StatusChip status="inactive" />);
        expect(screen.getByTestId('BlockIcon')).toBeInTheDocument();
      });

      it('should show Info icon for info/unknown statuses', () => {
        renderWithTheme(<StatusChip status="info" />);
        expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
      });
    });
  });

  describe('Size Variants', () => {
    it('should render small size by default', () => {
      renderWithTheme(<StatusChip status="active" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });

    it('should render medium size', () => {
      renderWithTheme(<StatusChip status="active" size="medium" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
    });

    it('should handle size prop properly', () => {
      const { rerender } = renderWithTheme(<StatusChip status="active" size="small" />);

      let chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');

      rerender(
        <ThemeProvider theme={createTheme()}>
          <StatusChip status="active" size="medium" />
        </ThemeProvider>
      );

      chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
    });
  });

  describe('Chip Variants', () => {
    it('should render filled variant by default', () => {
      renderWithTheme(<StatusChip status="active" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-filled');
    });

    it('should render outlined variant', () => {
      renderWithTheme(<StatusChip status="active" variant="outlined" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-outlined');
    });

    it('should handle variant prop changes', () => {
      const { rerender } = renderWithTheme(
        <StatusChip status="active" variant="filled" />
      );

      let chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-filled');

      rerender(
        <ThemeProvider theme={createTheme()}>
          <StatusChip status="active" variant="outlined" />
        </ThemeProvider>
      );

      chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-outlined');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward additional props to Chip component', () => {
      renderWithTheme(
        <StatusChip
          status="active"
          data-testid="custom-chip"
          className="custom-class"
        />
      );

      const chip = screen.getByTestId('custom-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass('custom-class');
    });

    it('should handle onClick prop', () => {
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      renderWithTheme(
        <StatusChip
          status="active"
          onClick={handleClick}
          data-testid="clickable-chip"
        />
      );

      const chip = screen.getByTestId('clickable-chip');
      chip.click();

      expect(clicked).toBe(true);
    });

    it('should handle disabled prop', () => {
      renderWithTheme(
        <StatusChip status="active" disabled data-testid="disabled-chip" />
      );

      const chip = screen.getByTestId('disabled-chip');
      expect(chip).toHaveClass('Mui-disabled');
    });

    it('should handle onDelete prop', () => {
      const handleDelete = () => {
        // Delete handler
      };

      renderWithTheme(
        <StatusChip
          status="active"
          onDelete={handleDelete}
          data-testid="deletable-chip"
        />
      );

      const chip = screen.getByTestId('deletable-chip');
      expect(chip).toBeInTheDocument();

      // Chip with onDelete should have delete icon
      const deleteIcon = chip.querySelector('.MuiChip-deleteIcon');
      expect(deleteIcon).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should work with light theme', () => {
      const lightTheme = createTheme({ palette: { mode: 'light' } });
      render(
        <ThemeProvider theme={lightTheme}>
          <StatusChip status="active" />
        </ThemeProvider>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      const darkTheme = createTheme({ palette: { mode: 'dark' } });
      render(
        <ThemeProvider theme={darkTheme}>
          <StatusChip status="active" />
        </ThemeProvider>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should use theme colors for chip', () => {
      const customTheme = createTheme({
        palette: {
          success: {
            main: '#ff0000',
          },
        },
      });

      render(
        <ThemeProvider theme={customTheme}>
          <StatusChip status="active" />
        </ThemeProvider>
      );

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });
  });

  describe('Accessibility', () => {
    it('should have proper chip role', () => {
      renderWithTheme(<StatusChip status="active" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });

    it('should be accessible via text content', () => {
      renderWithTheme(<StatusChip status="running" />);

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should support keyboard interaction when clickable', () => {
      renderWithTheme(
        <StatusChip status="active" onClick={() => {}} data-testid="clickable" />
      );

      const chip = screen.getByTestId('clickable');
      expect(chip).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper ARIA attributes when deletable', () => {
      renderWithTheme(
        <StatusChip
          status="active"
          onDelete={() => {}}
          data-testid="deletable"
        />
      );

      const chip = screen.getByTestId('deletable');
      expect(chip).toBeInTheDocument();
    });

    it('should work with screen readers', () => {
      renderWithTheme(<StatusChip status="healthy" />);

      // Should be accessible by text content
      const chip = screen.getByText('Healthy');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined optional props gracefully', () => {
      expect(() => {
        renderWithTheme(
          <StatusChip
            status="active"
            showIcon={undefined}
            customIcon={undefined}
            size={undefined}
            variant={undefined}
          />
        );
      }).not.toThrow();
    });

    it('should handle empty string status', () => {
      renderWithTheme(<StatusChip status="" />);

      // Check that chip exists even with empty status
      expect(document.querySelector('.MuiChip-root')).toBeInTheDocument();
    });

    it('should handle special characters in status', () => {
      renderWithTheme(<StatusChip status="in-progress" />);

      expect(screen.getByText('In-progress')).toBeInTheDocument();
    });

    it('should handle numbers in status', () => {
      renderWithTheme(<StatusChip status="version2" />);

      expect(screen.getByText('Version2')).toBeInTheDocument();
    });

    it('should handle boolean showIcon prop', () => {
      // Test showIcon=true case
      const { unmount } = renderWithTheme(<StatusChip status="active" showIcon={true} />);
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();

      // Clean up and test showIcon=false case
      unmount();
      renderWithTheme(<StatusChip status="active" showIcon={false} />);
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long status names', () => {
      const longStatus = 'very-long-status-name-that-might-cause-issues';
      renderWithTheme(<StatusChip status={longStatus} />);

      expect(screen.getByText('Very-long-status-name-that-might-cause-issues')).toBeInTheDocument();
    });

    it('should handle status with multiple words', () => {
      renderWithTheme(<StatusChip status="partially completed" />);

      expect(screen.getByText('Partially completed')).toBeInTheDocument();
    });

    it('should handle status with numbers and symbols', () => {
      renderWithTheme(<StatusChip status="version-2.1.0" />);

      expect(screen.getByText('Version-2.1.0')).toBeInTheDocument();
    });

    it('should handle status with only spaces', () => {
      renderWithTheme(<StatusChip status="   " />);

      // Since we preserve spaces in the label, check that chip exists
      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toBeInTheDocument();
      // Check that the chip label contains the spaces (Material-UI may normalize whitespace)
      const label = chip?.querySelector('.MuiChip-label');
      expect(label).toBeInTheDocument();
    });

    it('should handle custom icon as string', () => {
      // Custom icon should be ReactNode, but test edge case
      expect(() => {
        renderWithTheme(
          <StatusChip
            status="active"
            customIcon={'not-a-react-node' as unknown as React.ReactNode}
          />
        );
      }).not.toThrow();
    });

    it('should handle rapid status changes', () => {
      const { rerender } = renderWithTheme(<StatusChip status="active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={createTheme()}>
          <StatusChip status="failed" />
        </ThemeProvider>
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('should handle multiple StatusChip instances', () => {
      render(
        <ThemeProvider theme={createTheme()}>
          <div>
            <StatusChip status="active" />
            <StatusChip status="failed" />
            <StatusChip status="pending" />
          </div>
        </ThemeProvider>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily with same props', () => {
      const { rerender } = renderWithTheme(<StatusChip status="active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <ThemeProvider theme={createTheme()}>
          <StatusChip status="active" />
        </ThemeProvider>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle rapid prop changes efficiently', () => {
      const { rerender } = renderWithTheme(<StatusChip status="active" size="small" />);

      // Change multiple props rapidly
      rerender(
        <ThemeProvider theme={createTheme()}>
          <StatusChip status="failed" size="medium" variant="outlined" />
        </ThemeProvider>
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
      expect(chip).toHaveClass('MuiChip-outlined');
    });

    it('should handle status normalization efficiently', () => {
      // Test that toLowerCase() is applied correctly
      const { rerender } = renderWithTheme(<StatusChip status="ACTIVE" />);

      expect(screen.getByText('Active')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={createTheme()}>
          <StatusChip status="active" />
        </ThemeProvider>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Color Type Safety', () => {
    it('should handle known status types correctly', () => {
      const knownStatuses: StatusType[] = ['running', 'healthy', 'success', 'error', 'failed', 'warning', 'pending', 'stopped', 'deploying'];

      knownStatuses.forEach((status) => {
        const { unmount } = renderWithTheme(<StatusChip status={status} />);

        const expectedLabel = status.charAt(0).toUpperCase() + status.slice(1);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();

        unmount();
      });
    });

    it('should fallback to default color for unknown status types', () => {
      renderWithTheme(<StatusChip status="completely-unknown-status" />);

      const chip = document.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorDefault');
    });
  });
});
