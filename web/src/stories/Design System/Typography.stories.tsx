import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const meta: Meta = {
  title: 'Design System/Typography',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Admiral typography system with consistent font scales, weights, and usage guidelines.',
      },
    },
  },
};

export default meta;

const typographyVariants = [
  { variant: 'h1', label: 'Heading 1', usage: 'Page titles, main headings' },
  { variant: 'h2', label: 'Heading 2', usage: 'Section titles' },
  { variant: 'h3', label: 'Heading 3', usage: 'Subsection titles' },
  { variant: 'h4', label: 'Heading 4', usage: 'Card titles, dialog titles' },
  { variant: 'h5', label: 'Heading 5', usage: 'Component titles' },
  { variant: 'h6', label: 'Heading 6', usage: 'Small headings, labels' },
  { variant: 'subtitle1', label: 'Subtitle 1', usage: 'Large subtitles' },
  { variant: 'subtitle2', label: 'Subtitle 2', usage: 'Medium subtitles' },
  { variant: 'body1', label: 'Body 1', usage: 'Main body text, paragraphs' },
  { variant: 'body2', label: 'Body 2', usage: 'Secondary body text' },
  { variant: 'button', label: 'Button', usage: 'Button text, CTAs' },
  { variant: 'caption', label: 'Caption', usage: 'Image captions, small text' },
  { variant: 'overline', label: 'Overline', usage: 'Labels, categories' },
] as const;

const fontWeights = [
  { weight: 300, name: 'Light', usage: 'Decorative text' },
  { weight: 400, name: 'Regular', usage: 'Body text, default' },
  { weight: 500, name: 'Medium', usage: 'Emphasis, subtitles' },
  { weight: 600, name: 'Semi Bold', usage: 'Headings, strong emphasis' },
  { weight: 700, name: 'Bold', usage: 'Important headings' },
];

export const TypographyScale: StoryObj = {
  render: () => {
    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Typography Scale
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The typography system provides consistent text styling across the application.
          </Typography>

          <Card>
            <CardContent>
              <Stack spacing={3}>
                {typographyVariants.map(({ variant, label, usage }) => (
                  <Box key={variant}>
                    <Typography
                      variant={variant as keyof typeof Typography}
                      sx={{ mb: 0.5 }}
                    >
                      {label} - The quick brown fox jumps over the lazy dog
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {usage}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    );
  },
};

export const FontWeights: StoryObj = {
  render: () => {
    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Font Weights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Available font weights for creating hierarchy and emphasis.
          </Typography>

          <Card>
            <CardContent>
              <Stack spacing={2}>
                {fontWeights.map(({ weight, name, usage }) => (
                  <Box key={weight}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: weight, mb: 0.5 }}
                    >
                      {name} ({weight}) - The quick brown fox jumps over the lazy dog
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {usage}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    );
  },
};

export const TypographySpecs: StoryObj = {
  render: () => {
    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Typography Specifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Technical details for each typography variant including font size, line height, and recommended usage.
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Variant</strong></TableCell>
                  <TableCell><strong>Font Size</strong></TableCell>
                  <TableCell><strong>Line Height</strong></TableCell>
                  <TableCell><strong>Font Weight</strong></TableCell>
                  <TableCell><strong>Usage</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>h1</TableCell>
                  <TableCell>2.125rem (34px)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>300</TableCell>
                  <TableCell>Page titles, main headings</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>h2</TableCell>
                  <TableCell>1.5rem (24px)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>300</TableCell>
                  <TableCell>Section titles</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>h3</TableCell>
                  <TableCell>1.25rem (20px)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>400</TableCell>
                  <TableCell>Subsection titles</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>h4</TableCell>
                  <TableCell>1.125rem (18px)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>400</TableCell>
                  <TableCell>Card titles, dialog titles</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>h5</TableCell>
                  <TableCell>1rem (16px)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>400</TableCell>
                  <TableCell>Component titles</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>h6</TableCell>
                  <TableCell>0.875rem (14px)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>500</TableCell>
                  <TableCell>Small headings, labels</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>body1</TableCell>
                  <TableCell>1rem (16px)</TableCell>
                  <TableCell>1.5</TableCell>
                  <TableCell>400</TableCell>
                  <TableCell>Main body text, paragraphs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>body2</TableCell>
                  <TableCell>0.875rem (14px)</TableCell>
                  <TableCell>1.43</TableCell>
                  <TableCell>400</TableCell>
                  <TableCell>Secondary body text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>caption</TableCell>
                  <TableCell>0.75rem (12px)</TableCell>
                  <TableCell>1.66</TableCell>
                  <TableCell>400</TableCell>
                  <TableCell>Image captions, small text</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    );
  },
};

// All typography story removed due to ESLint parsing issues with .render() calls
