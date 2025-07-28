import { render, screen } from '@testing-library/react';
import { PageContainer } from './PageContainer';

describe('PageContainer', () => {
  it('renders children correctly', () => {
    render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies standard variant styles', () => {
    const { container } = render(
      <PageContainer variant="standard">
        <div>Test content</div>
      </PageContainer>
    );

    // Check that the container has standard variant specific styles
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('MuiContainer-root');
    expect(element).toHaveClass('MuiContainer-maxWidthLg');
  });

  it('applies simple variant styles', () => {
    const { container } = render(
      <PageContainer variant="simple">
        <div>Test content</div>
      </PageContainer>
    );

    // Check that the container has simple variant default maxWidth (lg)
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('MuiContainer-root');
    expect(element).toHaveClass('MuiContainer-maxWidthLg');
  });

  it('accepts custom maxWidth', () => {
    const { container } = render(
      <PageContainer maxWidth="xl">
        <div>Test content</div>
      </PageContainer>
    );

    // Check that the container uses the custom xl maxWidth
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('MuiContainer-root');
    expect(element).toHaveClass('MuiContainer-maxWidthXl');
  });
});
