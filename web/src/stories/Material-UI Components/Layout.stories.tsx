import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Grid,
  Stack,
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
} from '@mui/material';

const meta: Meta = {
  title: 'Material-UI Components/Layout',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Layout components styled with the Admiral Design System theme.',
      },
    },
  },
};

export default meta;

// Demo component for showcasing layout
const Item = ({ children, color = 'primary.main', height = 60, ...props }: { children: React.ReactNode; color?: string; height?: number; sx?: object }) => (
  <Paper
    sx={{
      padding: 2,
      textAlign: 'center',
      backgroundColor: color,
      color: 'white',
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

export const GridSystem: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Basic Grid</Typography>
        <Grid container spacing={2}>
          <Grid size={8}>
            <Item>xs=8</Item>
          </Grid>
          <Grid size={4}>
            <Item color="secondary.main">xs=4</Item>
          </Grid>
          <Grid size={4}>
            <Item color="success.main">xs=4</Item>
          </Grid>
          <Grid size={8}>
            <Item color="error.main">xs=8</Item>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Responsive Grid</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Item>xs=12 sm=6 md=4</Item>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Item color="secondary.main">xs=12 sm=6 md=4</Item>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Item color="success.main">xs=12 sm=6 md=4</Item>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 8 }}>
            <Item color="warning.main">xs=12 sm=6 md=8</Item>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Item color="info.main">xs=12 sm=6 md=4</Item>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Grid with Different Spacing</Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={4}>
            <Item height={40}>spacing=1</Item>
          </Grid>
          <Grid size={4}>
            <Item height={40} color="secondary.main">spacing=1</Item>
          </Grid>
          <Grid size={4}>
            <Item height={40} color="success.main">spacing=1</Item>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={4}>
            <Item height={40}>spacing=3</Item>
          </Grid>
          <Grid size={4}>
            <Item height={40} color="secondary.main">spacing=3</Item>
          </Grid>
          <Grid size={4}>
            <Item height={40} color="success.main">spacing=3</Item>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Auto-sizing Grid</Typography>
        <Grid container spacing={3}>
          <Grid size="grow">
            <Item>xs</Item>
          </Grid>
          <Grid size={6}>
            <Item color="secondary.main">xs=6</Item>
          </Grid>
          <Grid size="grow">
            <Item color="success.main">xs</Item>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Nested Grid</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Item color="primary.dark" height={120}>
              <Grid container spacing={1}>
                <Grid size={6}>
                  <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.light' }}>
                    Nested 1
                  </Paper>
                </Grid>
                <Grid size={6}>
                  <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.light' }}>
                    Nested 2
                  </Paper>
                </Grid>
              </Grid>
            </Item>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Item color="secondary.main" height={120}>md=4</Item>
          </Grid>
        </Grid>
      </Box>
    </Stack>
  ),
};

export const StackLayout: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Vertical Stack</Typography>
        <Stack spacing={2}>
          <Item height={40}>Item 1</Item>
          <Item height={40} color="secondary.main">Item 2</Item>
          <Item height={40} color="success.main">Item 3</Item>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Horizontal Stack</Typography>
        <Stack direction="row" spacing={2}>
          <Item height={60} sx={{ flex: 1 }}>Item 1</Item>
          <Item height={60} color="secondary.main" sx={{ flex: 1 }}>Item 2</Item>
          <Item height={60} color="success.main" sx={{ flex: 1 }}>Item 3</Item>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Stack with Different Spacing</Typography>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">spacing=1</Typography>
          <Item height={30}>Item 1</Item>
          <Item height={30} color="secondary.main">Item 2</Item>
          <Item height={30} color="success.main">Item 3</Item>
        </Stack>

        <Stack spacing={4}>
          <Typography variant="body2" color="text.secondary">spacing=4</Typography>
          <Item height={30}>Item 1</Item>
          <Item height={30} color="secondary.main">Item 2</Item>
          <Item height={30} color="success.main">Item 3</Item>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Responsive Stack</Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2, md: 4 }}
        >
          <Item sx={{ flex: 1 }}>Responsive 1</Item>
          <Item color="secondary.main" sx={{ flex: 1 }}>Responsive 2</Item>
          <Item color="success.main" sx={{ flex: 1 }}>Responsive 3</Item>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Stack with Dividers</Typography>
        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem />}
          spacing={2}
        >
          <Item sx={{ flex: 1 }}>Item 1</Item>
          <Item color="secondary.main" sx={{ flex: 1 }}>Item 2</Item>
          <Item color="success.main" sx={{ flex: 1 }}>Item 3</Item>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Stack with useFlexGap</Typography>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          <Item sx={{ minWidth: 100 }}>Flex Item 1</Item>
          <Item color="secondary.main" sx={{ minWidth: 150 }}>Flex Item 2</Item>
          <Item color="success.main" sx={{ minWidth: 120 }}>Flex Item 3</Item>
          <Item color="warning.main" sx={{ minWidth: 180 }}>Flex Item 4</Item>
          <Item color="info.main" sx={{ minWidth: 90 }}>Flex Item 5</Item>
        </Stack>
      </Box>
    </Stack>
  ),
};

export const BoxComponent: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Box with sx prop</Typography>
        <Box
          sx={{
            width: 300,
            height: 100,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          Styled Box
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Box as different components</Typography>
        <Stack spacing={2}>
          <Box component="section" sx={{ p: 2, border: '1px dashed grey' }}>
            Box as section element
          </Box>
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Box as span element
          </Box>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Box with theme values</Typography>
        <Box
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            borderRadius: 2,
            p: 2,
            minWidth: 300,
          }}
        >
          <Box sx={{ color: 'text.secondary' }}>Theme values</Box>
          <Box sx={{ color: 'text.primary', fontSize: 34, fontWeight: 'medium' }}>
            Admiral
          </Box>
          <Box
            sx={{
              color: 'success.main',
              display: 'inline',
              fontWeight: 'bold',
              mx: 0.5,
              fontSize: 14,
            }}
          >
            Design System
          </Box>
          <Box sx={{ color: 'text.secondary', display: 'inline', fontSize: 14 }}>
            with Material-UI
          </Box>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Flexbox Layout with Box</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1, flex: 1, minWidth: 120 }}>
            Flex Item 1
          </Box>
          <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white', borderRadius: 1, flex: 2, minWidth: 120 }}>
            Flex Item 2 (flex: 2)
          </Box>
          <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1, flex: 1, minWidth: 120 }}>
            Flex Item 3
          </Box>
        </Box>
      </Box>
    </Stack>
  ),
};

export const ContainerComponent: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Fixed Container</Typography>
        <Container fixed sx={{ bgcolor: 'primary.light', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Fixed width container</Typography>
        </Container>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Fluid Container</Typography>
        <Container sx={{ bgcolor: 'secondary.light', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Fluid container (default)</Typography>
        </Container>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Container Sizes</Typography>
        <Stack spacing={2}>
          <Container maxWidth="xs" sx={{ bgcolor: 'success.light', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>maxWidth="xs"</Typography>
          </Container>
          <Container maxWidth="sm" sx={{ bgcolor: 'warning.light', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>maxWidth="sm"</Typography>
          </Container>
          <Container maxWidth="md" sx={{ bgcolor: 'info.light', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>maxWidth="md"</Typography>
          </Container>
          <Container maxWidth="lg" sx={{ bgcolor: 'error.light', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>maxWidth="lg"</Typography>
          </Container>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Container with Content</Typography>
        <Container maxWidth="md">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Content Container
            </Typography>
            <Typography paragraph>
              This container has a maximum width of 'md' and contains a paper with content.
              It demonstrates how containers can be used to constrain content width and
              provide consistent layouts across different screen sizes.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Card 1</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Content within the constrained container.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Card 2</Typography>
                    <Typography variant="body2" color="text.secondary">
                      More content within the constrained container.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </Stack>
  ),
};

export const PaperComponent: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Paper Elevations</Typography>
        <Grid container spacing={2}>
          {[0, 1, 3, 6, 12, 24].map((elevation) => (
            <Grid size="auto" key={elevation}>
              <Paper
                elevation={elevation}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  minWidth: 100,
                  minHeight: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                elevation={elevation}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Paper Variants</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', minHeight: 100 }}>
              <Typography variant="h6">Elevation (Default)</Typography>
              <Typography variant="body2" color="text.secondary">
                Standard paper with shadow
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minHeight: 100 }}>
              <Typography variant="h6">Outlined</Typography>
              <Typography variant="body2" color="text.secondary">
                Paper with border instead of shadow
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                minHeight: 100,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="h6">Colored</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Paper with custom background
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Paper as Content Container</Typography>
        <Paper sx={{ p: 3, maxWidth: 600 }}>
          <Typography variant="h5" gutterBottom>
            Article Title
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Published on March 15, 2024
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography paragraph>
            This is an example of using Paper as a content container. Paper provides
            a clean, elevated surface that helps separate content from the background
            and creates visual hierarchy.
          </Typography>
          <Typography paragraph>
            The Admiral theme automatically applies the correct colors, shadows, and
            borders to Paper components, ensuring consistency across your application.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Paper
              variant="outlined"
              sx={{ p: 1, px: 2, display: 'inline-block' }}
            >
              <Typography variant="caption">Tag 1</Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 1, px: 2, display: 'inline-block' }}
            >
              <Typography variant="caption">Tag 2</Typography>
            </Paper>
          </Box>
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Square Paper</Typography>
        <Stack direction="row" spacing={2}>
          <Paper square sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
            Square corners
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
            Rounded corners (default)
          </Paper>
        </Stack>
      </Box>
    </Stack>
  ),
};
