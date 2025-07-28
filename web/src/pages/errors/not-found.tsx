import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import {
  Container,
  Card,
  Stack,
  Typography,
  Button,
  Box
} from '@mui/material';
import {
  SearchOff as SearchOffIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    Sentry.captureException(new Error('Page Not Found'), {
      tags: {
        status: 404,
        path: window.location.pathname,
      },
      extra: {
        fullUrl: window.location.href,
        query: window.location.search,
        referrer: document.referrer || 'none',
      },
    });
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Card
        elevation={6}
        sx={{
          width: '100%',
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <SearchOffIcon
            sx={{
              fontSize: 64,
              color: 'text.disabled',
            }}
          />

          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              lineHeight: 1,
            }}
          >
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 400, lineHeight: 1.6 }}
          >
            The page you're looking for doesn't exist or has been moved.
            Please check the URL or navigate back to a page that exists.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: '100%', mt: 3 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleGoHome}
              startIcon={<HomeIcon />}
              fullWidth
            >
              Go Home
            </Button>

            <Button
              variant="outlined"
              onClick={handleGoBack}
              startIcon={<ArrowBackIcon />}
              fullWidth
            >
              Go Back
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Current path: <code>{window.location.pathname}</code>
            </Typography>
          </Box>
        </Stack>
      </Card>
    </Container>
  );
};

export default NotFoundPage;
