import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Alert,
  AlertTitle,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Close,
} from '@mui/icons-material';

const meta: Meta = {
  title: 'Material-UI Components/Feedback',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Feedback components styled with the Admiral Design System theme.',
      },
    },
  },
};

export default meta;

export const Alerts: StoryObj = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Alert Severities</Typography>
        <Stack spacing={2}>
          <Alert severity="success">
            This is a success alert — check it out!
          </Alert>
          <Alert severity="info">
            This is an info alert — check it out!
          </Alert>
          <Alert severity="warning">
            This is a warning alert — check it out!
          </Alert>
          <Alert severity="error">
            This is an error alert — check it out!
          </Alert>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Alert Variants</Typography>
        <Stack spacing={2}>
          <Alert severity="success" variant="filled">
            This is a filled success alert!
          </Alert>
          <Alert severity="info" variant="outlined">
            This is an outlined info alert!
          </Alert>
          <Alert severity="warning" variant="standard">
            This is a standard warning alert!
          </Alert>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Alerts with Titles</Typography>
        <Stack spacing={2}>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            This is an error alert with a title — <strong>check it out!</strong>
          </Alert>
          <Alert severity="warning">
            <AlertTitle>Warning</AlertTitle>
            This is a warning alert with a title — <strong>check it out!</strong>
          </Alert>
          <Alert severity="info">
            <AlertTitle>Info</AlertTitle>
            This is an info alert with a title — <strong>check it out!</strong>
          </Alert>
          <Alert severity="success">
            <AlertTitle>Success</AlertTitle>
            This is a success alert with a title — <strong>check it out!</strong>
          </Alert>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Dismissible Alerts</Typography>
        <Stack spacing={2}>
          <Alert
            severity="info"
            onClose={() => {}}
          >
            This alert can be dismissed!
          </Alert>
          <Alert
            severity="success"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {}}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
          >
            This alert has a custom close button!
          </Alert>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Alerts with Actions</Typography>
        <Stack spacing={2}>
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small">
                UNDO
              </Button>
            }
          >
            This alert has an action button!
          </Alert>
          <Alert
            severity="info"
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small">
                  RETRY
                </Button>
                <Button color="inherit" size="small">
                  CANCEL
                </Button>
              </Stack>
            }
          >
            This alert has multiple action buttons!
          </Alert>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Custom Icons</Typography>
        <Stack spacing={2}>
          <Alert icon={<CheckCircle fontSize="inherit" />} severity="success">
            Custom success icon
          </Alert>
          <Alert icon={false} severity="error">
            No icon
          </Alert>
        </Stack>
      </Box>
    </Stack>
  ),
};

export const SnackbarComponent: StoryObj = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [open2, setOpen2] = React.useState(false);
    const [open3, setOpen3] = React.useState(false);

    const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpen(false);
    };

    const handleClose2 = (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpen2(false);
    };

    const handleClose3 = (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpen3(false);
    };

    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Snackbar</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Show Snackbar
          </Button>
          <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
            message="This is a simple snackbar message"
          />
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Snackbar with Action</Typography>
          <Button variant="contained" onClick={() => setOpen2(true)}>
            Show Snackbar with Action
          </Button>
          <Snackbar
            open={open2}
            autoHideDuration={6000}
            onClose={handleClose2}
            message="This snackbar has an action"
            action={
              <React.Fragment>
                <Button color="secondary" size="small" onClick={handleClose2}>
                  UNDO
                </Button>
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={handleClose2}
                >
                  <Close fontSize="small" />
                </IconButton>
              </React.Fragment>
            }
          />
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Snackbar with Alert</Typography>
          <Button variant="contained" onClick={() => setOpen3(true)}>
            Show Alert Snackbar
          </Button>
          <Snackbar open={open3} autoHideDuration={6000} onClose={handleClose3}>
            <Alert onClose={handleClose3} severity="success" sx={{ width: '100%' }}>
              This is a success message in a snackbar!
            </Alert>
          </Snackbar>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Positioned Snackbars</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              onClick={() => {
                // Demo purposes - would normally show at different positions
                setOpen(true);
              }}
            >
              Top Center
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpen(true);
              }}
            >
              Bottom Left
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpen(true);
              }}
            >
              Bottom Right
            </Button>
          </Stack>
        </Box>
      </Stack>
    );
  },
};

export const Progress: StoryObj = {
  render: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            return 0;
          }
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 100);
        });
      }, 500);

      return () => {
        clearInterval(timer);
      };
    }, []);

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Circular Progress</Typography>
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
            <CircularProgress />
            <CircularProgress color="secondary" />
            <CircularProgress color="success" />
            <CircularProgress color="error" />
            <CircularProgress color="warning" />
            <CircularProgress color="info" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Circular Progress Sizes</Typography>
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
            <CircularProgress size={20} />
            <CircularProgress size={30} />
            <CircularProgress />
            <CircularProgress size={50} />
            <CircularProgress size={60} />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Determinate Circular Progress</Typography>
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
            <CircularProgress variant="determinate" value={25} />
            <CircularProgress variant="determinate" value={50} />
            <CircularProgress variant="determinate" value={75} />
            <CircularProgress variant="determinate" value={100} />
            <CircularProgress variant="determinate" value={progress} />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Linear Progress</Typography>
          <Stack spacing={2}>
            <LinearProgress />
            <LinearProgress color="secondary" />
            <LinearProgress color="success" />
            <LinearProgress color="error" />
            <LinearProgress color="warning" />
            <LinearProgress color="info" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Determinate Linear Progress</Typography>
          <Stack spacing={2}>
            <LinearProgress variant="determinate" value={progress} />
            <LinearProgress variant="determinate" value={progress} color="secondary" />
            <LinearProgress variant="buffer" value={progress} valueBuffer={progress + 10} />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Progress with Labels</Typography>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {`${Math.round(progress)}%`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress variant="determinate" value={progress} size={60} />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(progress)}%`}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Stack>
    );
  },
};

export const Skeletons: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Basic Skeletons</Typography>
        <Stack spacing={1}>
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" width={210} height={60} />
          <Skeleton variant="rounded" width={210} height={60} />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Animation Variants</Typography>
        <Stack spacing={1}>
          <Skeleton animation="pulse" />
          <Skeleton animation="wave" />
          <Skeleton animation={false} />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Card Skeleton</Typography>
        <Card sx={{ maxWidth: 345 }}>
          <Skeleton variant="rectangular" height={140} />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              <Skeleton />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <Skeleton />
              <Skeleton />
              <Skeleton width="60%" />
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>List Skeleton</Typography>
        <Stack spacing={1}>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
              <Skeleton variant="circular">
                <Avatar />
              </Skeleton>
              <Box sx={{ ml: 2, flex: 1 }}>
                <Skeleton width="40%" />
                <Skeleton width="60%" />
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Responsive Skeleton</Typography>
        <Box>
          <Skeleton
            sx={{ bgcolor: 'grey.300' }}
            variant="rectangular"
            width="100%"
            height={200}
          />
          <Box sx={{ pt: 0.5 }}>
            <Skeleton />
            <Skeleton width="60%" />
          </Box>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Custom Colored Skeleton</Typography>
        <Stack spacing={1}>
          <Skeleton sx={{ bgcolor: 'primary.light' }} />
          <Skeleton sx={{ bgcolor: 'secondary.light' }} />
          <Skeleton sx={{ bgcolor: 'success.light' }} />
        </Stack>
      </Box>
    </Stack>
  ),
};
