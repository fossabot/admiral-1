import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { Settings as SettingsIcon, Person as PersonIcon } from '@mui/icons-material';

import { PageHeader, BreadcrumbItem } from './PageHeader';

// Helper function to render with theme and router
const renderWithProviders = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
};

describe('PageHeader', () => {
  beforeEach(() => {
    // Clear any mocks if needed
  });

  describe('Rendering Tests', () => {
    it('should render with required title prop', () => {
      renderWithProviders(<PageHeader title="User Management" />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('User Management');
    });

    it('should render title with correct styling', () => {
      renderWithProviders(<PageHeader title="Applications" />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('MuiTypography-h2');
    });

    it('should render description when provided', () => {
      renderWithProviders(
        <PageHeader
          title="Settings"
          description="Manage your application settings and preferences"
        />
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your application settings and preferences')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      renderWithProviders(<PageHeader title="Settings" />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      // Should not have description typography
      const description = screen.queryByText(/Manage your/);
      expect(description).not.toBeInTheDocument();
    });

    it('should apply custom sx styles', () => {
      const customSx = { backgroundColor: 'primary.main' };
      const { container } = renderWithProviders(
        <PageHeader title="Test" sx={customSx} />
      );

      const headerBox = container.firstChild?.firstChild;
      expect(headerBox).toHaveClass('MuiBox-root');
    });
  });

  describe('Breadcrumbs', () => {
    it('should render default home breadcrumb when no custom breadcrumbs', () => {
      renderWithProviders(<PageHeader title="Users" />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should render custom breadcrumbs with home prepended', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Settings', href: '/settings' },
        { label: 'Users' },
      ];

      renderWithProviders(
        <PageHeader title="User Details" breadcrumbs={breadcrumbs} />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should render breadcrumb links correctly', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Applications', href: '/applications' },
        { label: 'App Details' },
      ];

      renderWithProviders(
        <PageHeader title="Configuration" breadcrumbs={breadcrumbs} />
      );

      const homeLink = screen.getByText('Home').closest('a');
      const appLink = screen.getByText('Applications').closest('a');
      const detailsText = screen.getByText('App Details');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(appLink).toHaveAttribute('href', '/applications');
      expect(detailsText.closest('a')).not.toBeInTheDocument(); // Last item should not be a link
    });

    it('should render breadcrumb icons', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Settings', href: '/settings', icon: <SettingsIcon data-testid="settings-icon" /> },
      ];

      renderWithProviders(
        <PageHeader title="User Settings" breadcrumbs={breadcrumbs} />
      );

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.getByTestId('HomeIcon')).toBeInTheDocument(); // Default home icon
    });

    it('should not render breadcrumbs when only home would be shown', () => {
      renderWithProviders(<PageHeader title="Home" breadcrumbs={[]} />);

      // Should not render breadcrumb navigation
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should handle breadcrumbs without href as text', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Section', href: '/section' },
        { label: 'Current Page' },
      ];

      renderWithProviders(
        <PageHeader title="Page Title" breadcrumbs={breadcrumbs} />
      );

      const sectionLink = screen.getByText('Section').closest('a');
      const currentPageText = screen.getByText('Current Page');

      expect(sectionLink).toHaveAttribute('href', '/section');
      expect(currentPageText.closest('a')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton for title when loading', () => {
      renderWithProviders(<PageHeader title="Users" loading={true} />);

      expect(screen.getByText('Users')).not.toBeInTheDocument();
      const skeletons = screen.getAllByTestId(/loading/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show skeleton for description when loading', () => {
      renderWithProviders(
        <PageHeader
          title="Users"
          description="Manage system users"
          loading={true}
        />
      );

      expect(screen.getByText('Users')).not.toBeInTheDocument();
      expect(screen.getByText('Manage system users')).not.toBeInTheDocument();
    });

    it('should show skeleton for last breadcrumb when loading', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Settings', href: '/settings' },
      ];

      renderWithProviders(
        <PageHeader title="Users" breadcrumbs={breadcrumbs} loading={true} />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      // Last breadcrumb should show skeleton instead of title
    });

    it('should not show actions when loading', () => {
      const actions = <button>Add User</button>;

      renderWithProviders(
        <PageHeader title="Users" actions={actions} loading={true} />
      );

      expect(screen.queryByRole('button', { name: 'Add User' })).not.toBeInTheDocument();
    });

    it('should show normal content when not loading', () => {
      renderWithProviders(
        <PageHeader
          title="Users"
          description="Manage system users"
          loading={false}
        />
      );

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Manage system users')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should render actions when provided', () => {
      const actions = (
        <>
          <button>Add User</button>
          <button>Import</button>
        </>
      );

      renderWithProviders(<PageHeader title="Users" actions={actions} />);

      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
    });

    it('should not render actions container when no actions provided', () => {
      const { container } = renderWithProviders(<PageHeader title="Users" />);

      // Should not have actions container
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(0);
    });

    it('should position actions correctly', () => {
      const actions = <button>Add User</button>;

      renderWithProviders(<PageHeader title="Users" actions={actions} />);

      const button = screen.getByRole('button', { name: 'Add User' });
      const actionsContainer = button.closest('.MuiBox-root');

      expect(actionsContainer).toHaveStyle({
        display: 'flex',
        'align-items': 'center',
      });
    });

    it('should handle multiple action buttons', () => {
      const actions = (
        <>
          <button>Primary Action</button>
          <button>Secondary Action</button>
          <button>Tertiary Action</button>
        </>
      );

      renderWithProviders(<PageHeader title="Dashboard" actions={actions} />);

      expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tertiary Action' })).toBeInTheDocument();
    });
  });

  describe('Badge Integration', () => {
    it('should render badge alongside title', () => {
      const badge = <span data-testid="status-badge">Active</span>;

      renderWithProviders(<PageHeader title="Application" badge={badge} />);

      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    });

    it('should position badge correctly with title', () => {
      const badge = <span data-testid="status-badge">Live</span>;

      renderWithProviders(<PageHeader title="Environment" badge={badge} />);

      const title = screen.getByText('Environment');
      const badgeElement = screen.getByTestId('status-badge');

      // Both should be in the same container
      const titleContainer = title.closest('.MuiStack-root');
      const badgeContainer = badgeElement.closest('.MuiStack-root');

      expect(titleContainer).toBe(badgeContainer);
    });

    it('should not show badge when loading', () => {
      const badge = <span data-testid="status-badge">Active</span>;

      renderWithProviders(
        <PageHeader title="Application" badge={badge} loading={true} />
      );

      expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Responsive Design', () => {
    it('should have proper header layout structure', () => {
      renderWithProviders(
        <PageHeader
          title="Dashboard"
          description="Overview of your applications"
          actions={<button>Add App</button>}
        />
      );

      // Should have proper flex layout
      const title = screen.getByText('Dashboard');
      const headerContainer = title.closest('.MuiBox-root')?.parentElement;

      expect(headerContainer).toHaveStyle({
        display: 'flex',
        'justify-content': 'space-between',
      });
    });

    it('should handle long titles with text overflow', () => {
      const longTitle = 'Very Long Application Name That Might Overflow The Container Width';

      renderWithProviders(<PageHeader title={longTitle} />);

      const title = screen.getByText(longTitle);
      expect(title).toHaveStyle({
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
      });
    });

    it('should be responsive with flexbox layout', () => {
      renderWithProviders(
        <PageHeader
          title="Applications"
          actions={<button>Add Application</button>}
        />
      );

      const title = screen.getByText('Applications');
      const headerContainer = title.closest('.MuiBox-root')?.parentElement;

      expect(headerContainer).toHaveStyle('flex-wrap: wrap');
    });

    it('should give proper flex properties to title container', () => {
      renderWithProviders(<PageHeader title="Users" />);

      const title = screen.getByText('Users');
      const titleContainer = title.closest('.MuiBox-root');

      expect(titleContainer).toHaveStyle({
        flex: '1 1 0%',
        'min-width': '0px',
      });
    });
  });

  describe('Theme Integration', () => {
    it('should work with light theme', () => {
      const lightTheme = createTheme({ palette: { mode: 'light' } });
      render(
        <MemoryRouter>
          <ThemeProvider theme={lightTheme}>
            <PageHeader title="Dashboard" />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should work with dark theme', () => {
      const darkTheme = createTheme({ palette: { mode: 'dark' } });
      render(
        <MemoryRouter>
          <ThemeProvider theme={darkTheme}>
            <PageHeader title="Dashboard" />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should use theme typography for title', () => {
      renderWithProviders(<PageHeader title="Applications" />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('MuiTypography-h2');
    });

    it('should use theme colors for text', () => {
      renderWithProviders(
        <PageHeader title="Users" description="Manage system users" />
      );

      const title = screen.getByText('Users');
      const description = screen.getByText('Manage system users');

      expect(title).toHaveClass('MuiTypography-root');
      expect(description).toHaveClass('MuiTypography-body1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<PageHeader title="User Management" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('User Management');
    });

    it('should have proper breadcrumb navigation', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Settings', href: '/settings' },
      ];

      renderWithProviders(
        <PageHeader title="Users" breadcrumbs={breadcrumbs} />
      );

      const breadcrumbNav = screen.getByRole('navigation');
      expect(breadcrumbNav).toHaveAttribute('aria-label', 'breadcrumb');
    });

    it('should have accessible links in breadcrumbs', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Applications', href: '/applications' },
        { label: 'Details' },
      ];

      renderWithProviders(
        <PageHeader title="Configuration" breadcrumbs={breadcrumbs} />
      );

      const homeLink = screen.getByRole('link', { name: /Home/ });
      const appLink = screen.getByRole('link', { name: /Applications/ });

      expect(homeLink).toHaveAttribute('href', '/');
      expect(appLink).toHaveAttribute('href', '/applications');
    });

    it('should maintain accessibility during loading state', () => {
      renderWithProviders(
        <PageHeader title="Users" loading={true} />
      );

      // Skeleton elements should not interfere with screen readers
      const skeletons = screen.getAllByTestId(/loading/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation for links', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Settings', href: '/settings' },
      ];

      renderWithProviders(
        <PageHeader title="Users" breadcrumbs={breadcrumbs} />
      );

      const homeLink = screen.getByRole('link', { name: /Home/ });
      const settingsLink = screen.getByRole('link', { name: /Settings/ });

      expect(homeLink).toHaveAttribute('tabIndex', '0');
      expect(settingsLink).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined optional props gracefully', () => {
      expect(() => {
        renderWithProviders(
          <PageHeader
            title="Test"
            description={undefined}
            breadcrumbs={undefined}
            actions={undefined}
            badge={undefined}
          />
        );
      }).not.toThrow();
    });

    it('should handle empty string title', () => {
      renderWithProviders(<PageHeader title="" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle empty breadcrumbs array', () => {
      renderWithProviders(<PageHeader title="Users" breadcrumbs={[]} />);

      expect(screen.getByText('Users')).toBeInTheDocument();
      // Should not render breadcrumb navigation
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should handle null actions', () => {
      renderWithProviders(<PageHeader title="Users" actions={null} />);

      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should handle boolean loading prop', () => {
      renderWithProviders(<PageHeader title="Users" loading={false} />);

      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long breadcrumb labels', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        {
          label: 'Very Long Section Name That Might Cause Layout Issues',
          href: '/long-section'
        },
      ];

      renderWithProviders(
        <PageHeader title="Page" breadcrumbs={breadcrumbs} />
      );

      expect(screen.getByText('Very Long Section Name That Might Cause Layout Issues')).toBeInTheDocument();
    });

    it('should handle special characters in title and description', () => {
      const specialTitle = "Users & Permissions @ Company™";
      const specialDescription = "Manage user permissions & access controls (β version)";

      renderWithProviders(
        <PageHeader title={specialTitle} description={specialDescription} />
      );

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });

    it('should handle breadcrumbs with special characters', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Settings & Config', href: '/settings' },
        { label: 'User Roles (Admin)' },
      ];

      renderWithProviders(
        <PageHeader title="Permissions" breadcrumbs={breadcrumbs} />
      );

      expect(screen.getByText('Settings & Config')).toBeInTheDocument();
      expect(screen.getByText('User Roles (Admin)')).toBeInTheDocument();
    });

    it('should handle complex nested icons in breadcrumbs', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        {
          label: 'Users',
          href: '/users',
          icon: (
            <PersonIcon>
              <SettingsIcon />
            </PersonIcon>
          )
        },
      ];

      renderWithProviders(
        <PageHeader title="User Details" breadcrumbs={breadcrumbs} />
      );

      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should handle multiple loading states', () => {
      const { rerender } = renderWithProviders(
        <PageHeader title="Users" loading={true} />
      );

      // Initially loading
      expect(screen.getByText('Users')).not.toBeInTheDocument();

      // Stop loading
      rerender(
        <MemoryRouter>
          <ThemeProvider theme={createTheme()}>
            <PageHeader title="Users" loading={false} />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily with same props', () => {
      const { rerender } = renderWithProviders(
        <PageHeader title="Dashboard" />
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <MemoryRouter>
          <ThemeProvider theme={createTheme()}>
            <PageHeader title="Dashboard" />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = renderWithProviders(
        <PageHeader title="Users" />
      );

      expect(screen.getByText('Users')).toBeInTheDocument();

      // Change title
      rerender(
        <MemoryRouter>
          <ThemeProvider theme={createTheme()}>
            <PageHeader title="Applications" />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });
  });
});
