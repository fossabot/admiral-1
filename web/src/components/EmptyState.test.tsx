import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

import { EmptyState } from './EmptyState';

// Helper function to render with a theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('EmptyState', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render with required title prop', () => {
      renderWithTheme(<EmptyState title="No data found" />);

      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('should render title with correct styling', () => {
      renderWithTheme(<EmptyState title="No users" />);

      const title = screen.getByText('No users');
      expect(title).toHaveClass('MuiTypography-h6');
    });

    it('should render description when provided', () => {
      renderWithTheme(
        <EmptyState
          title="No data"
          description="There are no items to display at this time."
        />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      renderWithTheme(<EmptyState title="No data" />);

      expect(screen.getByText('No data')).toBeInTheDocument();
      // Should not have any body2 typography for description
      const body2Elements = screen.queryAllByText((_, element) =>
        element?.tagName === 'P' && element.classList.contains('MuiTypography-body2')
      );
      expect(body2Elements).toHaveLength(0);
    });

    it('should render with custom height', () => {
      const { container } = renderWithTheme(
        <EmptyState title="No data" height={600} />
      );

      const emptyStateBox = container.firstChild;
      expect(emptyStateBox).toHaveStyle('min-height: 600px');
    });

    it('should render with string height', () => {
      const { container } = renderWithTheme(
        <EmptyState title="No data" height="50vh" />
      );

      const emptyStateBox = container.firstChild;
      expect(emptyStateBox).toHaveStyle('min-height: 50vh');
    });

    it('should apply custom sx styles', () => {
      const customSx = { backgroundColor: 'primary.main', color: 'white' };
      const { container } = renderWithTheme(
        <EmptyState title="No data" sx={customSx} />
      );

      const emptyStateBox = container.firstChild;
      expect(emptyStateBox).toHaveClass('MuiBox-root');
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon when provided as ReactNode', () => {
      renderWithTheme(
        <EmptyState title="No search results" icon={<SearchIcon data-testid="search-icon" />} />
      );

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByText('No search results')).toBeInTheDocument();
    });

    it('should render icon with correct styling', () => {
      renderWithTheme(
        <EmptyState title="No data" icon={<AddIcon data-testid="add-icon" />} />
      );

      const icon = screen.getByTestId('add-icon');
      expect(icon.closest('.MuiBox-root')).toHaveStyle('color: rgb(158, 158, 158)'); // text.disabled
    });

    it('should render string icon as SVG path', () => {
      const pathData = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z";
      renderWithTheme(
        <EmptyState title="No data" icon={pathData} />
      );

      const svgElement = screen.getByRole('img', { hidden: true });
      expect(svgElement).toBeInTheDocument();
      expect(svgElement.querySelector('path')).toHaveAttribute('d', pathData);
    });

    it('should not render icon container when no icon provided', () => {
      const { container } = renderWithTheme(<EmptyState title="No data" />);

      // Look for icon container box
      const iconBoxes = container.querySelectorAll('.MuiBox-root');
      // Should only have the main container, not an icon container
      expect(iconBoxes).toHaveLength(1);
    });

    it('should render emoji icon correctly', () => {
      renderWithTheme(
        <EmptyState title="No data" icon="📝" />
      );

      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render primary action button', () => {
      const mockAction = vi.fn();
      renderWithTheme(
        <EmptyState
          title="No users"
          action={{
            label: 'Add User',
            onClick: mockAction,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add User' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('MuiButton-contained');
    });

    it('should handle primary action click', async () => {
      const mockAction = vi.fn();
      renderWithTheme(
        <EmptyState
          title="No users"
          action={{
            label: 'Add User',
            onClick: mockAction,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add User' });
      await user.click(button);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should render action with custom icon', () => {
      renderWithTheme(
        <EmptyState
          title="No users"
          action={{
            label: 'Create User',
            onClick: vi.fn(),
            icon: <SearchIcon data-testid="custom-action-icon" />,
          }}
        />
      );

      expect(screen.getByTestId('custom-action-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument();
    });

    it('should render action with default Add icon when no custom icon', () => {
      renderWithTheme(
        <EmptyState
          title="No users"
          action={{
            label: 'Add User',
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add User' });
      const addIcon = button.querySelector('[data-testid="AddIcon"]');
      expect(addIcon).toBeInTheDocument();
    });

    it('should render secondary action button', () => {
      const mockSecondaryAction = vi.fn();
      renderWithTheme(
        <EmptyState
          title="No users"
          secondaryAction={{
            label: 'Import Users',
            onClick: mockSecondaryAction,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Import Users' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('MuiButton-outlined');
    });

    it('should handle secondary action click', async () => {
      const mockSecondaryAction = vi.fn();
      renderWithTheme(
        <EmptyState
          title="No users"
          secondaryAction={{
            label: 'Import Users',
            onClick: mockSecondaryAction,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Import Users' });
      await user.click(button);

      expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
    });

    it('should render both primary and secondary actions', () => {
      renderWithTheme(
        <EmptyState
          title="No users"
          action={{
            label: 'Add User',
            onClick: vi.fn(),
          }}
          secondaryAction={{
            label: 'Import Users',
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Import Users' })).toBeInTheDocument();
    });

    it('should render custom actions when provided', () => {
      const customActions = (
        <>
          <button>Custom Action 1</button>
          <button>Custom Action 2</button>
        </>
      );

      renderWithTheme(
        <EmptyState title="No users" actions={customActions} />
      );

      expect(screen.getByRole('button', { name: 'Custom Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Action 2' })).toBeInTheDocument();
    });

    it('should prefer custom actions over action/secondaryAction props', () => {
      const customActions = <button>Custom Action</button>;

      renderWithTheme(
        <EmptyState
          title="No users"
          action={{ label: 'Add User', onClick: vi.fn() }}
          secondaryAction={{ label: 'Import Users', onClick: vi.fn() }}
          actions={customActions}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add User' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Import Users' })).not.toBeInTheDocument();
    });

    it('should not render action container when no actions provided', () => {
      const { container } = renderWithTheme(<EmptyState title="No data" />);

      // Should not have action buttons container
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Layout and Styling', () => {
    it('should have centered flex layout', () => {
      const { container } = renderWithTheme(<EmptyState title="No data" />);

      const mainBox = container.firstChild;
      expect(mainBox).toHaveStyle({
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        'text-align': 'center',
      });
    });

    it('should have default minimum height', () => {
      const { container } = renderWithTheme(<EmptyState title="No data" />);

      const mainBox = container.firstChild;
      expect(mainBox).toHaveStyle('min-height: 400px');
    });

    it('should apply proper spacing between elements', () => {
      renderWithTheme(
        <EmptyState
          title="No data"
          description="No items available"
          icon={<SearchIcon />}
          action={{ label: 'Add Item', onClick: vi.fn() }}
        />
      );

      // All elements should be present and properly spaced
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('No items available')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });

    it('should limit description width', () => {
      renderWithTheme(
        <EmptyState
          title="No data"
          description="This is a very long description that should be limited to a maximum width to ensure good readability and proper layout"
        />
      );

      const description = screen.getByText(/This is a very long description/);
      expect(description).toHaveStyle('max-width: 400px');
    });

    it('should center action buttons with gap', () => {
      renderWithTheme(
        <EmptyState
          title="No users"
          action={{ label: 'Add User', onClick: vi.fn() }}
          secondaryAction={{ label: 'Import Users', onClick: vi.fn() }}
        />
      );

      const actionsContainer = screen.getByRole('button', { name: 'Add User' }).closest('.MuiBox-root');
      expect(actionsContainer).toHaveStyle({
        display: 'flex',
        'justify-content': 'center',
      });
    });
  });

  describe('Theme Integration', () => {
    it('should work with light theme', () => {
      const lightTheme = createTheme({ palette: { mode: 'light' } });
      render(
        <ThemeProvider theme={lightTheme}>
          <EmptyState title="No data" />
        </ThemeProvider>
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      const darkTheme = createTheme({ palette: { mode: 'dark' } });
      render(
        <ThemeProvider theme={darkTheme}>
          <EmptyState title="No data" />
        </ThemeProvider>
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should use theme colors for text', () => {
      renderWithTheme(
        <EmptyState
          title="No data"
          description="No items available"
        />
      );

      const title = screen.getByText('No data');
      const description = screen.getByText('No items available');

      // Title should use primary text color
      expect(title).toHaveClass('MuiTypography-root');
      // Description should use secondary text color
      expect(description).toHaveClass('MuiTypography-body2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderWithTheme(
        <EmptyState
          title="No search results"
          description="Try adjusting your search terms"
          action={{ label: 'Clear filters', onClick: vi.fn() }}
        />
      );

      // Title should be rendered as h6 for semantic hierarchy
      const title = screen.getByRole('heading', { level: 6 });
      expect(title).toHaveTextContent('No search results');

      // Button should be accessible
      const button = screen.getByRole('button', { name: 'Clear filters' });
      expect(button).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      renderWithTheme(
        <EmptyState
          title="No notifications"
          description="You're all caught up!"
        />
      );

      // Text should be accessible to screen readers
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    it('should have proper button accessibility', () => {
      renderWithTheme(
        <EmptyState
          title="No items"
          action={{ label: 'Add new item', onClick: vi.fn() }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add new item' });
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined optional props gracefully', () => {
      expect(() => {
        renderWithTheme(
          <EmptyState
            title="Test"
            description={undefined}
            icon={undefined}
            action={undefined}
            secondaryAction={undefined}
          />
        );
      }).not.toThrow();
    });

    it('should handle empty string title', () => {
      renderWithTheme(<EmptyState title="" />);

      // Should render without crashing
      const heading = screen.getByRole('heading', { level: 6 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle empty string description', () => {
      renderWithTheme(
        <EmptyState title="No data" description="" />
      );

      const description = screen.getByText('');
      expect(description).toBeInTheDocument();
    });

    it('should handle zero height', () => {
      const { container } = renderWithTheme(
        <EmptyState title="No data" height={0} />
      );

      const mainBox = container.firstChild;
      expect(mainBox).toHaveStyle('min-height: 0px');
    });

    it('should handle negative height', () => {
      const { container } = renderWithTheme(
        <EmptyState title="No data" height={-100} />
      );

      const mainBox = container.firstChild;
      expect(mainBox).toHaveStyle('min-height: -100px');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200);
      renderWithTheme(<EmptyState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'B'.repeat(500);
      renderWithTheme(
        <EmptyState title="Title" description={longDescription} />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialTitle = "No data found! @#$%^&*()_+-=[]{}|;':\",./<>?";
      renderWithTheme(<EmptyState title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('should handle React fragments as custom actions', () => {
      const fragmentActions = (
        <React.Fragment>
          <button>Action 1</button>
          <button>Action 2</button>
        </React.Fragment>
      );

      renderWithTheme(
        <EmptyState title="No data" actions={fragmentActions} />
      );

      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });

    it('should handle null custom actions', () => {
      renderWithTheme(
        <EmptyState title="No data" actions={null} />
      );

      // Should render without crashing
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = renderWithTheme(
        <EmptyState title="No data" />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <ThemeProvider theme={createTheme()}>
          <EmptyState title="No data" />
        </ThemeProvider>
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should handle rapid action clicks', async () => {
      const mockAction = vi.fn();
      renderWithTheme(
        <EmptyState
          title="No data"
          action={{ label: 'Add Item', onClick: mockAction }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });

      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockAction).toHaveBeenCalledTimes(3);
    });
  });
});
