import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Stepper,
  Step,
  StepLabel,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Home,
  NavigateNext,
  MoreVert,
  Person,
  Settings,
  Logout,
  Edit,
  Delete,
  Share,
} from '@mui/icons-material';

const meta: Meta = {
  title: 'Material-UI Components/Navigation',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navigation components styled with the Admiral Design System theme.',
      },
    },
  },
};

export default meta;

export const TabsComponent: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState(0);
    const [verticalValue, setVerticalValue] = React.useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };

    const handleVerticalChange = (_event: React.SyntheticEvent, newValue: number) => {
      setVerticalValue(newValue);
    };

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Tabs</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={value} onChange={handleChange}>
              <Tab label="Dashboard" />
              <Tab label="Analytics" />
              <Tab label="Settings" />
              <Tab label="Profile" />
            </Tabs>
          </Box>
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            {value === 0 && <Typography>Dashboard content goes here...</Typography>}
            {value === 1 && <Typography>Analytics content goes here...</Typography>}
            {value === 2 && <Typography>Settings content goes here...</Typography>}
            {value === 3 && <Typography>Profile content goes here...</Typography>}
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Scrollable Tabs</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={0}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Item One" />
              <Tab label="Item Two" />
              <Tab label="Item Three" />
              <Tab label="Item Four" />
              <Tab label="Item Five" />
              <Tab label="Item Six" />
              <Tab label="Item Seven" />
              <Tab label="Item Eight" />
            </Tabs>
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Colored Tabs</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={0} textColor="secondary" indicatorColor="secondary">
              <Tab label="Secondary" />
              <Tab label="Color" />
              <Tab label="Tabs" />
            </Tabs>
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Vertical Tabs</Typography>
          <Box sx={{ display: 'flex', height: 224 }}>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={verticalValue}
              onChange={handleVerticalChange}
              sx={{ borderRight: 1, borderColor: 'divider', minWidth: 120 }}
            >
              <Tab label="Item One" />
              <Tab label="Item Two" />
              <Tab label="Item Three" />
              <Tab label="Item Four" />
            </Tabs>
            <Box sx={{ p: 3, flex: 1 }}>
              {verticalValue === 0 && <Typography>Vertical tab content 1</Typography>}
              {verticalValue === 1 && <Typography>Vertical tab content 2</Typography>}
              {verticalValue === 2 && <Typography>Vertical tab content 3</Typography>}
              {verticalValue === 3 && <Typography>Vertical tab content 4</Typography>}
            </Box>
          </Box>
        </Box>
      </Stack>
    );
  },
};

export const BreadcrumbsComponent: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Basic Breadcrumbs</Typography>
        <Breadcrumbs>
          <Link underline="hover" color="inherit" href="/">
            Home
          </Link>
          <Link underline="hover" color="inherit" href="/catalog">
            Catalog
          </Link>
          <Typography color="text.primary">Accessories</Typography>
        </Breadcrumbs>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Breadcrumbs with Icons</Typography>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
            href="/"
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
            href="/catalog"
          >
            Catalog
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            Accessories
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Collapsed Breadcrumbs</Typography>
        <Breadcrumbs maxItems={2}>
          <Link underline="hover" color="inherit" href="/">
            Home
          </Link>
          <Link underline="hover" color="inherit" href="/catalog">
            Catalog
          </Link>
          <Link underline="hover" color="inherit" href="/accessories">
            Accessories
          </Link>
          <Link underline="hover" color="inherit" href="/new-collection">
            New Collection
          </Link>
          <Typography color="text.primary">Belts</Typography>
        </Breadcrumbs>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Custom Separator</Typography>
        <Breadcrumbs separator="›">
          <Link underline="hover" color="inherit" href="/">
            Home
          </Link>
          <Link underline="hover" color="inherit" href="/catalog">
            Catalog
          </Link>
          <Typography color="text.primary">Accessories</Typography>
        </Breadcrumbs>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Breadcrumbs with Chips</Typography>
        <Breadcrumbs>
          <Chip
            label="Home"
            onClick={() => {}}
            variant="outlined"
            size="small"
          />
          <Chip
            label="Products"
            onClick={() => {}}
            variant="outlined"
            size="small"
          />
          <Chip
            label="Electronics"
            color="primary"
            size="small"
          />
        </Breadcrumbs>
      </Box>
    </Stack>
  ),
};

export const StepperComponent: StoryObj = {
  render: () => {
    const [activeStep, setActiveStep] = React.useState(1);

    const steps = [
      'Select campaign settings',
      'Create an ad group',
      'Create an ad',
      'Review and publish',
    ];

    const verticalSteps = [
      {
        label: 'Account Setup',
        description: 'Create your account and verify your email address.',
      },
      {
        label: 'Profile Information',
        description: 'Add your personal and business information.',
      },
      {
        label: 'Verification',
        description: 'Verify your identity and business documents.',
      },
      {
        label: 'Complete',
        description: 'Your account is ready to use.',
      },
    ];

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Horizontal Stepper</Typography>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => prev - 1)}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Alternative Label</Typography>
          <Stepper activeStep={1} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Vertical Stepper</Typography>
          <Stepper activeStep={1} orientation="vertical">
            {verticalSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  {step.label}
                </StepLabel>
                <Box sx={{ ml: 4, mt: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  {index < 2 && (
                    <Box sx={{ mt: 1 }}>
                      <Button variant="contained" size="small" sx={{ mr: 1 }}>
                        Continue
                      </Button>
                      <Button size="small">
                        Skip
                      </Button>
                    </Box>
                  )}
                </Box>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Non-linear Stepper</Typography>
          <Stepper nonLinear activeStep={activeStep}>
            {steps.map((label, index) => (
              <Step key={label} completed={index < activeStep}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Stack>
    );
  },
};

export const MenuComponent: StoryObj = {
  render: () => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const open2 = Boolean(anchorEl2);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl2(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleClose2 = () => {
      setAnchorEl2(null);
    };

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Menu</Typography>
          <Button
            onClick={handleClick}
            variant="contained"
            endIcon={<MoreVert />}
          >
            Open Menu
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Menu with Icons</Typography>
          <IconButton
            onClick={handleClick2}
            size="small"
            sx={{ ml: 2 }}
          >
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl2}
            open={open2}
            onClose={handleClose2}
          >
            <MenuItem onClick={handleClose2}>
              <Person sx={{ mr: 2 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleClose2}>
              <Settings sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleClose2}>
              <Logout sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Static Menu (Menu List)</Typography>
          <Paper sx={{ width: 320, maxWidth: '100%' }}>
            <MenuList>
              <MenuItem>
                <Person sx={{ mr: 2 }} />
                Profile
              </MenuItem>
              <MenuItem>
                <Edit sx={{ mr: 2 }} />
                Edit
              </MenuItem>
              <MenuItem>
                <Share sx={{ mr: 2 }} />
                Share
              </MenuItem>
              <MenuItem>
                <Delete sx={{ mr: 2 }} />
                Delete
              </MenuItem>
            </MenuList>
          </Paper>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Dense Menu</Typography>
          <Paper sx={{ width: 320, maxWidth: '100%' }}>
            <MenuList dense>
              <MenuItem>
                <Person sx={{ mr: 2 }} fontSize="small" />
                <Typography variant="body2">Profile</Typography>
              </MenuItem>
              <MenuItem>
                <Settings sx={{ mr: 2 }} fontSize="small" />
                <Typography variant="body2">Settings</Typography>
              </MenuItem>
              <MenuItem>
                <Share sx={{ mr: 2 }} fontSize="small" />
                <Typography variant="body2">Share</Typography>
              </MenuItem>
              <MenuItem disabled>
                <Delete sx={{ mr: 2 }} fontSize="small" />
                <Typography variant="body2">Delete (Disabled)</Typography>
              </MenuItem>
            </MenuList>
          </Paper>
        </Box>
      </Stack>
    );
  },
};
