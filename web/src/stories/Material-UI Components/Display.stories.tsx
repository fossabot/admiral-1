import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Typography,
  Chip,
  Badge,
  Avatar,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Box,
  Stack,
  Grid,
  Button,
  IconButton,
  AvatarGroup,
  Divider,
} from '@mui/material';
import {
  Person,
  Email,
  Notifications,
  Settings,
  Home,
  Work,
  School,
  MoreVert,
  Face,
  Group,
  Business,
} from '@mui/icons-material';

const meta: Meta = {
  title: 'Material-UI Components/Display',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Display components styled with the Admiral Design System theme.',
      },
    },
  },
};

export default meta;

export const TypographyScale: StoryObj = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Headings</Typography>
        <Stack spacing={1}>
          <Typography variant="h1">H1 - Main Title</Typography>
          <Typography variant="h2">H2 - Section Header</Typography>
          <Typography variant="h3">H3 - Subsection</Typography>
          <Typography variant="h4">H4 - Component Title</Typography>
          <Typography variant="h5">H5 - Small Header</Typography>
          <Typography variant="h6">H6 - Subheader</Typography>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Body Text</Typography>
        <Stack spacing={2}>
          <Typography variant="body1">
            Body1 - This is the primary body text used for most content. It provides good readability
            and is the default size for paragraphs and longer content blocks.
          </Typography>
          <Typography variant="body2">
            Body2 - This is secondary body text, typically used for captions, descriptions,
            or less prominent content that still needs to be readable.
          </Typography>
          <Typography variant="subtitle1">
            Subtitle1 - Used for larger subtitles and important secondary information.
          </Typography>
          <Typography variant="subtitle2">
            Subtitle2 - Used for smaller subtitles and secondary headings.
          </Typography>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Utility Text</Typography>
        <Stack spacing={1}>
          <Typography variant="caption">Caption - Small text for labels and metadata</Typography>
          <Typography variant="overline">OVERLINE - UPPERCASE TEXT FOR CATEGORIES</Typography>
          <Typography variant="button">BUTTON TEXT</Typography>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Text Colors</Typography>
        <Stack spacing={1}>
          <Typography color="primary">Primary color text</Typography>
          <Typography color="secondary">Secondary color text</Typography>
          <Typography color="error">Error color text</Typography>
          <Typography color="warning">Warning color text</Typography>
          <Typography color="info">Info color text</Typography>
          <Typography color="success">Success color text</Typography>
          <Typography color="text.primary">Primary text color</Typography>
          <Typography color="text.secondary">Secondary text color</Typography>
          <Typography color="text.disabled">Disabled text color</Typography>
        </Stack>
      </Box>
    </Stack>
  ),
};

export const Chips: StoryObj = {
  render: () => {
    const [chips, setChips] = React.useState([
      { id: 1, label: 'React', color: 'primary' as const },
      { id: 2, label: 'TypeScript', color: 'secondary' as const },
      { id: 3, label: 'Material-UI', color: 'success' as const },
    ]);

    const handleDelete = (chipToDelete: typeof chips[0]) => {
      setChips((chips) => chips.filter((chip) => chip.id !== chipToDelete.id));
    };

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Chip Variants</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip label="Filled" variant="filled" />
            <Chip label="Outlined" variant="outlined" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Chip Colors</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip label="Default" />
            <Chip label="Primary" color="primary" />
            <Chip label="Secondary" color="secondary" />
            <Chip label="Success" color="success" />
            <Chip label="Error" color="error" />
            <Chip label="Warning" color="warning" />
            <Chip label="Info" color="info" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Chip Sizes</Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip label="Small" size="small" />
            <Chip label="Medium" size="medium" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Chips with Icons</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip icon={<Face />} label="With Icon" />
            <Chip icon={<Home />} label="Home" color="primary" />
            <Chip avatar={<Avatar>A</Avatar>} label="With Avatar" />
            <Chip avatar={<Avatar src="/api/placeholder/24/24" />} label="Avatar Image" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Interactive Chips</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip label="Clickable" onClick={() => alert('Chip clicked!')} />
            <Chip label="Deletable" onDelete={() => alert('Delete clicked!')} />
            <Chip
              label="Both"
              onClick={() => alert('Chip clicked!')}
              onDelete={() => alert('Delete clicked!')}
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Dynamic Chip Array</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {chips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                color={chip.color}
                onDelete={() => handleDelete(chip)}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    );
  },
};

export const Badges: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Badge Colors</Typography>
        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" useFlexGap>
          <Badge badgeContent={4} color="primary">
            <Notifications />
          </Badge>
          <Badge badgeContent={4} color="secondary">
            <Notifications />
          </Badge>
          <Badge badgeContent={4} color="error">
            <Notifications />
          </Badge>
          <Badge badgeContent={4} color="warning">
            <Notifications />
          </Badge>
          <Badge badgeContent={4} color="info">
            <Notifications />
          </Badge>
          <Badge badgeContent={4} color="success">
            <Notifications />
          </Badge>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Badge Variants</Typography>
        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" useFlexGap>
          <Badge badgeContent={4} variant="standard">
            <Notifications />
          </Badge>
          <Badge badgeContent={4} variant="dot">
            <Notifications />
          </Badge>
          <Badge color="error" variant="dot">
            <Notifications />
          </Badge>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Badge Content</Typography>
        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" useFlexGap>
          <Badge badgeContent={1}>
            <Email />
          </Badge>
          <Badge badgeContent={23}>
            <Email />
          </Badge>
          <Badge badgeContent={99}>
            <Email />
          </Badge>
          <Badge badgeContent={100}>
            <Email />
          </Badge>
          <Badge badgeContent={1000} max={999}>
            <Email />
          </Badge>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Badge Positioning</Typography>
        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" useFlexGap>
          <Badge
            badgeContent={4}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Notifications />
          </Badge>
          <Badge
            badgeContent={4}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <Notifications />
          </Badge>
          <Badge
            badgeContent={4}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Notifications />
          </Badge>
          <Badge
            badgeContent={4}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <Notifications />
          </Badge>
        </Stack>
      </Box>
    </Stack>
  ),
};

export const Avatars: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Avatar Types</Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Avatar>JD</Avatar>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>AB</Avatar>
          <Avatar src="/api/placeholder/40/40" alt="User Avatar" />
          <Avatar>
            <Person />
          </Avatar>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Avatar Sizes</Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Avatar sx={{ width: 24, height: 24 }}>S</Avatar>
          <Avatar sx={{ width: 32, height: 32 }}>M</Avatar>
          <Avatar>D</Avatar>
          <Avatar sx={{ width: 56, height: 56 }}>L</Avatar>
          <Avatar sx={{ width: 72, height: 72 }}>XL</Avatar>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Avatar Colors</Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Avatar sx={{ bgcolor: 'primary.main' }}>P</Avatar>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>S</Avatar>
          <Avatar sx={{ bgcolor: 'error.main' }}>E</Avatar>
          <Avatar sx={{ bgcolor: 'warning.main' }}>W</Avatar>
          <Avatar sx={{ bgcolor: 'info.main' }}>I</Avatar>
          <Avatar sx={{ bgcolor: 'success.main' }}>S</Avatar>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Avatar Variants</Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Avatar variant="circular">C</Avatar>
          <Avatar variant="rounded">R</Avatar>
          <Avatar variant="square">S</Avatar>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Avatar Group</Typography>
        <AvatarGroup max={4}>
          <Avatar alt="User 1" src="/api/placeholder/40/40" />
          <Avatar alt="User 2">AB</Avatar>
          <Avatar alt="User 3" src="/api/placeholder/40/40" />
          <Avatar alt="User 4">CD</Avatar>
          <Avatar alt="User 5" src="/api/placeholder/40/40" />
          <Avatar alt="User 6">EF</Avatar>
        </AvatarGroup>
      </Box>
    </Stack>
  ),
};

export const Cards: StoryObj = {
  render: () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Simple Card
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is a simple card with just content. Cards are used to display
              information in a structured way.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Card with Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This card includes action buttons at the bottom.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small">Learn More</Button>
            <Button size="small" variant="contained">Action</Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="h6" component="h2">
                  User Profile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Online now
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2">
              This card shows user information with an avatar and status indicator.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" startIcon={<Email />}>
              Message
            </Button>
            <IconButton>
              <MoreVert />
            </IconButton>
          </CardActions>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Outlined Card
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card uses the outlined variant for a different visual style.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Colored Card
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              This card uses custom background and text colors.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" sx={{ color: 'primary.contrastText' }}>
              Action
            </Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Statistics Card
              </Typography>
              <Chip label="New" color="success" size="small" />
            </Box>
            <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
              1,234
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total users this month
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  ),
};

export const Lists: StoryObj = {
  render: () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Simple List</Typography>
        <List>
          <ListItem>
            <ListItemText primary="Item 1" />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Item 2" secondary="With description" />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Item 3" secondary="Another description" />
          </ListItem>
        </List>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>List with Icons</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" secondary="Dashboard" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Work />
            </ListItemIcon>
            <ListItemText primary="Work" secondary="Projects and tasks" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <School />
            </ListItemIcon>
            <ListItemText primary="Education" secondary="Courses and certifications" />
          </ListItem>
        </List>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>List with Avatars</Typography>
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Person />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="John Doe" secondary="Software Engineer" />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Business />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Jane Smith" secondary="Product Manager" />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Group />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Team Lead" secondary="Development Team" />
          </ListItem>
        </List>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Interactive List</Typography>
        <List>
          <ListItem component="button" onClick={() => alert('Settings clicked')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem component="button" onClick={() => alert('Notifications clicked')}>
            <ListItemIcon>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Notifications" secondary="3 new messages" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary="Profile" />
            <IconButton edge="end" onClick={(e) => { e.stopPropagation(); alert('More options clicked'); }}>
              <MoreVert />
            </IconButton>
          </ListItem>
        </List>
      </Grid>
    </Grid>
  ),
};
