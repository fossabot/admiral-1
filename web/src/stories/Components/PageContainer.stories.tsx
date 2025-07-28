import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import { PageContainer } from '@/components';

const meta: Meta<typeof PageContainer> = {
  title: 'Components/PageContainer',
  component: PageContainer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', false],
      description: 'Maximum width of the container',
    },
    variant: {
      control: 'select',
      options: ['standard', 'simple'],
      description: 'Visual variant of the container',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Sample Page Content
    </Typography>
    <Typography variant="body1" paragraph>
      This is example content to demonstrate how the PageContainer component works.
      The container provides consistent spacing and layout for page content.
    </Typography>
    <Typography variant="body1" paragraph>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
      nostrud exercitation ullamco laboris.
    </Typography>
  </Box>
);

export const Standard: Story = {
  args: {
    variant: 'standard',
    maxWidth: 'lg',
  },
  render: (args) => (
    <PageContainer {...args}>
      <SampleContent />
    </PageContainer>
  ),
};

export const Simple: Story = {
  args: {
    variant: 'simple',
    maxWidth: 'lg',
  },
  render: (args) => (
    <PageContainer {...args}>
      <SampleContent />
    </PageContainer>
  ),
};

export const ExtraLarge: Story = {
  args: {
    variant: 'simple',
    maxWidth: 'xl',
  },
  render: (args) => (
    <PageContainer {...args}>
      <SampleContent />
    </PageContainer>
  ),
};

export const Small: Story = {
  args: {
    variant: 'standard',
    maxWidth: 'sm',
  },
  render: (args) => (
    <PageContainer {...args}>
      <SampleContent />
    </PageContainer>
  ),
};
